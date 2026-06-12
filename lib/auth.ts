import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendTwoFactorCodeEmail } from "@/lib/email";

function gen2faCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export const googleEnabled = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    // Google OAuth (only registered when configured).
    ...(googleEnabled
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          }),
        ]
      : []),
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
            try { await sendTwoFactorCodeEmail(user.email, newCode, user.name, user.language); } catch { /* surfaced as resend option */ }
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
    // For Google sign-in, ensure a matching row exists in our User table
    // (the whole app keys habits/etc. off User.id).
    async signIn({ account, profile }) {
      if (account?.provider !== "google") return true;
      const email = profile?.email;
      if (!email) return false;

      const existing = await prisma.user.findUnique({ where: { email } });
      if (!existing) {
        // Random unusable password (the column is required; Google users
        // sign in via OAuth, not this password).
        const placeholder = await bcrypt.hash(randomBytes(24).toString("hex"), 12);
        await prisma.user.create({
          data: {
            email,
            name: profile?.name ?? null,
            image: (profile as { picture?: string } | null)?.picture ?? null,
            password: placeholder,
            emailVerified: new Date(),
            acceptedTerms: true,
            acceptedTermsAt: new Date(),
            worldSeed: Math.floor(Math.random() * 2_000_000_000) + 1,
          },
        });
      } else if (!existing.emailVerified) {
        // Signing in with Google verifies ownership of the email.
        await prisma.user.update({
          where: { id: existing.id },
          data: { emailVerified: new Date() },
        });
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user?.id && account?.provider !== "google") {
        // Credentials path already returns our DB id.
        token.id = user.id;
      } else if (account?.provider === "google" && token.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: token.email } });
        if (dbUser) token.id = dbUser.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        // The JWT only carries id/name/email, so an uploaded avatar (and any
        // later name change) never reaches the client session. Pull them fresh
        // from the DB so the account avatar shows everywhere, including the
        // landing nav which relies on useSession().
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { image: true, name: true },
        });
        if (dbUser) {
          session.user.image = dbUser.image ?? null;
          if (dbUser.name) session.user.name = dbUser.name;
        }
      }
      return session;
    },
  },
};
