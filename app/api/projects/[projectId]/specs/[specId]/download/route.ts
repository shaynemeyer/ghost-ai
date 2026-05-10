import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getCurrentIdentity, getProjectWithAccess } from "@/lib/project-access";
import { isValidProjectId } from "@/lib/validation";

interface Params {
  params: Promise<{ projectId: string; specId: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const identity = await getCurrentIdentity();
  if (!identity)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId, specId } = await params;

  if (!isValidProjectId(projectId) || !isValidProjectId(specId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const project = await getProjectWithAccess(projectId, identity.userId, identity.email);
  if (!project)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const spec = await prisma.projectSpec.findUnique({ where: { id: specId } });
  if (!spec || spec.projectId !== projectId)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const result = await get(spec.filePath, { access: "private" });
  if (!result || result.statusCode !== 200)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const content = await new Response(result.stream).text();

  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="spec-${specId}.md"`,
    },
  });
}
