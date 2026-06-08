// Shared password policy (used on signup + reset, client + server).

export const PASSWORD_MIN = 8;

export type PasswordCheck = { ok: boolean; rules: { label: string; met: boolean }[] };

export function checkPassword(pw: string): PasswordCheck {
  const rules = [
    { label: `At least ${PASSWORD_MIN} characters`, met: pw.length >= PASSWORD_MIN },
    { label: "An uppercase letter", met: /[A-Z]/.test(pw) },
    { label: "A lowercase letter", met: /[a-z]/.test(pw) },
    { label: "A number", met: /[0-9]/.test(pw) },
  ];
  return { ok: rules.every((r) => r.met), rules };
}

export function isStrongPassword(pw: string): boolean {
  return checkPassword(pw).ok;
}

export const PASSWORD_HINT =
  `Use at least ${PASSWORD_MIN} characters with upper- and lower-case letters and a number.`;
