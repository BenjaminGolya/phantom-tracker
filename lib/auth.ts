import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import { randomBytes } from "crypto";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendTwoFactorCodeEmail } from "@/lib/email";

function gen2faCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export const googleEnabled = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
export const appleEnabled = !!(
  process.env.APPLE_CLIENT_ID &&
  process.env.APPLE_TEAM_ID &&
  process.env.APPLE_KEY_ID &&
  process.env.APPLE_PRIVATE_KEY
);

// Apple's "client secret" is a short-lived JWT signed with your .p8 key.
function appleClientSecret(): string {
  const privateKey = (process.env.APPLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  return jwt.sign({}, privateKey, {
    algorithm: "ES256",
    expiresIn: "180d",
    audience: "https://appleid.apple.com",
    issuer: process.env.APPLE_TEAM_ID!,
    subject: process.env.APPLE_CLIENT_ID!, // the Services ID
    keyid: process.env.APPLE_KEY_ID!,
  });
}

// OAuth providers we upsert a local User for.
const OAUTH_PROVIDERS = new Set(["google", "apple"]);

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
    // Apple OAuth (only registered when configured).
    ...(appleEnabled
      ? [
          AppleProvider({
            clientId: process.env.APPLE_CLIENT_ID!,
            clientSecret: appleClientSecret(),
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
    // For OAuth sign-in (Google/Apple), ensure a matching row exists in our
    // User table (the whole app keys habits/etc. off User.id).
    async signIn({ account, profile }) {
      if (!account || !OAUTH_PROVIDERS.has(account.provider)) return true;
      const email = profile?.email;
      if (!email) return false;

      const existing = await prisma.user.findUnique({ where: { email } });
      if (!existing) {
        // Random unusable password (column is required; OAuth users sign in
        // via the provider, not this password).
        const placeholder = await bcrypt.hash(randomBytes(24).toString("hex"), 12);
        await prisma.user.create({
          data: {
            email,
            name: profile?.name ?? null,
            image: (profile as { picture?: string } | null)?.picture ?? null,
            password: placeholder,
            emailVerified: new Date(), // OAuth proves email ownership
            acceptedTerms: true,
            acceptedTermsAt: new Date(),
          },
        });
      } else if (!existing.emailVerified) {
        await prisma.user.update({
          where: { id: existing.id },
          data: { emailVerified: new Date() },
        });
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (account && OAUTH_PROVIDERS.has(account.provider) && token.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: token.email } });
        if (dbUser) token.id = dbUser.id;
      } else if (user?.id) {
        // Credentials path already returns our DB id.
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
  },
};
