"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { type Project } from "@/types/project"
import { toSlug } from "@/lib/slug"

type DialogType = "create" | "rename" | "delete" | null

interface State {
  dialog: DialogType
  selectedProject: Project | null
  name: string
  loading: boolean
  roomIdSuffix: string
}

function shortSuffix(): string {
  return Math.random().toString(36).slice(2, 8)
}

export function useProjectActions() {
  const router = useRouter()
  const pathname = usePathname()

  const [state, setState] = useState<State>({
    dialog: null,
    selectedProject: null,
    name: "",
    loading: false,
    roomIdSuffix: shortSuffix(),
  })

  const roomId = state.name.trim() ? `${toSlug(state.name)}-${state.roomIdSuffix}` : ""

  function openCreate() {
    setState({ dialog: "create", selectedProject: null, name: "", loading: false, roomIdSuffix: shortSuffix() })
  }

  function openRename(project: Project) {
    setState((s) => ({ ...s, dialog: "rename", selectedProject: project, name: project.name, loading: false }))
  }

  function openDelete(project: Project) {
    setState((s) => ({ ...s, dialog: "delete", selectedProject: project, name: "", loading: false }))
  }

  function close() {
    setState((s) => ({ ...s, dialog: null, name: "", selectedProject: null, loading: false }))
  }

  function setName(name: string) {
    setState((s) => ({ ...s, name }))
  }

  async function submitCreate() {
    if (!state.name.trim()) return
    setState((s) => ({ ...s, loading: true }))
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: state.name.trim() }),
      })
      if (!res.ok) { setState((s) => ({ ...s, loading: false })); return }
      const { id } = await res.json() as { id: string }
      close()
      router.push(`/editor/${id}`)
    } catch {
      setState((s) => ({ ...s, loading: false }))
    }
  }

  async function submitRename() {
    if (!state.selectedProject || !state.name.trim()) return
    setState((s) => ({ ...s, loading: true }))
    try {
      const res = await fetch(`/api/projects/${state.selectedProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: state.name.trim() }),
      })
      if (!res.ok) { setState((s) => ({ ...s, loading: false })); return }
      close()
      router.refresh()
    } catch {
      setState((s) => ({ ...s, loading: false }))
    }
  }

  async function submitDelete() {
    if (!state.selectedProject) return
    setState((s) => ({ ...s, loading: true }))
    try {
      const res = await fetch(`/api/projects/${state.selectedProject.id}`, {
        method: "DELETE",
      })
      if (!res.ok) { setState((s) => ({ ...s, loading: false })); return }
      const isActive = pathname === `/editor/${state.selectedProject.id}`
      close()
      if (isActive) {
        router.push("/editor")
      } else {
        router.refresh()
      }
    } catch {
      setState((s) => ({ ...s, loading: false }))
    }
  }

  return {
    ...state,
    roomId,
    openCreate,
    openRename,
    openDelete,
    close,
    setName,
    submitCreate,
    submitRename,
    submitDelete,
  }
}

export type ProjectActionsHandle = ReturnType<typeof useProjectActions>
