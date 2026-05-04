import "server-only";
import { Liveblocks } from "@liveblocks/node";

const CURSOR_COLORS = [
  "#E03130",
  "#2F9E44",
  "#1971C2",
  "#F08C00",
  "#7048E8",
  "#C2255C",
  "#0C8599",
  "#5C940D",
  "#D6336C",
  "#1864AB",
];

export function getUserCursorColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) & 0x7fffffff;
  }
  return CURSOR_COLORS[hash % CURSOR_COLORS.length];
}

const globalForLiveblocks = globalThis as unknown as { liveblocks?: Liveblocks };

export function getLiveblocks(): Liveblocks {
  globalForLiveblocks.liveblocks ??= new Liveblocks({
    secret: process.env.LIVEBLOCKS_SECRET_KEY!,
  });
  return globalForLiveblocks.liveblocks;
}
