"use client"

import { Plus } from "lucide-react"
import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectDialogs } from "@/components/editor/project-dialogs"
import { useProjectActions } from "@/hooks/use-project-actions"
import { type Project } from "@/types/project"
import { Button } from "@/components/ui/button"

interface EditorShellProps {
  ownedProjects: Project[]
  sharedProjects: Project[]
}

export function EditorShell({ ownedProjects, sharedProjects }: EditorShellProps) {
  const actions = useProjectActions()

  return (
    <>
      <EditorNavbar
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
        onNewProject={actions.openCreate}
        onRenameProject={actions.openRename}
        onDeleteProject={actions.openDelete}
      />
      <main className="flex h-screen items-center justify-center pt-12">
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-xl font-semibold text-copy-primary">
            Create a project or open an existing one
          </h1>
          <p className="max-w-sm text-sm text-copy-muted">
            Start a new architecture workspace, or choose a project from the sidebar.
          </p>
          <Button onClick={actions.openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </main>
      <ProjectDialogs actions={actions} />
    </>
  )
}
