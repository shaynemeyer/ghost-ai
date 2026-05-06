/*
  Warnings:

  - You are about to drop the column `canvasJsonPath` on the `projects` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "projects" DROP COLUMN "canvasJsonPath",
ADD COLUMN     "canvasBlobUrl" TEXT;
