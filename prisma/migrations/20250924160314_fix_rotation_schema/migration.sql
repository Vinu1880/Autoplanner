/*
  Warnings:

  - The `priority` column on the `Shift` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Shift` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `excludedUserIds` column on the `Shift` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `includedUserIds` column on the `Shift` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `notificationSentAt` on the `ShiftAssignment` table. All the data in the column will be lost.
  - You are about to drop the column `reminderSentAt` on the `ShiftAssignment` table. All the data in the column will be lost.
  - The `status` column on the `ShiftAssignment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `azureId` on the `User` table. All the data in the column will be lost.
  - The `status` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Permission` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `data` on table `AuditLog` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updatedAt` to the `OutOfOfficeEvent` table without a default value. This is not possible if the table is not empty.
  - Made the column `subject` on table `OutOfOfficeEvent` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."Permission" DROP CONSTRAINT "Permission_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ShiftAssignment" DROP CONSTRAINT "ShiftAssignment_shiftId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ShiftAssignment" DROP CONSTRAINT "ShiftAssignment_userId_fkey";

-- DropIndex
DROP INDEX "public"."AuditLog_createdAt_idx";

-- DropIndex
DROP INDEX "public"."AuditLog_entity_entityId_idx";

-- DropIndex
DROP INDEX "public"."AuditLog_userId_idx";

-- DropIndex
DROP INDEX "public"."OutOfOfficeEvent_userEmail_startDate_endDate_idx";

-- DropIndex
DROP INDEX "public"."RotationPattern_name_key";

-- DropIndex
DROP INDEX "public"."Shift_teamId_status_idx";

-- DropIndex
DROP INDEX "public"."ShiftAssignment_date_shiftId_idx";

-- DropIndex
DROP INDEX "public"."ShiftAssignment_userId_status_idx";

-- DropIndex
DROP INDEX "public"."Team_leadId_key";

-- DropIndex
DROP INDEX "public"."Team_name_key";

-- DropIndex
DROP INDEX "public"."User_azureId_key";

-- AlterTable
ALTER TABLE "public"."AuditLog" ALTER COLUMN "data" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."OutOfOfficeEvent" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "subject" SET NOT NULL,
ALTER COLUMN "isAllDay" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."RotationPattern" ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."Shift" DROP COLUMN "priority",
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE',
DROP COLUMN "excludedUserIds",
ADD COLUMN     "excludedUserIds" JSONB,
DROP COLUMN "includedUserIds",
ADD COLUMN     "includedUserIds" JSONB;

-- AlterTable
ALTER TABLE "public"."ShiftAssignment" DROP COLUMN "notificationSentAt",
DROP COLUMN "reminderSentAt",
ADD COLUMN     "invitationSentAt" TIMESTAMP(3),
ADD COLUMN     "responseReceivedAt" TIMESTAMP(3),
ALTER COLUMN "date" SET DATA TYPE TIMESTAMP(3),
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "azureId",
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE',
ALTER COLUMN "availability" DROP DEFAULT;

-- DropTable
DROP TABLE "public"."Permission";

-- DropEnum
DROP TYPE "public"."AssignmentStatus";

-- DropEnum
DROP TYPE "public"."Priority";

-- DropEnum
DROP TYPE "public"."Status";

-- AddForeignKey
ALTER TABLE "public"."ShiftAssignment" ADD CONSTRAINT "ShiftAssignment_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "public"."Shift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShiftAssignment" ADD CONSTRAINT "ShiftAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
