"use client";

import { useEffect, useRef, useState } from "react";
import type { CanvasNode, CanvasEdge } from "@/types/canvas";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

const DEBOUNCE_MS = 2000;

export function useCanvasAutosave(
  projectId: string,
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  enabled: boolean,
  isLoaded: boolean
) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initializedRef = useRef(false);
  const lastSavedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !isLoaded) return;

    const payload = JSON.stringify({ nodes, edges });

    // Skip the very first render after load — we only save on changes.
    if (!initializedRef.current) {
      initializedRef.current = true;
      lastSavedRef.current = payload;
      return;
    }

    // Skip if content hasn't changed — avoids saving remote collaborator updates.
    if (payload === lastSavedRef.current) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      setStatus("saving");
      try {
        const res = await fetch(`/api/projects/${projectId}/canvas`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: payload,
        });
        if (!res.ok) throw new Error("Save failed");
        lastSavedRef.current = payload;
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [projectId, nodes, edges, enabled, isLoaded]);

  return status;
}
