// Admin access is controlled by an allowlist of emails in the ADMIN_EMAILS
// env var (comma-separated). Keeping it in env - not the database - means
// admin rights can't be granted by tampering with user rows.

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}
