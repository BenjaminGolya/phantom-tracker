-- AlterTable
ALTER TABLE "User" ADD COLUMN "emailVerified" DATETIME;
ALTER TABLE "User" ADD COLUMN "verificationCode" TEXT;
ALTER TABLE "User" ADD COLUMN "verificationExpires" DATETIME;
