"use client"

import { toSlug } from "@/lib/slug"
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
import { type ProjectDialogsHandle } from "@/hooks/use-project-dialogs"

interface ProjectDialogsProps {
  dialogs: ProjectDialogsHandle
}

export function ProjectDialogs({ dialogs }: ProjectDialogsProps) {
  return (
    <>
      <CreateProjectDialog dialogs={dialogs} />
      <RenameProjectDialog dialogs={dialogs} />
      <DeleteProjectDialog dialogs={dialogs} />
    </>
  )
}

function CreateProjectDialog({ dialogs }: { dialogs: ProjectDialogsHandle }) {
  const slug = toSlug(dialogs.name)

  function handleOpenChange(open: boolean) {
    if (!open) dialogs.close()
  }

  return (
    <Dialog open={dialogs.dialog === "create"} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
          <DialogDescription>Name your architecture workspace.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Input
            placeholder="Project name"
            value={dialogs.name}
            onChange={(e) => dialogs.setName(e.target.value)}
            autoFocus
          />
          <p className="min-h-4 text-xs text-copy-faint">
            {slug && (
              <>
                <span className="text-copy-muted">slug: </span>
                {slug}
              </>
            )}
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={dialogs.close}>
            Cancel
          </Button>
          <Button disabled={!dialogs.name.trim()} onClick={dialogs.close}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RenameProjectDialog({ dialogs }: { dialogs: ProjectDialogsHandle }) {
  function handleOpenChange(open: boolean) {
    if (!open) dialogs.close()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && dialogs.name.trim()) {
      dialogs.close()
    }
  }

  return (
    <Dialog open={dialogs.dialog === "rename"} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Rename Project</DialogTitle>
          {dialogs.selectedProject && (
            <DialogDescription>
              Renaming &ldquo;{dialogs.selectedProject.name}&rdquo;
            </DialogDescription>
          )}
        </DialogHeader>
        <Input
          placeholder="Project name"
          value={dialogs.name}
          onChange={(e) => dialogs.setName(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        <DialogFooter>
          <Button variant="outline" onClick={dialogs.close}>
            Cancel
          </Button>
          <Button disabled={!dialogs.name.trim()} onClick={dialogs.close}>
            Rename
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DeleteProjectDialog({ dialogs }: { dialogs: ProjectDialogsHandle }) {
  function handleOpenChange(open: boolean) {
    if (!open) dialogs.close()
  }

  return (
    <Dialog open={dialogs.dialog === "delete"} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Delete Project</DialogTitle>
          {dialogs.selectedProject && (
            <DialogDescription>
              Are you sure you want to delete &ldquo;{dialogs.selectedProject.name}&rdquo;? This
              action cannot be undone.
            </DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={dialogs.close}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={dialogs.close}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
