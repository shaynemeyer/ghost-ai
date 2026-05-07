"use client";

import { Component, type ReactNode } from "react";
import { ClientSideSuspense } from "@liveblocks/react";
import { ReactFlowProvider } from "@xyflow/react";
import { Canvas } from "./canvas";

interface CanvasWrapperProps {
  projectId: string;
  templatesOpen: boolean;
  onTemplatesOpenChange: (open: boolean) => void;
  onSaveStatusChange: (status: import("@/hooks/use-canvas-autosave").SaveStatus) => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

class CanvasErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full items-center justify-center">
          <span className="text-sm text-copy-faint">Failed to connect to canvas</span>
        </div>
      );
    }
    return this.props.children;
  }
}

export function CanvasWrapper({ projectId, templatesOpen, onTemplatesOpenChange, onSaveStatusChange }: CanvasWrapperProps) {
  return (
    <CanvasErrorBoundary>
      <ClientSideSuspense
        fallback={
          <div className="flex h-full items-center justify-center">
            <span className="text-sm text-copy-faint">Connecting...</span>
          </div>
        }
      >
        <ReactFlowProvider>
          <Canvas
            projectId={projectId}
            templatesOpen={templatesOpen}
            onTemplatesOpenChange={onTemplatesOpenChange}
            onSaveStatusChange={onSaveStatusChange}
          />
        </ReactFlowProvider>
      </ClientSideSuspense>
    </CanvasErrorBoundary>
  );
}
