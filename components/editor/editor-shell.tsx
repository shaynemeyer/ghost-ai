"use client"

import { Plus } from "lucide-react"
import { EditorNavbar } from "@/components/editor/editor-navbar"
import { ProjectDialogs } from "@/components/editor/project-dialogs"
import { useProjectDialogs } from "@/hooks/use-project-dialogs"
import { MOCK_PROJECTS, MOCK_CURRENT_USER_ID } from "@/types/project"
import { Button } from "@/components/ui/button"

export function EditorShell() {
  const dialogs = useProjectDialogs()

  return (
    <>
      <EditorNavbar
        currentUserId={MOCK_CURRENT_USER_ID}
        projects={MOCK_PROJECTS}
        onNewProject={dialogs.openCreate}
        onRenameProject={dialogs.openRename}
        onDeleteProject={dialogs.openDelete}
      />
      <main className="flex h-screen items-center justify-center pt-12">
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-xl font-semibold text-copy-primary">
            Create a project or open an existing one
          </h1>
          <p className="max-w-sm text-sm text-copy-muted">
            Start a new architecture workspace, or choose a project from the sidebar.
          </p>
          <Button onClick={dialogs.openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </main>
      <ProjectDialogs dialogs={dialogs} />
    </>
  )
}
