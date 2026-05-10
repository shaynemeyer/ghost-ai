import { NextRequest, NextResponse } from "next/server";
import { tasks } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentIdentity, getProjectWithAccess } from "@/lib/project-access";
import type { generateSpecTask } from "@/trigger/generate-spec";

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"] as const),
  content: z.string(),
});

const nodeSchema = z.object({
  id: z.string(),
  data: z
    .object({
      label: z.string().optional(),
      shape: z.string().optional(),
    })
    .optional(),
  position: z.object({ x: z.number(), y: z.number() }).optional(),
});

const edgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  data: z.object({ label: z.string().optional() }).optional(),
});

const bodySchema = z.object({
  roomId: z.string().min(1),
  chatHistory: z.array(chatMessageSchema),
  nodes: z.array(nodeSchema),
  edges: z.array(edgeSchema),
});

export async function POST(req: NextRequest) {
  const identity = await getCurrentIdentity();
  if (!identity) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const raw = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const { roomId, chatHistory, nodes, edges } = parsed.data;

  // roomId is the project ID in this application — do not trust a client-supplied projectId
  const project = await getProjectWithAccess(roomId, identity.userId, identity.email);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const handle = await tasks.trigger<typeof generateSpecTask>("generate-spec", {
    projectId: project.id,
    roomId,
    chatHistory,
    nodes,
    edges,
  });

  await prisma.taskRun.create({
    data: { runId: handle.id, projectId: project.id, userId: identity.userId },
  });

  return NextResponse.json({ runId: handle.id }, { status: 201 });
}
