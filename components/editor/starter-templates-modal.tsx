"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SHAPE_DEFAULTS } from "@/types/canvas";
import { CANVAS_TEMPLATES, type CanvasTemplate } from "./starter-templates";
import type { CanvasNode, CanvasEdge } from "@/types/canvas";

interface StarterTemplatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (template: CanvasTemplate) => void;
}

const PREVIEW_W = 280;
const PREVIEW_H = 150;
const PREVIEW_PAD = 10;

function TemplatePreview({ nodes, edges }: { nodes: CanvasNode[]; edges: CanvasEdge[] }) {
  if (nodes.length === 0) return null;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const n of nodes) {
    const w = n.width ?? SHAPE_DEFAULTS[n.data.shape].width;
    const h = n.height ?? SHAPE_DEFAULTS[n.data.shape].height;
    minX = Math.min(minX, n.position.x);
    minY = Math.min(minY, n.position.y);
    maxX = Math.max(maxX, n.position.x + w);
    maxY = Math.max(maxY, n.position.y + h);
  }

  const contentW = maxX - minX || 1;
  const contentH = maxY - minY || 1;
  const usableW = PREVIEW_W - 2 * PREVIEW_PAD;
  const usableH = PREVIEW_H - 2 * PREVIEW_PAD;
  const scale = Math.min(usableW / contentW, usableH / contentH);
  const scaledW = contentW * scale;
  const scaledH = contentH * scale;
  const ox = PREVIEW_PAD + (usableW - scaledW) / 2;
  const oy = PREVIEW_PAD + (usableH - scaledH) / 2;

  function px(x: number) { return (x - minX) * scale + ox; }
  function py(y: number) { return (y - minY) * scale + oy; }

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  return (
    <svg
      width={PREVIEW_W}
      height={PREVIEW_H}
      viewBox={`0 0 ${PREVIEW_W} ${PREVIEW_H}`}
      className="rounded-xl"
    >
      <rect width={PREVIEW_W} height={PREVIEW_H} fill="var(--bg-base)" rx={12} />
      {edges.map((e) => {
        const src = nodeMap.get(e.source);
        const tgt = nodeMap.get(e.target);
        if (!src || !tgt) return null;
        const sw = src.width ?? SHAPE_DEFAULTS[src.data.shape].width;
        const sh = src.height ?? SHAPE_DEFAULTS[src.data.shape].height;
        const tw = tgt.width ?? SHAPE_DEFAULTS[tgt.data.shape].width;
        const th = tgt.height ?? SHAPE_DEFAULTS[tgt.data.shape].height;
        return (
          <line
            key={e.id}
            x1={px(src.position.x + sw / 2)}
            y1={py(src.position.y + sh / 2)}
            x2={px(tgt.position.x + tw / 2)}
            y2={py(tgt.position.y + th / 2)}
            stroke="var(--border-subtle)"
            strokeWidth={1.5}
          />
        );
      })}
      {nodes.map((n) => {
        const nw = (n.width ?? SHAPE_DEFAULTS[n.data.shape].width) * scale;
        const nh = (n.height ?? SHAPE_DEFAULTS[n.data.shape].height) * scale;
        const x = px(n.position.x);
        const y = py(n.position.y);
        const { fill, text: stroke } = n.data.color;
        return (
          <PreviewShape key={n.id} x={x} y={y} w={nw} h={nh} shape={n.data.shape} fill={fill} stroke={stroke} />
        );
      })}
    </svg>
  );
}

type PreviewShapeProps = {
  x: number; y: number; w: number; h: number;
  shape: CanvasNode["data"]["shape"];
  fill: string; stroke: string;
};

function PreviewShape({ x, y, w, h, shape, fill, stroke }: PreviewShapeProps) {
  const sw = 1;
  switch (shape) {
    case "rectangle":
      return <rect x={x} y={y} width={w} height={h} rx={w * 0.08} fill={fill} stroke={stroke} strokeWidth={sw} />;
    case "pill":
      return <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={fill} stroke={stroke} strokeWidth={sw} />;
    case "circle":
      return <ellipse cx={x + w / 2} cy={y + h / 2} rx={w / 2} ry={h / 2} fill={fill} stroke={stroke} strokeWidth={sw} />;
    case "diamond": {
      const pts = [
        `${x + w / 2},${y}`,
        `${x + w},${y + h / 2}`,
        `${x + w / 2},${y + h}`,
        `${x},${y + h / 2}`,
      ].join(" ");
      return <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={sw} />;
    }
    case "hexagon": {
      const pts = [
        `${x + w * 0.5},${y + h * 0.02}`,
        `${x + w * 0.95},${y + h * 0.26}`,
        `${x + w * 0.95},${y + h * 0.74}`,
        `${x + w * 0.5},${y + h * 0.98}`,
        `${x + w * 0.05},${y + h * 0.74}`,
        `${x + w * 0.05},${y + h * 0.26}`,
      ].join(" ");
      return <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={sw} />;
    }
    case "cylinder": {
      const rx = w * 0.47;
      const ry = h * 0.14;
      const cx = x + w / 2;
      const bodyTop = y + h * 0.18;
      const bodyBot = y + h * 0.82;
      return (
        <g>
          <rect x={x + w * 0.03} y={bodyTop} width={w * 0.94} height={h * 0.64} fill={fill} />
          <ellipse cx={cx} cy={bodyBot} rx={rx} ry={ry} fill={fill} stroke={stroke} strokeWidth={sw} />
          <line x1={x + w * 0.03} y1={bodyTop} x2={x + w * 0.03} y2={bodyBot} stroke={stroke} strokeWidth={sw} />
          <line x1={x + w * 0.97} y1={bodyTop} x2={x + w * 0.97} y2={bodyBot} stroke={stroke} strokeWidth={sw} />
          <ellipse cx={cx} cy={bodyTop} rx={rx} ry={ry} fill={fill} stroke={stroke} strokeWidth={sw} />
        </g>
      );
    }
  }
}

export function StarterTemplatesModal({ open, onOpenChange, onImport }: StarterTemplatesModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="text-copy-primary">Starter Templates</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 overflow-y-auto max-h-[60vh] pr-1">
          {CANVAS_TEMPLATES.map((template) => (
            <div
              key={template.id}
              className="flex flex-col gap-3 rounded-2xl border border-surface-border bg-elevated p-3"
            >
              <TemplatePreview nodes={template.nodes} edges={template.edges} />
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-copy-primary">{template.name}</span>
                <span className="text-xs text-copy-muted">{template.description}</span>
              </div>
              <Button
                size="sm"
                className="w-full"
                onClick={() => {
                  onImport(template);
                  onOpenChange(false);
                }}
              >
                Import
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
