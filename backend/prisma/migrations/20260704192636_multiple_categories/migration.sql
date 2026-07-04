/*
  Warnings:

  - You are about to drop the column `categoryId` on the `Profile` table. All the data in the column will be migrated to the new join table.

*/
-- DropForeignKey
ALTER TABLE "Profile" DROP CONSTRAINT "Profile_categoryId_fkey";

-- DropIndex
DROP INDEX "Profile_categoryId_idx";

-- CreateTable
CREATE TABLE "_CategoryToProfile" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CategoryToProfile_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_CategoryToProfile_B_index" ON "_CategoryToProfile"("B");

-- AddForeignKey
ALTER TABLE "_CategoryToProfile" ADD CONSTRAINT "_CategoryToProfile_A_fkey" FOREIGN KEY ("A") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToProfile" ADD CONSTRAINT "_CategoryToProfile_B_fkey" FOREIGN KEY ("B") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing data
INSERT INTO "_CategoryToProfile" ("A", "B")
SELECT "categoryId", "id" FROM "Profile" WHERE "categoryId" IS NOT NULL;

-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "categoryId";
