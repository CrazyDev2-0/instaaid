/*
  Warnings:

  - You are about to drop the column `productsCount` on the `Machine` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Machine" DROP COLUMN "productsCount",
ADD COLUMN     "condomsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "padsCount" INTEGER NOT NULL DEFAULT 0;
