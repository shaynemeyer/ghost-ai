"use client";

import { type NodeShape, SHAPE_DEFAULTS } from "@/types/canvas";

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

export function ShapePanel() {
  function onDragStart(e: React.DragEvent, shape: NodeShape) {
    const { width, height } = SHAPE_DEFAULTS[shape];
    e.dataTransfer.setData(
      "application/canvas-shape",
      JSON.stringify({ shape, width, height })
    );
    e.dataTransfer.effectAllowed = "copy";
  }

  return (
    <div className="flex items-center gap-1 rounded-full border border-surface-border bg-surface px-3 py-2 shadow-lg">
      {SHAPES.map((shape) => (
        <button
          key={shape}
          draggable
          onDragStart={(e) => onDragStart(e, shape)}
          className="cursor-grab rounded-xl p-1.5 text-copy-muted transition-colors hover:bg-elevated hover:text-copy-primary active:cursor-grabbing"
          title={shape}
        >
          <ShapeIcon shape={shape} />
        </button>
      ))}
    </div>
  );
}
