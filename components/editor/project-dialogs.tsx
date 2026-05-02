"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { type ProjectActionsHandle } from "@/hooks/use-project-actions"

interface ProjectDialogsProps {
  actions: ProjectActionsHandle
}

export function ProjectDialogs({ actions }: ProjectDialogsProps) {
  return (
    <>
      <CreateProjectDialog actions={actions} />
      <RenameProjectDialog actions={actions} />
      <DeleteProjectDialog actions={actions} />
    </>
  )
}

function CreateProjectDialog({ actions }: { actions: ProjectActionsHandle }) {
  function handleOpenChange(open: boolean) {
    if (!open && !actions.loading) actions.close()
  }

  return (
    <Dialog open={actions.dialog === "create"} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-copy-primary">New Project</DialogTitle>
          <DialogDescription>Name your architecture workspace.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Input
            className="text-copy-primary"
            placeholder="Project name"
            value={actions.name}
            onChange={(e) => actions.setName(e.target.value)}
            autoFocus
          />
          <p className="min-h-4 text-xs text-copy-muted">
            {actions.roomId && (
              <>
                <span className="text-copy-muted">room ID: </span>
                {actions.roomId}
              </>
            )}
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={actions.close} disabled={actions.loading}>
            Cancel
          </Button>
          <Button
            disabled={!actions.name.trim() || actions.loading}
            onClick={actions.submitCreate}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RenameProjectDialog({ actions }: { actions: ProjectActionsHandle }) {
  function handleOpenChange(open: boolean) {
    if (!open && !actions.loading) actions.close()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && actions.name.trim()) {
      actions.submitRename()
    }
  }

  return (
    <Dialog open={actions.dialog === "rename"} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-copy-primary">Rename Project</DialogTitle>
          {actions.selectedProject && (
            <DialogDescription>
              Renaming &ldquo;{actions.selectedProject.name}&rdquo;
            </DialogDescription>
          )}
        </DialogHeader>
        <Input
          className="text-copy-primary"
          placeholder="Project name"
          value={actions.name}
          onChange={(e) => actions.setName(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        <DialogFooter>
          <Button variant="outline" onClick={actions.close} disabled={actions.loading}>
            Cancel
          </Button>
          <Button
            disabled={!actions.name.trim() || actions.loading}
            onClick={actions.submitRename}
          >
            Rename
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DeleteProjectDialog({ actions }: { actions: ProjectActionsHandle }) {
  function handleOpenChange(open: boolean) {
    if (!open && !actions.loading) actions.close()
  }

  return (
    <Dialog open={actions.dialog === "delete"} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-copy-primary">Delete Project</DialogTitle>
          {actions.selectedProject && (
            <DialogDescription>
              Are you sure you want to delete &ldquo;{actions.selectedProject.name}&rdquo;? This
              action cannot be undone.
            </DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={actions.close} disabled={actions.loading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={actions.loading}
            onClick={actions.submitDelete}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
