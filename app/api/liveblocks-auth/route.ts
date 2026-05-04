import "server-only";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getLiveblocks, getUserCursorColor } from "@/lib/liveblocks";
import { getCurrentIdentity, getProjectWithAccess } from "@/lib/project-access";
import { isValidProjectId } from "@/lib/validation";

export async function POST(request: Request) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { room } = await request.json();
  if (!room || typeof room !== "string" || !isValidProjectId(room)) {
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  }

  const project = await getProjectWithAccess(room, identity.userId, identity.email);
  if (!project) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const lb = getLiveblocks();
  await lb.getOrCreateRoom(room, { defaultAccesses: [] });

  const user = await currentUser();
  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || identity.email;
  const avatar = user?.imageUrl ?? "";
  const cursorColor = getUserCursorColor(identity.userId);

  const session = lb.prepareSession(identity.userId, {
    userInfo: { name, avatar, cursorColor },
  });
  session.allow(room, session.FULL_ACCESS);

  const { status, body } = await session.authorize();
  return new Response(body, { status });
}
