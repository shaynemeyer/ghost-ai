"use client"

import { useState } from "react"
import { PanelLeftOpen, PanelLeftClose, Share2, BotMessageSquare } from "lucide-react"
import { UserButton } from "@clerk/nextjs"
import { cn } from "@/lib/utils"
import { ProjectSidebar } from "./project-sidebar"
import { ProjectDialogs } from "./project-dialogs"
import { ShareDialog } from "./share-dialog"
import { Button } from "@/components/ui/button"
import { useProjectActions } from "@/hooks/use-project-actions"
import { type Project } from "@/types/project"

interface WorkspaceShellProps {
  project: Project
  isOwner: boolean
  ownedProjects: Project[]
  sharedProjects: Project[]
}

export function WorkspaceShell({ project, isOwner, ownedProjects, sharedProjects }: WorkspaceShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [aiSidebarOpen, setAiSidebarOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const actions = useProjectActions()

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 h-12 flex items-center bg-surface border-b border-surface-border">
        <div className="flex items-center gap-2 px-3">
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
          <span className="text-sm font-medium text-copy-primary truncate max-w-xs">
            {project.name}
          </span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2 px-3">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShareOpen(true)}>
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <button
            onClick={() => setAiSidebarOpen((open) => !open)}
            className={cn(
              "p-1.5 rounded-xl transition-colors",
              aiSidebarOpen
                ? "text-brand bg-accent-dim"
                : "text-copy-muted hover:text-copy-primary hover:bg-elevated"
            )}
            aria-label="Toggle AI sidebar"
          >
            <BotMessageSquare className="h-5 w-5" />
          </button>
          <UserButton />
        </div>
      </header>

      <ProjectSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        activeProjectId={project.id}
        onNewProject={actions.openCreate}
        onRenameProject={actions.openRename}
        onDeleteProject={actions.openDelete}
      />

      <div className="flex h-screen pt-12 overflow-hidden">
        <main className="flex flex-1 items-center justify-center bg-base">
          <span className="text-sm text-copy-faint">Canvas coming soon</span>
        </main>

        {aiSidebarOpen && (
          <aside className="w-80 shrink-0 border-l border-surface-border bg-surface flex items-center justify-center">
            <span className="text-sm text-copy-faint">AI chat coming soon</span>
          </aside>
        )}
      </div>

      <ProjectDialogs actions={actions} />

      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        projectId={project.id}
        projectName={project.name}
        isOwner={isOwner}
      />
    </>
  )
}