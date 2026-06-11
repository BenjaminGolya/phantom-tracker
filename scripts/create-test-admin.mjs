import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// bcrypt hash of "123456" (12 rounds)
const PASSWORD_HASH = "$2b$12$NnV5xWhTh0f37vY3CaRmVe9GR/NRSL3dEUMSa4Hlpzrs04ZGKGH4m";

const user = await prisma.user.upsert({
  where: { email: "admin@test.com" },
  update: { password: PASSWORD_HASH, emailVerified: new Date(), disabledAt: null, deletionRequestedAt: null },
  create: {
    email: "admin@test.com",
    name: "Test Admin",
    password: PASSWORD_HASH,
    emailVerified: new Date(),
    acceptedTerms: true,
    acceptedTermsAt: new Date(),
    language: "en",
  },
  select: { id: true, email: true, emailVerified: true },
});

console.log("OK:", JSON.stringify(user));
await prisma.$disconnect();
