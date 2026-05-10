-- CreateTable
CREATE TABLE "project_specs" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_specs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_specs_projectId_idx" ON "project_specs"("projectId");

-- AddForeignKey
ALTER TABLE "project_specs" ADD CONSTRAINT "project_specs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
