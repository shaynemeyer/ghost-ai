import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentIdentity, getProjectWithAccess } from "@/lib/project-access";
import { isValidProjectId } from "@/lib/validation";

interface Params {
  params: Promise<{ projectId: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const identity = await getCurrentIdentity();
  if (!identity)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId } = await params;
  if (!isValidProjectId(projectId))
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const project = await getProjectWithAccess(projectId, identity.userId, identity.email);
  if (!project)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const specs = await prisma.projectSpec.findMany({
    where: { projectId },
    select: { id: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ specs });
}
