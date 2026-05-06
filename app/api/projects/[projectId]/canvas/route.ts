import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { prisma } from '@/lib/prisma';
import { getCurrentIdentity, getProjectWithAccess } from '@/lib/project-access';
import { isValidProjectId } from '@/lib/validation';

interface Params {
  params: Promise<{ projectId: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const identity = await getCurrentIdentity();
  if (!identity)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { projectId } = await params;
  if (!isValidProjectId(projectId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const project = await getProjectWithAccess(
    projectId,
    identity.userId,
    identity.email,
  );
  if (!project)
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (!project.canvasBlobUrl) {
    return NextResponse.json({ canvas: null });
  }

  const res = await fetch(project.canvasBlobUrl);
  if (!res.ok) return NextResponse.json({ canvas: null });

  const canvas = await res.json();
  return NextResponse.json({ canvas });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { projectId } = await params;
  if (!isValidProjectId(projectId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const identity = await getCurrentIdentity();
  if (!identity)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const project = await getProjectWithAccess(
    projectId,
    identity.userId,
    identity.email,
  );
  if (!project)
    return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body)
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const blob = await put(`canvases/${projectId}.json`, JSON.stringify(body), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  await prisma.project.update({
    where: { id: projectId },
    data: { canvasBlobUrl: blob.url },
  });

  return NextResponse.json({ url: blob.url });
}
