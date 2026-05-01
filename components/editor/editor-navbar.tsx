"use client"

import { useState } from "react"
import { PanelLeftOpen, PanelLeftClose } from "lucide-react"
import { cn } from "@/lib/utils"
import { ProjectSidebar } from "./project-sidebar"

export function EditorNavbar() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 h-12 flex items-center bg-surface border-b border-surface-border">
        <div className="flex items-center px-3">
          <button
            onClick={() => setSidebarOpen((open) => !open)}
            className={cn(
              "p-1.5 rounded-xl transition-colors",
              "text-copy-muted hover:text-copy-primary hover:bg-elevated"
            )}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-5 w-5" />
            ) : (
              <PanelLeftOpen className="h-5 w-5" />
            )}
          </button>
        </div>
        <div className="flex-1" />
        <div className="px-3" />
      </header>
      <ProjectSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  )
}
