import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidProjectId } from "@/lib/validation";

interface Params {
  params: Promise<{ projectId: string; collaboratorId: string }>;
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId, collaboratorId } = await params;
  if (!isValidProjectId(projectId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (project.ownerId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const result = await prisma.projectCollaborator.deleteMany({
    where: { id: collaboratorId, projectId },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
