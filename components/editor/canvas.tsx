"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  MarkerType,
  BackgroundVariant,
  ConnectionMode,
  Panel,
  useReactFlow,
  type NodeTypes,
  type EdgeTypes,
} from "@xyflow/react";
import { useLiveblocksFlow, Cursors } from "@liveblocks/react-flow";
import { useUndo, useRedo, useCanUndo, useCanRedo, useHistory, useUpdateMyPresence, useEventListener } from "@liveblocks/react";
import "@xyflow/react/dist/style.css";
import "@liveblocks/react-ui/styles.css";
import "@liveblocks/react-flow/styles.css";
import { ZoomIn, ZoomOut, Maximize2, Undo2, Redo2 } from "lucide-react";
import { CanvasNodeRenderer } from "./canvas-node";
import { CanvasEdgeRenderer } from "./canvas-edge";
import { ShapePanel } from "./shape-panel";
import { StarterTemplatesModal } from "./starter-templates-modal";
import { NODE_COLORS, type CanvasNode, type CanvasEdge, type NodeShape } from "@/types/canvas";
import { type CanvasTemplate } from "./starter-templates";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useCanvasAutosave, type SaveStatus } from "@/hooks/use-canvas-autosave";
import { PresenceAvatars } from "./presence-avatars";

function ControlButton({
  onClick,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex h-6 w-6 items-center justify-center rounded-full text-copy-secondary transition-colors hover:bg-zinc-800 hover:text-copy-primary disabled:opacity-30 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}

const nodeTypes: NodeTypes = { canvasNode: CanvasNodeRenderer };
const edgeTypes: EdgeTypes = { canvasEdge: CanvasEdgeRenderer };

function generateNodeId(shape: NodeShape): string {
  return `${shape}-${crypto.randomUUID()}`;
}

interface CanvasProps {
  projectId: string;
  templatesOpen: boolean;
  onTemplatesOpenChange: (open: boolean) => void;
  onSaveStatusChange: (status: SaveStatus) => void;
}

export function Canvas({ projectId, templatesOpen, onTemplatesOpenChange, onSaveStatusChange }: CanvasProps) {
  const instance = useReactFlow();
  const { screenToFlowPosition } = instance;
  const updateMyPresence = useUpdateMyPresence();
  const [aiStatus, setAiStatus] = useState<string | null>(null);
  useEventListener(({ event }) => {
    if (event.type === "AI_STATUS") {
      setAiStatus(event.message);
      setTimeout(() => setAiStatus(null), 4000);
    }
  });
  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const history = useHistory();
  useKeyboardShortcuts({ instance, undo, redo });
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: { initial: [] },
      edges: { initial: [] },
    });

  // Load saved canvas when room is empty on first mount.
  const loadedRef = useRef(false);
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    if (loadedRef.current) return;
    if (nodes.length > 0 || edges.length > 0) {
      loadedRef.current = true;
      setIsLoaded(true);
      return;
    }
    loadedRef.current = true;

    fetch(`/api/projects/${projectId}/canvas`)
      .then((r) => r.ok ? r.json() : null)
      .then((data: { canvas: { nodes: CanvasNode[]; edges: CanvasEdge[] } | null } | null) => {
        if (data?.canvas) {
          const { nodes: savedNodes, edges: savedEdges } = data.canvas;
          if (savedNodes?.length || savedEdges?.length) {
            history.pause();
            onNodesChange(savedNodes.map((n) => ({ type: "add" as const, item: n })));
            onEdgesChange(savedEdges.map((e) => ({ type: "add" as const, item: e })));
            history.resume();
            setTimeout(() => instance.fitView({ duration: 300 }), 50);
          }
        }
      })
      .catch((err) => console.error("Failed to load canvas:", err))
      .finally(() => setIsLoaded(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveStatus = useCanvasAutosave(projectId, nodes, edges, true, isLoaded);
  useEffect(() => {
    onSaveStatusChange(saveStatus);
  }, [saveStatus, onSaveStatusChange]);

  const handleImportTemplate = useCallback(
    (template: CanvasTemplate) => {
      history.pause();
      onNodesChange([
        ...nodes.map((n) => ({ type: "remove" as const, id: n.id })),
        ...template.nodes.map((n) => ({ type: "add" as const, item: n })),
      ]);
      onEdgesChange([
        ...edges.map((e) => ({ type: "remove" as const, id: e.id })),
        ...template.edges.map((e) => ({ type: "add" as const, item: e })),
      ]);
      history.resume();
      setTimeout(() => instance.fitView({ duration: 300 }), 50);
    },
    [nodes, edges, onNodesChange, onEdgesChange, instance, history]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const raw = e.dataTransfer.getData("application/canvas-shape");
      if (!raw) return;

      const { shape, width, height } = JSON.parse(raw) as {
        shape: NodeShape;
        width: number;
        height: number;
      };

      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const newNode: CanvasNode = {
        id: generateNodeId(shape),
        type: "canvasNode",
        position: { x: position.x - width / 2, y: position.y - height / 2 },
        data: { label: "", color: NODE_COLORS[0], shape },
        width,
        height,
      };

      onNodesChange([{ type: "add", item: newNode }]);
    },
    [screenToFlowPosition, onNodesChange]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      updateMyPresence({ cursor: screenToFlowPosition({ x: e.clientX, y: e.clientY }) });
    },
    [screenToFlowPosition, updateMyPresence]
  );

  const handleMouseLeave = useCallback(() => {
    updateMyPresence({ cursor: null });
  }, [updateMyPresence]);

  return (
    <div className="h-full w-full">
      <StarterTemplatesModal
        open={templatesOpen}
        onOpenChange={onTemplatesOpenChange}
        onImport={handleImportTemplate}
      />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        defaultEdgeOptions={{
          type: "canvasEdge",
          markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12 },
        }}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} />
        <Cursors />
        <Panel position="top-right" style={{ marginTop: "16px", marginRight: "16px" }}>
          <PresenceAvatars />
        </Panel>
        <Panel position="bottom-left" style={{ marginLeft: process.env.NODE_ENV === "development" ? "60px" : "16px", marginBottom: "16px" }}>
          <div className="flex items-center gap-0.5 rounded-full border border-zinc-800 bg-zinc-900/90 px-2 py-1.5 shadow-lg backdrop-blur-sm">
            <ControlButton onClick={() => instance.zoomOut({ duration: 300 })} title="Zoom out">
              <ZoomOut className="h-3.5 w-3.5" />
            </ControlButton>
            <ControlButton onClick={() => instance.fitView({ duration: 300 })} title="Fit view">
              <Maximize2 className="h-3.5 w-3.5" />
            </ControlButton>
            <ControlButton onClick={() => instance.zoomIn({ duration: 300 })} title="Zoom in">
              <ZoomIn className="h-3.5 w-3.5" />
            </ControlButton>
            <div className="mx-1.5 h-4 w-px bg-zinc-700" />
            <ControlButton onClick={undo} disabled={!canUndo} title="Undo">
              <Undo2 className="h-3.5 w-3.5" />
            </ControlButton>
            <ControlButton onClick={redo} disabled={!canRedo} title="Redo">
              <Redo2 className="h-3.5 w-3.5" />
            </ControlButton>
          </div>
        </Panel>
        <Panel position="bottom-center" className="mb-4">
          <ShapePanel />
        </Panel>
        {aiStatus && (
          <Panel position="top-center" style={{ marginTop: "16px" }}>
            <div className="rounded-full border border-purple-500/30 bg-zinc-900/90 px-4 py-1.5 text-xs text-purple-300 shadow-lg backdrop-blur-sm">
              {aiStatus}
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}
