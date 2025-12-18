-- CreateEnum
CREATE TYPE "FilePrincipalType" AS ENUM ('USER', 'ROLE', 'GROUP');

-- CreateEnum
CREATE TYPE "FilePermission" AS ENUM ('READ', 'WRITE', 'ADMIN');

-- CreateTable
CREATE TABLE "FileObject" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "uploadedById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FileObject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileAccess" (
    "id" UUID NOT NULL,
    "fileId" UUID NOT NULL,
    "principalType" "FilePrincipalType" NOT NULL,
    "principalId" TEXT NOT NULL,
    "permission" "FilePermission" NOT NULL,
    "grantedById" UUID,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileTag" (
    "id" UUID NOT NULL,
    "fileId" UUID NOT NULL,
    "tag" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileTag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FileObject_storageKey_key" ON "FileObject"("storageKey");

-- CreateIndex
CREATE INDEX "FileObject_uploadedById_idx" ON "FileObject"("uploadedById");

-- CreateIndex
CREATE INDEX "FileObject_mimeType_idx" ON "FileObject"("mimeType");

-- CreateIndex
CREATE INDEX "FileObject_createdAt_idx" ON "FileObject"("createdAt");

-- CreateIndex
CREATE INDEX "FileObject_isPublic_idx" ON "FileObject"("isPublic");

-- CreateIndex
CREATE INDEX "FileAccess_fileId_idx" ON "FileAccess"("fileId");

-- CreateIndex
CREATE INDEX "FileAccess_principalType_principalId_idx" ON "FileAccess"("principalType", "principalId");

-- CreateIndex
CREATE INDEX "FileAccess_expiresAt_idx" ON "FileAccess"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "FileAccess_fileId_principalType_principalId_permission_key" ON "FileAccess"("fileId", "principalType", "principalId", "permission");

-- CreateIndex
CREATE INDEX "FileTag_tag_idx" ON "FileTag"("tag");

-- CreateIndex
CREATE INDEX "FileTag_fileId_idx" ON "FileTag"("fileId");

-- CreateIndex
CREATE UNIQUE INDEX "FileTag_fileId_tag_key" ON "FileTag"("fileId", "tag");

-- AddForeignKey
ALTER TABLE "FileObject" ADD CONSTRAINT "FileObject_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAccess" ADD CONSTRAINT "FileAccess_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "FileObject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAccess" ADD CONSTRAINT "FileAccess_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileTag" ADD CONSTRAINT "FileTag_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "FileObject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
