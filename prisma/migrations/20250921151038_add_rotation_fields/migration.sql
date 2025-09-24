-- AlterTable
ALTER TABLE "public"."ShiftAssignment" ADD COLUMN     "isRotationAssignment" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rotationPriority" TEXT;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "rotationConfig" JSONB;

-- CreateTable
CREATE TABLE "public"."RotationPattern" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cycleLength" INTEGER NOT NULL,
    "weeks" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RotationPattern_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RotationPattern_name_key" ON "public"."RotationPattern"("name");
