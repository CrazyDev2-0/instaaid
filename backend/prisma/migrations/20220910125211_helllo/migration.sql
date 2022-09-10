-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('sanitary_pad', 'condom');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "product" "ProductType" NOT NULL DEFAULT 'condom';
