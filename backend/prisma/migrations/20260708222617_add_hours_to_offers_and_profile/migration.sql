-- AlterTable
ALTER TABLE "JobOffer" ADD COLUMN     "estimatedHours" INTEGER;

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "days" INTEGER NOT NULL DEFAULT 0;
