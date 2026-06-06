import nodemailer from "nodemailer";

function isSmtpConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendVerificationEmail(to: string, code: string) {
  // ── Dev fallback: log to console when SMTP isn't configured ──────────────
  if (!isSmtpConfigured()) {
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`  📬  VERIFICATION CODE for ${to}`);
    console.log(`  ➜   ${code}`);
    console.log("  (SMTP not configured — code logged to console)");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const from = process.env.SMTP_FROM ?? `"Phantom Tracker" <noreply@phantomtracker.app>`;

  await transporter.sendMail({
    from,
    to,
    subject: `${code} — Your Phantom Tracker verification code`,
    text: `Your verification code is: ${code}\n\nIt expires in 15 minutes. Do not share it with anyone.`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 16px;">
            <tr><td align="center">
              <table width="420" cellpadding="0" cellspacing="0" style="background:#111111;border:1px solid #222222;border-radius:16px;overflow:hidden;">
                <!-- Header -->
                <tr>
                  <td style="padding:32px 32px 24px;text-align:center;border-bottom:1px solid #1a1a1a;">
                    <div style="display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;background:#7f49c3;border-radius:12px;margin-bottom:16px;">
                      <span style="font-size:22px;">👻</span>
                    </div>
                    <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;letter-spacing:-0.3px;">Phantom Tracker</h1>
                    <p style="margin:8px 0 0;color:#a1a1aa;font-size:13px;">Verify your email address</p>
                  </td>
                </tr>
                <!-- Code -->
                <tr>
                  <td style="padding:32px;">
                    <p style="margin:0 0 20px;color:#a1a1aa;font-size:14px;line-height:1.6;">
                      Enter this 6-digit code to complete your registration. It expires in <strong style="color:#ffffff;">15 minutes</strong>.
                    </p>
                    <div style="background:#1a1a1a;border:1px solid #222222;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
                      <span style="font-family:monospace;font-size:36px;font-weight:700;letter-spacing:12px;color:#7f49c3;">${code}</span>
                    </div>
                    <p style="margin:0;color:#71717a;font-size:12px;text-align:center;">
                      If you didn't create an account, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
      </html>
    `,
  });
}

/** Welcome a newly-verified user. No-op when SMTP isn't configured. */
export async function sendWelcomeEmail(to: string, name?: string | null) {
  if (!isSmtpConfigured()) {
    console.log(`\n  👋 (welcome email skipped — no SMTP) for ${to}\n`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const from = process.env.SMTP_FROM ?? `"Phantom Tracker" <noreply@phantomtracker.app>`;
  const appUrl = process.env.NEXTAUTH_URL ?? "https://phantomtracker.io";
  // Point at /login (pre-filled) rather than /dashboard, so opening this email on
  // any device signs the user into THIS account — not whatever the device was on.
  const openUrl = `${appUrl}/login?email=${encodeURIComponent(to)}`;
  const hi = name ? `Hey ${name}` : "Hey there";

  await transporter.sendMail({
    from,
    to,
    subject: "Welcome to Phantom Tracker 👻",
    text: `${hi},\n\nYour account is verified — welcome to Phantom Tracker!\n\nStart by creating your first habit, check it off each day, and watch your streaks and levels grow.\n\nOpen the app: ${openUrl}\n\nStay consistent.`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 16px;">
            <tr><td align="center">
              <table width="440" cellpadding="0" cellspacing="0" style="background:#111111;border:1px solid #222222;border-radius:16px;overflow:hidden;">
                <tr>
                  <td style="padding:32px 32px 8px;text-align:center;">
                    <div style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;background:#7f49c3;border-radius:14px;margin-bottom:16px;">
                      <span style="font-size:24px;">👻</span>
                    </div>
                    <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">Welcome to Phantom Tracker</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 32px 28px;">
                    <p style="color:#d4d4d8;font-size:15px;line-height:1.6;margin:0 0 16px;">${hi}, your account is verified — you're in. 🎉</p>
                    <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 24px;">
                      Create your first habit, check it off each day, and watch your streaks, levels, and Phantom score grow. Set reminders so you never miss a day.
                    </p>
                    <div style="text-align:center;margin-bottom:20px;">
                      <a href="${openUrl}" style="display:inline-block;background:#7f49c3;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:10px;">Open Phantom Tracker</a>
                    </div>
                    <p style="color:#71717a;font-size:12px;text-align:center;margin:0;">Stay consistent. 👻</p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
      </html>
    `,
  });
}

/** Notify the admin inbox whenever a new user joins. No-op if not configured. */
export async function sendNewUserNotification(newUser: { email: string; name?: string | null }) {
  const to = process.env.ADMIN_NOTIFY_EMAIL;
  if (!to) return; // feature off unless an admin address is set

  if (!isSmtpConfigured()) {
    console.log(`\n  📥 New user joined: ${newUser.email}${newUser.name ? ` (${newUser.name})` : ""}\n`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const from = process.env.SMTP_FROM ?? `"Phantom Tracker" <noreply@phantomtracker.app>`;
  const when = new Date().toUTCString();

  await transporter.sendMail({
    from,
    to,
    subject: `🎉 New Phantom Tracker user: ${newUser.email}`,
    text: `A new user just verified their account.\n\nEmail: ${newUser.email}\nName: ${newUser.name || "—"}\nWhen: ${when}`,
    html: `
      <div style="font-family:system-ui,sans-serif;background:#0a0a0a;padding:32px;color:#fff;">
        <div style="max-width:420px;margin:0 auto;background:#111;border:1px solid #222;border-radius:14px;padding:24px;">
          <h2 style="margin:0 0 4px;font-size:16px;">🎉 New user joined</h2>
          <p style="margin:0 0 16px;color:#a1a1aa;font-size:13px;">Someone just verified their Phantom Tracker account.</p>
          <table style="font-size:14px;width:100%;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#a1a1aa;">Email</td><td style="padding:6px 0;text-align:right;color:#fff;">${newUser.email}</td></tr>
            <tr><td style="padding:6px 0;color:#a1a1aa;">Name</td><td style="padding:6px 0;text-align:right;color:#fff;">${newUser.name || "—"}</td></tr>
            <tr><td style="padding:6px 0;color:#a1a1aa;">When</td><td style="padding:6px 0;text-align:right;color:#fff;">${when}</td></tr>
          </table>
        </div>
      </div>
    `,
  });
}

// ── Account lifecycle emails ──────────────────────────────────────────────────
function makeTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

function emailFrom() {
  return process.env.SMTP_FROM ?? `"Phantom Tracker" <noreply@phantomtracker.app>`;
}

function appUrl() {
  return process.env.NEXTAUTH_URL ?? "https://phantomtracker.io";
}

/** Shared dark email shell. */
function shell(title: string, bodyHtml: string) {
  return `
  <!DOCTYPE html><html><body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 16px;"><tr><td align="center">
      <table width="440" cellpadding="0" cellspacing="0" style="background:#111111;border:1px solid #222222;border-radius:16px;overflow:hidden;">
        <tr><td style="padding:32px 32px 8px;text-align:center;">
          <div style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;background:#7f49c3;border-radius:14px;margin-bottom:16px;"><span style="font-size:24px;">👻</span></div>
          <h1 style="margin:0;color:#ffffff;font-size:21px;font-weight:700;letter-spacing:-0.3px;">${title}</h1>
        </td></tr>
        <tr><td style="padding:12px 32px 28px;">${bodyHtml}</td></tr>
      </table>
    </td></tr></table>
  </body></html>`;
}

/** Confirm the account was disabled (deactivated). */
export async function sendAccountDisabledEmail(to: string, name?: string | null) {
  const hi = name ? `Hi ${name}` : "Hi there";
  if (!isSmtpConfigured()) { console.log(`\n  ⏸️  (account disabled email skipped — no SMTP) for ${to}\n`); return; }
  const url = `${appUrl()}/login?email=${encodeURIComponent(to)}`;
  await makeTransport().sendMail({
    from: emailFrom(), to,
    subject: "Your Phantom Tracker account has been disabled",
    text: `${hi},\n\nYour account has been disabled. You won't receive reminders and you can't use the app until you reactivate.\n\nYour data is safe. Sign back in any time to reactivate: ${url}`,
    html: shell("Account disabled", `
      <p style="color:#d4d4d8;font-size:15px;line-height:1.6;margin:0 0 16px;">${hi},</p>
      <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 20px;">Your account has been <strong style="color:#fff;">disabled</strong>. Reminders are paused and the app is locked, but <strong style="color:#fff;">all your data is kept safe</strong>. Sign back in any time to reactivate instantly.</p>
      <div style="text-align:center;margin-bottom:8px;"><a href="${url}" style="display:inline-block;background:#7f49c3;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:10px;">Reactivate my account</a></div>`),
  });
}

/** Confirm deletion was requested; data purged after the grace period. */
export async function sendAccountDeletionScheduledEmail(to: string, name: string | null, purgeOn: Date, graceDays: number) {
  const hi = name ? `Hi ${name}` : "Hi there";
  const when = purgeOn.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  if (!isSmtpConfigured()) { console.log(`\n  🗑️  (deletion-scheduled email skipped — no SMTP) for ${to} — purge ${when}\n`); return; }
  const url = `${appUrl()}/login?email=${encodeURIComponent(to)}`;
  await makeTransport().sendMail({
    from: emailFrom(), to,
    subject: `Your Phantom Tracker account is scheduled for deletion`,
    text: `${hi},\n\nWe've scheduled your account for deletion. You have ${graceDays} days to change your mind — sign in before ${when} to reactivate and keep everything.\n\nAfter ${when}, your account and all related data will be permanently deleted.\n\nReactivate: ${url}`,
    html: shell("Account scheduled for deletion", `
      <p style="color:#d4d4d8;font-size:15px;line-height:1.6;margin:0 0 16px;">${hi},</p>
      <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 16px;">Your account is scheduled for permanent deletion. You have a <strong style="color:#fff;">${graceDays}-day grace period</strong> — change your mind any time before <strong style="color:#fff;">${when}</strong> and everything is restored exactly as it was.</p>
      <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 20px;">After <strong style="color:#fff;">${when}</strong>, your account and <strong style="color:#fff;">all related data will be permanently erased</strong> and cannot be recovered.</p>
      <div style="text-align:center;margin-bottom:8px;"><a href="${url}" style="display:inline-block;background:#7f49c3;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:10px;">Keep my account</a></div>`),
  });
}

/** Welcome the user back after reactivating. */
export async function sendAccountReactivatedEmail(to: string, name?: string | null) {
  const hi = name ? `Welcome back, ${name}` : "Welcome back";
  if (!isSmtpConfigured()) { console.log(`\n  ✅ (reactivated email skipped — no SMTP) for ${to}\n`); return; }
  const url = `${appUrl()}/dashboard`;
  await makeTransport().sendMail({
    from: emailFrom(), to,
    subject: "Your Phantom Tracker account is active again 👻",
    text: `${hi}! Your account has been reactivated and all your data is intact. Pick up right where you left off: ${url}`,
    html: shell("You're back!", `
      <p style="color:#d4d4d8;font-size:15px;line-height:1.6;margin:0 0 16px;">${hi}! 🎉</p>
      <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 20px;">Your account has been reactivated and <strong style="color:#fff;">all your habits and history are intact</strong>. Any pending deletion has been cancelled.</p>
      <div style="text-align:center;margin-bottom:8px;"><a href="${url}" style="display:inline-block;background:#7f49c3;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:10px;">Open Phantom Tracker</a></div>`),
  });
}

/** Send a confirm-your-new-email link to the pending address. */
export async function sendEmailChangeConfirmation(toNewEmail: string, token: string, name?: string | null) {
  const hi = name ? `Hi ${name}` : "Hi there";
  const url = `${appUrl()}/api/user/email/confirm?token=${encodeURIComponent(token)}`;
  if (!isSmtpConfigured()) {
    console.log(`\n  ✉️  (email-change confirm skipped — no SMTP) for ${toNewEmail}\n  ➜  ${url}\n`);
    return;
  }
  await makeTransport().sendMail({
    from: emailFrom(), to: toNewEmail,
    subject: "Confirm your new Phantom Tracker email",
    text: `${hi},\n\nYou requested to change your Phantom Tracker email to this address. Confirm it to finish:\n\n${url}\n\nThis link expires in 1 hour. If you didn't request this, you can ignore this email.`,
    html: shell("Confirm your new email", `
      <p style="color:#d4d4d8;font-size:15px;line-height:1.6;margin:0 0 16px;">${hi},</p>
      <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 20px;">You asked to change your Phantom Tracker email to <strong style="color:#fff;">${toNewEmail}</strong>. Tap the button to confirm — the link expires in <strong style="color:#fff;">1 hour</strong>.</p>
      <div style="text-align:center;margin-bottom:16px;"><a href="${url}" style="display:inline-block;background:#7f49c3;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:10px;">Confirm new email</a></div>
      <p style="color:#71717a;font-size:12px;text-align:center;margin:0;">If you didn't request this, you can safely ignore this email.</p>`),
  });
}

/** Notify the OLD email that a change was requested (security heads-up). */
export async function sendEmailChangeNotice(toOldEmail: string, newEmail: string, name?: string | null) {
  const hi = name ? `Hi ${name}` : "Hi there";
  if (!isSmtpConfigured()) { console.log(`\n  ✉️  (email-change notice skipped — no SMTP) for ${toOldEmail}\n`); return; }
  await makeTransport().sendMail({
    from: emailFrom(), to: toOldEmail,
    subject: "A Phantom Tracker email change was requested",
    text: `${hi},\n\nSomeone requested to change your Phantom Tracker account email to ${newEmail}. The change only takes effect after it's confirmed from the new address.\n\nIf this wasn't you, change your password immediately.`,
    html: shell("Email change requested", `
      <p style="color:#d4d4d8;font-size:15px;line-height:1.6;margin:0 0 16px;">${hi},</p>
      <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 16px;">A request was made to change your account email to <strong style="color:#fff;">${newEmail}</strong>. It only takes effect once confirmed from that new address.</p>
      <p style="color:#71717a;font-size:12px;margin:0;">If this wasn't you, please change your password right away.</p>`),
  });
}

/** Send a user's bug report / question / feedback to the admin inbox. */
export async function sendFeedbackEmail(opts: {
  fromEmail: string;
  fromName?: string | null;
  type: string;
  message: string;
  appVersion?: string;
}): Promise<{ ok: boolean; reason?: string }> {
  const to = process.env.ADMIN_NOTIFY_EMAIL;
  if (!to) return { ok: false, reason: "no_admin" };

  const when = new Date().toUTCString();
  const label = opts.type === "bug" ? "🐛 Bug report" : opts.type === "question" ? "❓ Question" : "💬 Feedback";

  if (!isSmtpConfigured()) {
    console.log(`\n  📨 ${label} from ${opts.fromEmail}:\n  ${opts.message}\n  (SMTP not configured — logged only)\n`);
    return { ok: true };
  }

  try {
    await makeTransport().sendMail({
      from: emailFrom(),
      to,
      replyTo: opts.fromEmail, // reply goes straight to the user
      subject: `${label} — Phantom Tracker (${opts.fromEmail})`,
      text:
        `${label}\n\nFrom: ${opts.fromName || "—"} <${opts.fromEmail}>\n` +
        `Version: ${opts.appVersion ?? "—"}\nWhen: ${when}\n\nMessage:\n${opts.message}`,
      html: shell(label, `
        <table style="font-size:13px;width:100%;border-collapse:collapse;margin-bottom:14px;">
          <tr><td style="padding:4px 0;color:#a1a1aa;">From</td><td style="padding:4px 0;text-align:right;color:#fff;">${opts.fromName ? `${opts.fromName} · ` : ""}${opts.fromEmail}</td></tr>
          <tr><td style="padding:4px 0;color:#a1a1aa;">Version</td><td style="padding:4px 0;text-align:right;color:#fff;">${opts.appVersion ?? "—"}</td></tr>
          <tr><td style="padding:4px 0;color:#a1a1aa;">When</td><td style="padding:4px 0;text-align:right;color:#fff;">${when}</td></tr>
        </table>
        <div style="background:#1a1a1a;border:1px solid #222;border-radius:10px;padding:14px;color:#e4e4e7;font-size:14px;line-height:1.6;white-space:pre-wrap;">${opts.message.replace(/</g, "&lt;")}</div>
        <p style="color:#71717a;font-size:11px;margin:14px 0 0;">Reply to this email to respond to the user directly.</p>`),
    });
    return { ok: true };
  } catch (e) {
    console.error("sendFeedbackEmail failed:", e);
    return { ok: false, reason: "send_failed" };
  }
}

/** Email the admin about a production error. Best-effort; never throws. */
export async function sendErrorAlert(context: string, detail: string) {
  const to = process.env.ADMIN_NOTIFY_EMAIL;
  if (!to || !isSmtpConfigured()) return;

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    const from = process.env.SMTP_FROM ?? `"Phantom Tracker" <noreply@phantomtracker.app>`;

    await transporter.sendMail({
      from,
      to,
      subject: `⚠️ Phantom Tracker error: ${context}`,
      text: `An error occurred in production.\n\nContext: ${context}\nTime: ${new Date().toUTCString()}\n\n${detail}`,
    });
  } catch {
    // never let alerting failures cascade
  }
}
