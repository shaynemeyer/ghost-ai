"use client"

import { useState, useEffect, useCallback } from "react"
import { Link2, X, UserPlus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface CollaboratorProfile {
  id: string
  email: string
  name: string | null
  imageUrl: string | null
}

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  projectName: string
  isOwner: boolean
}

export function ShareDialog({ open, onOpenChange, projectId, projectName, isOwner }: ShareDialogProps) {
  const [collaborators, setCollaborators] = useState<CollaboratorProfile[]>([])
  const [email, setEmail] = useState("")
  const [inviting, setInviting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}/collaborators`)
    if (res.ok) {
      const data = await res.json() as { collaborators: CollaboratorProfile[] }
      setCollaborators(data.collaborators)
    }
  }, [projectId])

  useEffect(() => {
    if (open) load()
  }, [open, load])

  async function handleInvite() {
    if (!email.trim()) return
    setInviting(true)
    setError(null)
    const res = await fetch(`/api/projects/${projectId}/collaborators`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    })
    if (res.ok) {
      const collab = await res.json() as CollaboratorProfile
      setCollaborators((prev) => [...prev, collab])
      setEmail("")
    } else {
      const body = await res.json().catch(() => ({})) as { error?: string }
      setError(body.error ?? "Failed to invite collaborator")
    }
    setInviting(false)
  }

  async function handleRemove(collab: CollaboratorProfile) {
    const res = await fetch(`/api/projects/${projectId}/collaborators/${collab.id}`, { method: "DELETE" })
    if (res.ok) setCollaborators((prev) => prev.filter((c) => c.id !== collab.id))
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-copy-primary">Share &ldquo;{projectName}&rdquo;</DialogTitle>
          <DialogDescription>
            {isOwner ? "Invite collaborators by email." : "People with access to this project."}
          </DialogDescription>
        </DialogHeader>

        {isOwner && (
          <div className="flex flex-col gap-1.5">
            <div className="flex gap-2">
              <Input
                className="text-copy-primary flex-1"
                placeholder="colleague@example.com"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null) }}
                onKeyDown={(e) => { if (e.key === "Enter") handleInvite() }}
                autoFocus
              />
              <Button onClick={handleInvite} disabled={!email.trim() || inviting} className="gap-1.5 shrink-0">
                <UserPlus className="h-4 w-4" />
                Invite
              </Button>
            </div>
            {error && <p className="text-xs text-error">{error}</p>}
          </div>
        )}

        {collaborators.length > 0 && (
          <ul className="flex flex-col gap-1">
            {collaborators.map((collab) => (
              <CollaboratorRow
                key={collab.id}
                collab={collab}
                canRemove={isOwner}
                onRemove={() => handleRemove(collab)}
              />
            ))}
          </ul>
        )}

        {collaborators.length === 0 && !isOwner && (
          <p className="text-sm text-copy-faint text-center py-2">No collaborators yet.</p>
        )}

        <div className="pt-1 border-t border-surface-border">
          <Button variant="outline" className="w-full gap-2" onClick={handleCopyLink}>
            <Link2 className="h-4 w-4" />
            {copied ? "Copied!" : "Copy project link"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface CollaboratorRowProps {
  collab: CollaboratorProfile
  canRemove: boolean
  onRemove: () => void
}

function CollaboratorRow({ collab, canRemove, onRemove }: CollaboratorRowProps) {
  return (
    <li className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-elevated">
      <Avatar name={collab.name} email={collab.email} imageUrl={collab.imageUrl} />
      <div className="flex flex-1 flex-col min-w-0">
        {collab.name && (
          <span className="text-sm text-copy-primary truncate">{collab.name}</span>
        )}
        <span className="text-xs text-copy-muted truncate">{collab.email}</span>
      </div>
      {canRemove && (
        <button
          onClick={onRemove}
          className="shrink-0 p-1 rounded-xl text-copy-muted hover:text-error hover:bg-subtle transition-colors"
          aria-label={`Remove ${collab.email}`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </li>
  )
}

function Avatar({ name, email, imageUrl }: { name: string | null; email: string; imageUrl: string | null }) {
  const initials = name
    ? name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : email[0].toUpperCase()

  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={imageUrl} alt={name ?? email} className="h-7 w-7 rounded-full shrink-0 object-cover" />
    )
  }

  return (
    <div className="h-7 w-7 rounded-full shrink-0 bg-elevated flex items-center justify-center text-xs font-medium text-copy-secondary">
      {initials}
    </div>
  )
}
