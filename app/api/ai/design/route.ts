import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { tasks } from "@trigger.dev/sdk/v3";
import { prisma } from "@/lib/prisma";
import { getProjectWithAccess, getCurrentIdentity } from "@/lib/project-access";
import type { designAgentTask } from "@/trigger/design-agent";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { prompt, roomId, projectId } = body;

  if (typeof prompt !== "string" || !prompt.trim()) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }
  if (prompt.length > 2000) {
    return NextResponse.json({ error: "prompt too long" }, { status: 400 });
  }
  if (typeof roomId !== "string" || !roomId.trim()) {
    return NextResponse.json({ error: "roomId is required" }, { status: 400 });
  }
  if (typeof projectId !== "string" || !projectId.trim()) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  const identity = await getCurrentIdentity();
  if (!identity) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const project = await getProjectWithAccess(projectId, identity.userId, identity.email);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const handle = await tasks.trigger<typeof designAgentTask>("design-agent", { prompt, roomId });

  await prisma.taskRun.create({
    data: { runId: handle.id, projectId, userId },
  });

  return NextResponse.json({ runId: handle.id }, { status: 201 });
}
