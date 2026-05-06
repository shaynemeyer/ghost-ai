"use client";

import { useState, useRef, useEffect } from "react";
import { Handle, Position, NodeResizer, useReactFlow, type NodeProps } from "@xyflow/react";
import { NODE_COLORS } from "@/types/canvas";
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

export function CanvasNodeRenderer({ id, data, selected }: NodeProps<CanvasNode>) {
  const stroke = selected ? "var(--accent-primary)" : "var(--border-subtle)";
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(data.label);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const escapedRef = useRef(false);
  const { updateNodeData } = useReactFlow();
  const [hoveredSwatch, setHoveredSwatch] = useState<number | null>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (!selected) setHoveredSwatch(null);
  }, [selected]);

  function startEditing() {
    setEditValue(data.label);
    setIsEditing(true);
  }

  function commitEdit() {
    if (escapedRef.current) {
      escapedRef.current = false;
      setIsEditing(false);
      return;
    }
    updateNodeData(id, { label: editValue });
    setIsEditing(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      escapedRef.current = true;
      setIsEditing(false);
    }
  }

  return (
    <div className="group relative h-full w-full">
      {selected && (
        <div
          className="nodrag nopan absolute left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-surface-border bg-surface px-2 py-1.5 shadow-lg"
          style={{ bottom: "calc(100% + 8px)" }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {NODE_COLORS.map((color, i) => {
            const isActive = color.fill === data.color.fill && color.text === data.color.text;
            const isHovered = hoveredSwatch === i;
            const shadow = [
              isActive ? `0 0 0 2px ${color.text}` : null,
              isHovered ? `0 0 6px 1px ${color.text}40` : null,
            ]
              .filter(Boolean)
              .join(", ") || undefined;
            return (
              <button
                type="button"
                key={i}
                className="h-4 w-4 shrink-0 cursor-pointer rounded-full transition-transform hover:scale-110"
                style={{ background: color.fill, boxShadow: shadow }}
                onMouseEnter={() => setHoveredSwatch(i)}
                onMouseLeave={() => setHoveredSwatch(null)}
                onClick={() => updateNodeData(id, { color })}
                aria-label={`Color option ${i + 1}`}
              />
            );
          })}
        </div>
      )}
      <NodeResizer
        isVisible={selected}
        minWidth={60}
        minHeight={40}
        lineStyle={{ borderColor: "var(--accent-primary)", opacity: 0.4 }}
        handleStyle={{
          background: "var(--bg-surface)",
          borderColor: "var(--accent-primary)",
          opacity: 0.7,
          width: 6,
          height: 6,
        }}
      />
      <ShapeBody shape={data.shape} fill={data.color.fill} stroke={stroke} />
      {isEditing ? (
        <textarea
          ref={textareaRef}
          rows={1}
          className="nodrag nopan absolute left-0 right-0 resize-none bg-transparent px-2 text-center text-xs outline-none"
          style={{ top: "50%", transform: "translateY(-50%)", color: data.color.text }}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={onKeyDown}
        />
      ) : (
        <span
          className="absolute inset-0 flex items-center justify-center px-2 text-xs"
          style={{ color: data.color.text }}
          onDoubleClick={(e) => { e.stopPropagation(); startEditing(); }}
        >
          {data.label
            ? <span className="min-w-0 truncate">{data.label}</span>
            : <span className="min-w-0 truncate opacity-40">label</span>
          }
        </span>
      )}
      <Handle id="top" type="source" position={Position.Top} className="bg-white! border-zinc-600! opacity-0! transition-opacity! group-hover:opacity-100!" />
      <Handle id="right" type="source" position={Position.Right} className="bg-white! border-zinc-600! opacity-0! transition-opacity! group-hover:opacity-100!" />
      <Handle id="bottom" type="source" position={Position.Bottom} className="bg-white! border-zinc-600! opacity-0! transition-opacity! group-hover:opacity-100!" />
      <Handle id="left" type="source" position={Position.Left} className="bg-white! border-zinc-600! opacity-0! transition-opacity! group-hover:opacity-100!" />
    </div>
  );
}
