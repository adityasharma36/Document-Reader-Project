





-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "userId" UUID NOT NULL;

-- CreateIndex
CREATE INDEX "Document_userId_idx" ON "Document"("userId");
