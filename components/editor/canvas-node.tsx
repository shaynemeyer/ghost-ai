"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { CanvasNode } from "@/types/canvas";

export function CanvasNodeRenderer({ data, selected }: NodeProps<CanvasNode>) {
  return (
    <div
      className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl text-xs"
      style={{
        background: data.color.fill,
        color: data.color.text,
        border: `1px solid ${selected ? "var(--accent-primary)" : "var(--border-subtle)"}`,
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-white !border-white/40" />
      <Handle type="source" position={Position.Right} className="!bg-white !border-white/40" />
      <Handle type="source" position={Position.Bottom} className="!bg-white !border-white/40" />
      <Handle type="target" position={Position.Left} className="!bg-white !border-white/40" />
      <span className="truncate px-2">{data.label}</span>
    </div>
  );
}
