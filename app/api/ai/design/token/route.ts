import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { auth as triggerAuth } from "@trigger.dev/sdk/v3";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { runId } = body;

  if (typeof runId !== "string" || !runId.trim()) {
    return NextResponse.json({ error: "runId is required" }, { status: 400 });
  }

  const taskRun = await prisma.taskRun.findUnique({ where: { runId } });
  if (!taskRun || taskRun.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const token = await triggerAuth.createPublicToken({
    scopes: { read: { runs: [runId] } },
    expirationTime: "1h",
  });

  return NextResponse.json({ token });
}
