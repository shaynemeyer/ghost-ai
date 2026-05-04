"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { CanvasNode, NodeShape } from "@/types/canvas";

type ShapeBodyProps = {
  shape: NodeShape;
  fill: string;
  stroke: string;
};

export function ShapeBody({ shape, fill, stroke }: ShapeBodyProps) {
  switch (shape) {
    case "rectangle":
      return (
        <div
          className="h-full w-full rounded-xl"
          style={{ background: fill, border: `1px solid ${stroke}` }}
        />
      );
    case "pill":
      return (
        <div
          className="h-full w-full rounded-full"
          style={{ background: fill, border: `1px solid ${stroke}` }}
        />
      );
    case "circle":
      return (
        <div
          className="h-full w-full rounded-full"
          style={{ background: fill, border: `1px solid ${stroke}` }}
        />
      );
    case "diamond":
      return (
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon
            points="50,2 98,50 50,98 2,50"
            fill={fill}
            stroke={stroke}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      );
    case "hexagon":
      return (
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon
            points="50,2 95,26 95,74 50,98 5,74 5,26"
            fill={fill}
            stroke={stroke}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      );
    case "cylinder":
      return (
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <rect x="3" y="18" width="94" height="64" fill={fill} />
          <line x1="3" y1="18" x2="3" y2="82" stroke={stroke} strokeWidth="2" vectorEffect="non-scaling-stroke" />
          <line x1="97" y1="18" x2="97" y2="82" stroke={stroke} strokeWidth="2" vectorEffect="non-scaling-stroke" />
          <ellipse cx="50" cy="82" rx="47" ry="14" fill={fill} stroke={stroke} strokeWidth="2" vectorEffect="non-scaling-stroke" />
          <ellipse cx="50" cy="18" rx="47" ry="14" fill={fill} />
          <path d="M 3 18 A 47 14 0 0 1 97 18" fill="none" stroke={stroke} strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </svg>
      );
  }
}

export function CanvasNodeRenderer({ data, selected }: NodeProps<CanvasNode>) {
  const stroke = selected ? "var(--accent-primary)" : "var(--border-subtle)";

  return (
    <div className="relative h-full w-full">
      <ShapeBody shape={data.shape} fill={data.color.fill} stroke={stroke} />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="truncate px-3 text-xs" style={{ color: data.color.text }}>
          {data.label}
        </span>
      </div>
      <Handle type="target" position={Position.Top} className="bg-white! border-white/40!" />
      <Handle type="source" position={Position.Right} className="bg-white! border-white/40!" />
      <Handle type="source" position={Position.Bottom} className="bg-white! border-white/40!" />
      <Handle type="target" position={Position.Left} className="bg-white! border-white/40!" />
    </div>
  );
}
