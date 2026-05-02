import { useState } from "react"
import { type Project } from "@/types/project"

type DialogType = "create" | "rename" | "delete" | null

interface DialogState {
  dialog: DialogType
  selectedProject: Project | null
  name: string
  loading: boolean
}

export function useProjectDialogs() {
  const [state, setState] = useState<DialogState>({
    dialog: null,
    selectedProject: null,
    name: "",
    loading: false,
  })

  function openCreate() {
    setState({ dialog: "create", selectedProject: null, name: "", loading: false })
  }

  function openRename(project: Project) {
    setState({ dialog: "rename", selectedProject: project, name: project.name, loading: false })
  }

  function openDelete(project: Project) {
    setState({ dialog: "delete", selectedProject: project, name: "", loading: false })
  }

  function close() {
    setState((s) => ({ ...s, dialog: null, name: "", selectedProject: null }))
  }

  function setName(name: string) {
    setState((s) => ({ ...s, name }))
  }

  return {
    ...state,
    openCreate,
    openRename,
    openDelete,
    close,
    setName,
  }
}

export type ProjectDialogsHandle = ReturnType<typeof useProjectDialogs>
