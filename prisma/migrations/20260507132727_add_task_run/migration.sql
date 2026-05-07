-- CreateTable
CREATE TABLE "task_runs" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "task_runs_runId_key" ON "task_runs"("runId");

-- CreateIndex
CREATE INDEX "task_runs_runId_idx" ON "task_runs"("runId");

-- CreateIndex
CREATE INDEX "task_runs_userId_projectId_idx" ON "task_runs"("userId", "projectId");
