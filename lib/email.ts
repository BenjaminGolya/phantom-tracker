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
