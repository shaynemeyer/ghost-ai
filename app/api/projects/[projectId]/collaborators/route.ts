import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidProjectId, isValidEmail } from "@/lib/validation";
import { getCurrentIdentity, getProjectWithAccess, enrichCollaborators } from "@/lib/project-access";

interface Params {
  params: Promise<{ projectId: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const identity = await getCurrentIdentity();
  if (!identity) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId } = await params;
  if (!isValidProjectId(projectId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const project = await getProjectWithAccess(projectId, identity.userId, identity.email);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const rows = await prisma.projectCollaborator.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
  });

  const profiles = await enrichCollaborators(rows.map((r) => r.email));

  const collaborators = rows.map((row, i) => ({
    id: row.id,
    email: row.email,
    name: profiles[i].name,
    imageUrl: profiles[i].imageUrl,
  }));

  return NextResponse.json({ collaborators });
}

export async function POST(req: NextRequest, { params }: Params) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId } = await params;
  if (!isValidProjectId(projectId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (project.ownerId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }

  const owner = await currentUser();
  const ownerEmail = owner?.emailAddresses[0]?.emailAddress?.toLowerCase() ?? "";
  if (email === ownerEmail) {
    return NextResponse.json({ error: "Project owner cannot be added as a collaborator" }, { status: 400 });
  }

  const existing = await prisma.projectCollaborator.findUnique({
    where: { projectId_email: { projectId, email } },
  });
  if (existing) return NextResponse.json({ error: "Already a collaborator" }, { status: 409 });

  const row = await prisma.projectCollaborator.create({
    data: { projectId, email },
  });

  const [profile] = await enrichCollaborators([email]);

  return NextResponse.json(
    { id: row.id, email: row.email, name: profile.name, imageUrl: profile.imageUrl },
    { status: 201 }
  );
}
