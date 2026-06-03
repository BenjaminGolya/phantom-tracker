import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

function createPrisma() {
  const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  const filePath = dbUrl.replace(/^file:/, "");
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.join(process.cwd(), filePath);

  const adapter = new PrismaLibSql({ url: `file:${absolutePath}` });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
