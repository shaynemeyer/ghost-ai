"use client";

import { useState, useRef, useEffect } from "react";
import {
  getSmoothStepPath,
  EdgeLabelRenderer,
  BaseEdge,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react";
import type { CanvasEdge } from "@/types/canvas";

export function CanvasEdgeRenderer({
  id,
  data,
  selected,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  markerStart,
  style,
}: EdgeProps<CanvasEdge>) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(data?.label ?? "");
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const escapedRef = useRef(false);
  const hoverLeaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { updateEdgeData } = useReactFlow();

  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  function startEditing() {
    setEditValue(data?.label ?? "");
    setIsEditing(true);
  }

  function commit() {
    if (escapedRef.current) {
      escapedRef.current = false;
      setIsEditing(false);
      return;
    }
    updateEdgeData(id, { label: editValue });
    setIsEditing(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    }
    if (e.key === "Escape") {
      escapedRef.current = true;
      setIsEditing(false);
    }
  }

  function onHoverEnter() {
    if (hoverLeaveTimer.current) clearTimeout(hoverLeaveTimer.current);
    setIsHovered(true);
  }

  function onHoverLeave() {
    hoverLeaveTimer.current = setTimeout(() => setIsHovered(false), 30);
  }

  const edgeOpacity = selected || isHovered ? 1 : 0.5;

  return (
    <>
      <BaseEdge
        path={path}
        markerEnd={markerEnd}
        markerStart={markerStart}
        interactionWidth={20}
        style={{ ...style, opacity: edgeOpacity, transition: "opacity 0.15s" }}
        onMouseEnter={onHoverEnter}
        onMouseLeave={onHoverLeave}
      />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan absolute pointer-events-auto"
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseEnter={onHoverEnter}
          onMouseLeave={onHoverLeave}
        >
          {isEditing ? (
            <input
              ref={inputRef}
              className="nodrag nopan rounded-full border border-surface-border bg-surface px-2 py-0.5 text-center text-xs text-copy-primary outline-none"
              style={{ width: `${Math.max(editValue.length || 4, 4)}ch` }}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={commit}
              onKeyDown={onKeyDown}
            />
          ) : data?.label ? (
            <span
              className="cursor-default select-none rounded-full border border-surface-border bg-surface px-2 py-0.5 text-xs text-copy-secondary"
              onDoubleClick={(e) => { e.stopPropagation(); startEditing(); }}
            >
              {data.label}
            </span>
          ) : (selected || isHovered) ? (
            <span
              className="cursor-default select-none rounded-full px-2 py-0.5 text-xs text-copy-primary opacity-30"
              onDoubleClick={(e) => { e.stopPropagation(); startEditing(); }}
            >
              label
            </span>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
