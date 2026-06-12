import nodemailer from "nodemailer";
import { emailStrings } from "@/lib/email-i18n";

function isSmtpConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendVerificationEmail(to: string, code: string, lang?: string) {
  const es = emailStrings(lang);
  // ── Dev fallback: log to console when SMTP isn't configured ──────────────
  if (!isSmtpConfigured()) {
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`  📬  VERIFICATION CODE for ${to}`);
    console.log(`  ➜   ${code}`);
    console.log("  (SMTP not configured: code logged to console)");
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
    subject: es.verifySubject(code),
    text: `${code}\n\n${es.verifyIntro}`,
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
                    <img src="https://phantomtracker.io/ghost-logo-128.png" width="44" height="44" alt="Phantom Tracker" style="display:inline-block;border-radius:12px;margin-bottom:16px;" />
                    <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;letter-spacing:-0.3px;">Phantom Tracker</h1>
                    <p style="margin:8px 0 0;color:#a1a1aa;font-size:13px;">${es.verifyHeading}</p>
                  </td>
                </tr>
                <!-- Code -->
                <tr>
                  <td style="padding:32px;">
                    <p style="margin:0 0 20px;color:#a1a1aa;font-size:14px;line-height:1.6;">
                      ${es.verifyIntro}
                    </p>
                    <div style="background:#1a1a1a;border:1px solid #222222;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
                      <span style="font-family:monospace;font-size:36px;font-weight:700;letter-spacing:12px;color:#7f49c3;">${code}</span>
                    </div>
                    <p style="margin:0;color:#71717a;font-size:12px;text-align:center;">
                      ${es.verifyIgnore}
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
export async function sendWelcomeEmail(to: string, name?: string | null, lang?: string) {
  const es = emailStrings(lang);
  if (!isSmtpConfigured()) {
    console.log(`\n  👋 (welcome email skipped: no SMTP) for ${to}\n`);
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
  // any device signs the user into THIS account: not whatever the device was on.
  const openUrl = `${appUrl}/login?email=${encodeURIComponent(to)}`;

  await transporter.sendMail({
    from,
    to,
    subject: es.welcomeSubject,
    text: `${es.welcomeHi(name)}\n\n${es.welcomeLine}\n\n${openUrl}`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 16px;">
            <tr><td align="center">
              <table width="440" cellpadding="0" cellspacing="0" style="background:#111111;border:1px solid #222222;border-radius:16px;overflow:hidden;">
                <tr>
                  <td style="padding:32px 32px 8px;text-align:center;">
                    <img src="https://phantomtracker.io/ghost-logo-128.png" width="48" height="48" alt="Phantom Tracker" style="display:inline-block;border-radius:14px;margin-bottom:16px;" />
                    <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">${es.welcomeHeading}</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 32px 28px;">
                    <p style="color:#d4d4d8;font-size:15px;line-height:1.6;margin:0 0 16px;">${es.welcomeHi(name)}</p>
                    <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 24px;">
                      ${es.welcomeLine}
                    </p>
                    <div style="text-align:center;margin-bottom:20px;">
                      <a href="${openUrl}" style="display:inline-block;background:#7f49c3;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:10px;">${es.welcomeBtn}</a>
                    </div>
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
    text: `A new user just verified their account.\n\nEmail: ${newUser.email}\nName: ${newUser.name || "-"}\nWhen: ${when}`,
    html: `
      <div style="font-family:system-ui,sans-serif;background:#0a0a0a;padding:32px;color:#fff;">
        <div style="max-width:420px;margin:0 auto;background:#111;border:1px solid #222;border-radius:14px;padding:24px;">
          <h2 style="margin:0 0 4px;font-size:16px;">🎉 New user joined</h2>
          <p style="margin:0 0 16px;color:#a1a1aa;font-size:13px;">Someone just verified their Phantom Tracker account.</p>
          <table style="font-size:14px;width:100%;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#a1a1aa;">Email</td><td style="padding:6px 0;text-align:right;color:#fff;">${newUser.email}</td></tr>
            <tr><td style="padding:6px 0;color:#a1a1aa;">Name</td><td style="padding:6px 0;text-align:right;color:#fff;">${newUser.name || "-"}</td></tr>
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
          <img src="https://phantomtracker.io/ghost-logo-128.png" width="48" height="48" alt="Phantom Tracker" style="display:inline-block;border-radius:14px;margin-bottom:16px;" />
          <h1 style="margin:0;color:#ffffff;font-size:21px;font-weight:700;letter-spacing:-0.3px;">${title}</h1>
        </td></tr>
        <tr><td style="padding:12px 32px 28px;">${bodyHtml}</td></tr>
      </table>
    </td></tr></table>
  </body></html>`;
}

function ctaButton(url: string, label: string) {
  return `<div style="text-align:center;margin:8px 0 4px;"><a href="${url}" style="display:inline-block;background:#7f49c3;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:10px;">${label}</a></div>`;
}

/** Weekly engagement summary of the user's last 7 days. */
export async function sendWeeklySummaryEmail(opts: {
  to: string;
  name?: string | null;
  lang?: string;
  completions: number;
  bestStreak: number;
  perfectDays: number;
}): Promise<void> {
  const es = emailStrings(opts.lang);
  if (!isSmtpConfigured()) {
    console.log(`\n  📊 (weekly summary skipped: no SMTP) for ${opts.to}\n`);
    return;
  }
  const stat = (icon: string, label: string, value: string | number, color: string) =>
    `<td style="padding:0 6px;width:33%;"><div style="background:#1a1a1a;border:1px solid #222;border-radius:12px;padding:14px 8px;text-align:center;"><div style="font-size:20px;line-height:1;margin-bottom:6px;">${icon}</div><div style="color:${color};font-size:24px;font-weight:700;font-family:monospace;">${value}</div><div style="color:#a1a1aa;font-size:11px;margin-top:4px;">${label}</div></div></td>`;
  const url = `${appUrl()}/dashboard`;
  await makeTransport().sendMail({
    from: emailFrom(),
    to: opts.to,
    subject: es.wsSubject,
    text: `${es.wsHi(opts.name)}\n\n${es.wsIntro}\n- ${es.wsCompletions}: ${opts.completions}\n- ${es.wsBestStreak}: ${opts.bestStreak}\n- ${es.wsPerfectDays}: ${opts.perfectDays}\n\n${es.wsClosing}\n${url}`,
    html: shell(es.wsHeading, `
      <p style="color:#d4d4d8;font-size:15px;line-height:1.6;margin:0 0 6px;">${es.wsHi(opts.name)}</p>
      <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 16px;">${es.wsIntro}</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;"><tr>
        ${stat("📊", es.wsCompletions, opts.completions, "#7f49c3")}
        ${stat("🔥", es.wsBestStreak, `${opts.bestStreak}d`, "#f97316")}
        ${stat("⭐", es.wsPerfectDays, opts.perfectDays, "#22c55e")}
      </tr></table>
      ${ctaButton(url, es.wsBtn)}
      <p style="color:#71717a;font-size:12px;text-align:center;margin:14px 0 0;">${es.wsClosing}</p>`),
  });
}

/** Remind a trialing user that their Pro trial ends soon. */
export async function sendTrialEndingEmail(opts: {
  to: string;
  name?: string | null;
  lang?: string;
  daysLeft: number;
}): Promise<void> {
  const es = emailStrings(opts.lang);
  if (!isSmtpConfigured()) {
    console.log(`\n  ⏳ (trial-ending email skipped: no SMTP) for ${opts.to}\n`);
    return;
  }
  const url = `${appUrl()}/settings`;
  await makeTransport().sendMail({
    from: emailFrom(),
    to: opts.to,
    subject: es.trialSubject(opts.daysLeft),
    text: `${es.trialHi(opts.name)}\n\n${es.trialLine(opts.daysLeft)}\n\n${url}`,
    html: shell(es.trialHeading, `
      <p style="color:#d4d4d8;font-size:15px;line-height:1.6;margin:0 0 16px;">${es.trialHi(opts.name)}</p>
      <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 20px;">${es.trialLine(opts.daysLeft)}</p>
      ${ctaButton(url, es.trialBtn)}`),
  });
}

/** Confirm the account was disabled (deactivated). */
export async function sendAccountDisabledEmail(to: string, name?: string | null, lang?: string) {
  const es = emailStrings(lang);
  if (!isSmtpConfigured()) { console.log(`\n  ⏸️  (account disabled email skipped: no SMTP) for ${to}\n`); return; }
  const url = `${appUrl()}/login?email=${encodeURIComponent(to)}`;
  await makeTransport().sendMail({
    from: emailFrom(), to,
    subject: es.disabledSubject,
    text: `${es.disabledHi(name)}\n\n${es.disabledLine}\n\n${url}`,
    html: shell(es.disabledHeading, `
      <p style="color:#d4d4d8;font-size:15px;line-height:1.6;margin:0 0 16px;">${es.disabledHi(name)}</p>
      <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 20px;">${es.disabledLine}</p>
      <div style="text-align:center;margin-bottom:8px;"><a href="${url}" style="display:inline-block;background:#7f49c3;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:10px;">${es.disabledBtn}</a></div>`),
  });
}

/** Confirm deletion was requested; data purged after the grace period. */
export async function sendAccountDeletionScheduledEmail(to: string, name: string | null, purgeOn: Date, graceDays: number, lang?: string) {
  const es = emailStrings(lang);
  const when = purgeOn.toLocaleDateString(lang === "hu" ? "hu-HU" : lang === "ro" ? "ro-RO" : "en-GB", { day: "numeric", month: "long", year: "numeric" });
  if (!isSmtpConfigured()) { console.log(`\n  🗑️  (deletion-scheduled email skipped: no SMTP) for ${to}: purge ${when}\n`); return; }
  const url = `${appUrl()}/login?email=${encodeURIComponent(to)}`;
  await makeTransport().sendMail({
    from: emailFrom(), to,
    subject: es.delSubject,
    text: `${es.delHi(name)}\n\n${es.delLine1(graceDays, when)}\n\n${es.delLine2(when)}\n\n${url}`,
    html: shell(es.delHeading, `
      <p style="color:#d4d4d8;font-size:15px;line-height:1.6;margin:0 0 16px;">${es.delHi(name)}</p>
      <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 16px;">${es.delLine1(graceDays, when)}</p>
      <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 20px;">${es.delLine2(when)}</p>
      <div style="text-align:center;margin-bottom:8px;"><a href="${url}" style="display:inline-block;background:#7f49c3;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:10px;">${es.delBtn}</a></div>`),
  });
}

/** Welcome the user back after reactivating. */
export async function sendAccountReactivatedEmail(to: string, name?: string | null, lang?: string) {
  const es = emailStrings(lang);
  if (!isSmtpConfigured()) { console.log(`\n  ✅ (reactivated email skipped: no SMTP) for ${to}\n`); return; }
  const url = `${appUrl()}/dashboard`;
  await makeTransport().sendMail({
    from: emailFrom(), to,
    subject: es.reactSubject,
    text: `${es.reactHi(name)}\n\n${es.reactLine}\n\n${url}`,
    html: shell(es.reactHeading, `
      <p style="color:#d4d4d8;font-size:15px;line-height:1.6;margin:0 0 16px;">${es.reactHi(name)}</p>
      <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 20px;">${es.reactLine}</p>
      <div style="text-align:center;margin-bottom:8px;"><a href="${url}" style="display:inline-block;background:#7f49c3;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:10px;">${es.reactBtn}</a></div>`),
  });
}

/** Send a confirm-your-new-email link to the pending address. */
export async function sendEmailChangeConfirmation(toNewEmail: string, token: string, name?: string | null, lang?: string) {
  const es = emailStrings(lang);
  const url = `${appUrl()}/api/user/email/confirm?token=${encodeURIComponent(token)}`;
  if (!isSmtpConfigured()) {
    console.log(`\n  ✉️  (email-change confirm skipped: no SMTP) for ${toNewEmail}\n  ➜  ${url}\n`);
    return;
  }
  await makeTransport().sendMail({
    from: emailFrom(), to: toNewEmail,
    subject: es.ecConfirmSubject,
    text: `${es.ecConfirmHi(name)}\n\n${es.ecConfirmLine(toNewEmail)}\n\n${url}`,
    html: shell(es.ecConfirmHeading, `
      <p style="color:#d4d4d8;font-size:15px;line-height:1.6;margin:0 0 16px;">${es.ecConfirmHi(name)}</p>
      <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 20px;">${es.ecConfirmLine(toNewEmail)}</p>
      <div style="text-align:center;margin-bottom:16px;"><a href="${url}" style="display:inline-block;background:#7f49c3;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:10px;">${es.ecConfirmBtn}</a></div>
      <p style="color:#71717a;font-size:12px;text-align:center;margin:0;">${es.ecConfirmIgnore}</p>`),
  });
}

/** Notify the OLD email that a change was requested (security heads-up). */
export async function sendEmailChangeNotice(toOldEmail: string, newEmail: string, name?: string | null, lang?: string) {
  const es = emailStrings(lang);
  if (!isSmtpConfigured()) { console.log(`\n  ✉️  (email-change notice skipped: no SMTP) for ${toOldEmail}\n`); return; }
  await makeTransport().sendMail({
    from: emailFrom(), to: toOldEmail,
    subject: es.ecNoticeSubject,
    text: `${es.ecNoticeHi(name)}\n\n${es.ecNoticeLine(newEmail)}\n\n${es.ecNoticeWarn}`,
    html: shell(es.ecNoticeHeading, `
      <p style="color:#d4d4d8;font-size:15px;line-height:1.6;margin:0 0 16px;">${es.ecNoticeHi(name)}</p>
      <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 16px;">${es.ecNoticeLine(newEmail)}</p>
      <p style="color:#71717a;font-size:12px;margin:0;">${es.ecNoticeWarn}</p>`),
  });
}

/** Send a 2FA login code. */
export async function sendTwoFactorCodeEmail(to: string, code: string, name?: string | null, lang?: string) {
  const es = emailStrings(lang);
  if (!isSmtpConfigured()) {
    console.log(`\n  🔐 2FA CODE for ${to}: ${code}  (SMTP not configured: logged only)\n`);
    return;
  }
  await makeTransport().sendMail({
    from: emailFrom(), to,
    subject: es.twoFASubject(code),
    text: `${es.twoFAHi(name)}\n\n${code}\n\n${es.twoFALine}`,
    html: shell(es.twoFAHeading, `
      <p style="color:#d4d4d8;font-size:15px;line-height:1.6;margin:0 0 16px;">${es.twoFAHi(name)}</p>
      <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 20px;">${es.twoFALine}</p>
      <div style="background:#1a1a1a;border:1px solid #222;border-radius:12px;padding:22px;text-align:center;margin-bottom:18px;">
        <span style="font-family:monospace;font-size:34px;font-weight:700;letter-spacing:10px;color:#7f49c3;">${code}</span>
      </div>
      <p style="color:#71717a;font-size:12px;text-align:center;margin:0;">${es.twoFAIgnore}</p>`),
  });
}

/** Send a password-reset link. */
export async function sendPasswordResetEmail(to: string, token: string, name?: string | null, lang?: string) {
  const es = emailStrings(lang);
  const url = `${appUrl()}/reset?token=${encodeURIComponent(token)}`;
  if (!isSmtpConfigured()) {
    console.log(`\n  🔑 (password reset skipped: no SMTP) for ${to}\n  ➜  ${url}\n`);
    return;
  }
  await makeTransport().sendMail({
    from: emailFrom(), to,
    subject: es.resetSubject,
    text: `${es.resetHi(name)}\n\n${es.resetLine}\n\n${url}\n\n${es.resetIgnore}`,
    html: shell(es.resetHeading, `
      <p style="color:#d4d4d8;font-size:15px;line-height:1.6;margin:0 0 16px;">${es.resetHi(name)}</p>
      <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 20px;">${es.resetLine}</p>
      <div style="text-align:center;margin-bottom:16px;"><a href="${url}" style="display:inline-block;background:#7f49c3;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:10px;">${es.resetBtn}</a></div>
      <p style="color:#71717a;font-size:12px;text-align:center;margin:0;">${es.resetIgnore}</p>`),
  });
}

/**
 * Send a user's bug report / question / feedback to the support inbox, and send
 * the user a localized acknowledgement with a copy of their message.
 */
export async function sendFeedbackEmail(opts: {
  fromEmail: string;
  fromName?: string | null;
  type: string;
  message: string;
  appVersion?: string;
  lang?: string;
  attachments?: { filename: string; content: string; contentType: string }[]; // content = base64
}): Promise<{ ok: boolean; reason?: string }> {
  // Feedback goes to the support inbox. Override with SUPPORT_EMAIL if needed.
  const to = process.env.SUPPORT_EMAIL || "support@phantomtracker.io";

  const when = new Date().toUTCString();
  const label = opts.type === "bug" ? "🐛 Bug report" : opts.type === "question" ? "❓ Question" : "💬 Feedback";
  const safeMsg = opts.message.replace(/</g, "&lt;");

  if (!isSmtpConfigured()) {
    console.log(`\n  📨 ${label} from ${opts.fromEmail} → ${to}:\n  ${opts.message}\n  (SMTP not configured: logged only)\n`);
    return { ok: true };
  }

  try {
    // 1) Notify support.
    await makeTransport().sendMail({
      from: emailFrom(),
      to,
      replyTo: opts.fromEmail, // reply goes straight to the user
      subject: `${label}. Phantom Tracker (${opts.fromEmail})`,
      text:
        `${label}\n\nFrom: ${opts.fromName || "-"} <${opts.fromEmail}>\n` +
        `Version: ${opts.appVersion ?? "-"}\nWhen: ${when}\n\nMessage:\n${opts.message}`,
      html: shell(label, `
        <table style="font-size:13px;width:100%;border-collapse:collapse;margin-bottom:14px;">
          <tr><td style="padding:4px 0;color:#a1a1aa;">From</td><td style="padding:4px 0;text-align:right;color:#fff;">${opts.fromName ? `${opts.fromName} · ` : ""}${opts.fromEmail}</td></tr>
          <tr><td style="padding:4px 0;color:#a1a1aa;">Version</td><td style="padding:4px 0;text-align:right;color:#fff;">${opts.appVersion ?? "-"}</td></tr>
          <tr><td style="padding:4px 0;color:#a1a1aa;">When</td><td style="padding:4px 0;text-align:right;color:#fff;">${when}</td></tr>
        </table>
        <div style="background:#1a1a1a;border:1px solid #222;border-radius:10px;padding:14px;color:#e4e4e7;font-size:14px;line-height:1.6;white-space:pre-wrap;">${safeMsg}</div>
        ${opts.attachments?.length ? `<p style="color:#a1a1aa;font-size:12px;margin:14px 0 0;">📎 ${opts.attachments.length} screenshot(s) attached.</p>` : ""}
        <p style="color:#71717a;font-size:11px;margin:14px 0 0;">Reply to this email to respond to the user directly.</p>`),
      attachments: opts.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        encoding: "base64",
        contentType: a.contentType,
      })),
    });

    // 2) Acknowledge to the user (best-effort: don't fail the request if this errors).
    try {
      const es = emailStrings(opts.lang);
      await makeTransport().sendMail({
        from: emailFrom(),
        to: opts.fromEmail,
        replyTo: to, // user replies land in support
        subject: es.fbAckSubject,
        text: `${es.fbAckHi(opts.fromName)}\n\n${es.fbAckLine}\n\n${es.fbAckYour}:\n${opts.message}\n\n${es.fbAckClosing}`,
        html: shell(es.fbAckHeading, `
          <p style="color:#d4d4d8;font-size:15px;line-height:1.6;margin:0 0 16px;">${es.fbAckHi(opts.fromName)}</p>
          <p style="color:#a1a1aa;font-size:14px;line-height:1.6;margin:0 0 16px;">${es.fbAckLine}</p>
          <p style="color:#71717a;font-size:12px;margin:0 0 6px;">${es.fbAckYour}</p>
          <div style="background:#1a1a1a;border:1px solid #222;border-radius:10px;padding:14px;color:#e4e4e7;font-size:14px;line-height:1.6;white-space:pre-wrap;">${safeMsg}</div>
          <p style="color:#a1a1aa;font-size:13px;margin:18px 0 0;">${es.fbAckClosing}</p>`),
      });
    } catch (ackErr) {
      console.error("feedback acknowledgement email failed:", ackErr);
    }

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
