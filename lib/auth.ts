import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendTwoFactorCodeEmail } from "@/lib/email";

function gen2faCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        code: { label: "Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user) return null;
        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;
        if (!user.emailVerified) return null; // must verify email first

        // Email-code 2FA: when enabled, require a valid code.
        if (user.twoFactorEnabled) {
          const code = (credentials.code ?? "").trim();
          if (!code) {
            // First step: password OK → issue & email a code, signal the client.
            const newCode = gen2faCode();
            await prisma.user.update({
              where: { id: user.id },
              data: { twoFactorCode: newCode, twoFactorCodeExpires: new Date(Date.now() + 10 * 60 * 1000) },
            });
            try { await sendTwoFactorCodeEmail(user.email, newCode, user.name); } catch { /* surfaced as resend option */ }
            throw new Error("2FA_REQUIRED");
          }
          // Second step: validate the code.
          if (!user.twoFactorCode || !user.twoFactorCodeExpires || user.twoFactorCodeExpires.getTime() < Date.now()) {
            throw new Error("2FA_EXPIRED");
          }
          if (code !== user.twoFactorCode) {
            throw new Error("2FA_INVALID");
          }
          await prisma.user.update({
            where: { id: user.id },
            data: { twoFactorCode: null, twoFactorCodeExpires: null },
          });
        }

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
  },
};
