-- AlterTable
ALTER TABLE "public"."Shift" ADD COLUMN     "excludedUserIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "includedUserIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "availability" JSONB DEFAULT '{}';
