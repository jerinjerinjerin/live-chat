-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "refreshToken" TEXT,
ADD COLUMN     "refreshTokenExpiry" TIMESTAMP(3);
