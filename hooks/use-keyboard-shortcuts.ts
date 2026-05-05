"use client";
import { useEffect, useRef } from "react";
import type { ReactFlowInstance } from "@xyflow/react";

interface Options {
  instance: ReactFlowInstance;
  undo: () => void;
  redo: () => void;
}

export function useKeyboardShortcuts({ instance, undo, redo }: Options) {
  const undoRef = useRef(undo);
  const redoRef = useRef(redo);
  undoRef.current = undo;
  redoRef.current = redo;

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      )
        return;

      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      if (!mod && (key === "+" || key === "=")) {
        e.preventDefault();
        instance.zoomIn({ duration: 300 });
      } else if (!mod && key === "-") {
        e.preventDefault();
        instance.zoomOut({ duration: 300 });
      } else if (mod && !e.shiftKey && key === "z") {
        e.preventDefault();
        undoRef.current();
      } else if (mod && e.shiftKey && key === "z") {
        e.preventDefault();
        redoRef.current();
      } else if (mod && key === "y") {
        e.preventDefault();
        redoRef.current();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [instance]);
}
