"use client";

import { useOthers } from "@liveblocks/react";
import { UserButton, useUser } from "@clerk/nextjs";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function CollaboratorAvatar({
  name,
  avatar,
  color,
}: {
  name: string;
  avatar: string;
  color: string;
}) {
  return (
    <div
      className="relative -ml-2 first:ml-0 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-2 ring-base overflow-hidden"
      style={{ backgroundColor: color, color: "#fff" }}
      title={name}
    >
      {avatar ? (
        <img src={avatar} alt={name} className="h-full w-full object-cover" />
      ) : (
        getInitials(name)
      )}
    </div>
  );
}

export function PresenceAvatars() {
  const { user } = useUser();
  const others = useOthers();

  const collaborators = others.filter((other) => other.id !== user?.id);
  const visible = collaborators.slice(0, 5);
  const overflow = collaborators.length - 5;

  return (
    <div className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/90 px-2 py-1 shadow-lg backdrop-blur-sm">
      {collaborators.length > 0 && (
        <>
          <div className="flex items-center">
            {visible.map((other) => (
              <CollaboratorAvatar
                key={other.connectionId}
                name={other.info.name}
                avatar={other.info.avatar}
                color={other.info.cursorColor}
              />
            ))}
            {overflow > 0 && (
              <div className="relative -ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xs font-medium text-copy-primary ring-2 ring-base">
                +{overflow}
              </div>
            )}
          </div>
          <div className="h-5 w-px bg-zinc-700" />
        </>
      )}
      <UserButton appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
    </div>
  );
}
