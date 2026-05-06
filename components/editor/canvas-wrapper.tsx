"use client";

import { Component, type ReactNode } from "react";
import { LiveblocksProvider, RoomProvider, ClientSideSuspense } from "@liveblocks/react";
import { ReactFlowProvider } from "@xyflow/react";
import { Canvas } from "./canvas";

interface CanvasWrapperProps {
  roomId: string;
  templatesOpen: boolean;
  onTemplatesOpenChange: (open: boolean) => void;
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

export function CanvasWrapper({ roomId, templatesOpen, onTemplatesOpenChange }: CanvasWrapperProps) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={roomId}
        initialPresence={{ cursor: null, thinking: false }}
      >
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
                templatesOpen={templatesOpen}
                onTemplatesOpenChange={onTemplatesOpenChange}
              />
            </ReactFlowProvider>
          </ClientSideSuspense>
        </CanvasErrorBoundary>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
