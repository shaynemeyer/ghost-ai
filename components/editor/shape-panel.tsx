"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { type NodeShape, SHAPE_DEFAULTS, NODE_COLORS } from "@/types/canvas";
import { ShapeBody } from "./canvas-node";

const SHAPES: NodeShape[] = [
  "rectangle",
  "diamond",
  "circle",
  "pill",
  "cylinder",
  "hexagon",
];

function ShapeIcon({ shape }: { shape: NodeShape }) {
  switch (shape) {
    case "rectangle":
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <rect x="1" y="4" width="18" height="12" rx="1.5" />
        </svg>
      );
    case "diamond":
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <polygon points="10,1 19,10 10,19 1,10" />
        </svg>
      );
    case "circle":
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <circle cx="10" cy="10" r="9" />
        </svg>
      );
    case "pill":
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <rect x="1" y="5" width="18" height="10" rx="5" />
        </svg>
      );
    case "cylinder":
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <ellipse cx="10" cy="5" rx="8" ry="3" />
          <rect x="2" y="5" width="16" height="10" />
          <ellipse cx="10" cy="15" rx="8" ry="3" />
        </svg>
      );
    case "hexagon":
      return (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <polygon points="10,1 18,5.5 18,14.5 10,19 2,14.5 2,5.5" />
        </svg>
      );
  }
}

type DragState = { shape: NodeShape; x: number; y: number };

function ShapeDragPreview({ shape, x, y }: DragState) {
  const { width, height } = SHAPE_DEFAULTS[shape];
  return (
    <div
      className="pointer-events-none fixed z-50 opacity-60"
      style={{ left: x - width / 2, top: y - height / 2, width, height }}
    >
      <ShapeBody shape={shape} fill={NODE_COLORS[0].fill} stroke="var(--accent-primary)" />
    </div>
  );
}

export function ShapePanel() {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => setIsMounted(true), []);

  const isDragging = dragState !== null;
  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) =>
      setDragState((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : null));
    const onDragEnd = () => setDragState(null);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("dragend", onDragEnd);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("dragend", onDragEnd);
    };
  }, [isDragging]);

  function onDragStart(e: React.DragEvent, shape: NodeShape) {
    const { width, height } = SHAPE_DEFAULTS[shape];
    e.dataTransfer.setData(
      "application/canvas-shape",
      JSON.stringify({ shape, width, height })
    );
    e.dataTransfer.effectAllowed = "copy";

    const ghost = document.createElement("div");
    ghost.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0";
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => ghost.remove(), 0);

    setDragState({ shape, x: e.clientX, y: e.clientY });
  }

  return (
    <>
      <div className="flex items-center gap-1 rounded-full border border-surface-border bg-surface px-3 py-2 shadow-lg">
        {SHAPES.map((shape) => (
          <button
            key={shape}
            draggable
            onDragStart={(e) => onDragStart(e, shape)}
            onDragEnd={() => setDragState(null)}
            className="cursor-grab rounded-xl p-1.5 text-copy-muted transition-colors hover:bg-elevated hover:text-copy-primary active:cursor-grabbing"
            title={shape}
          >
            <ShapeIcon shape={shape} />
          </button>
        ))}
      </div>
      {isMounted && dragState && createPortal(<ShapeDragPreview {...dragState} />, document.body)}
    </>
  );
}
