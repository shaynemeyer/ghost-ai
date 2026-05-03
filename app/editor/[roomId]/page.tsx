import { redirect } from "next/navigation"
import { getCurrentIdentity, getProjectWithAccess } from "@/lib/project-access"
import { getOwnedProjects, getSharedProjects } from "@/lib/projects"
import { AccessDenied } from "@/components/editor/access-denied"
import { WorkspaceShell } from "@/components/editor/workspace-shell"

interface Props {
  params: Promise<{ roomId: string }>
}

export default async function WorkspacePage({ params }: Props) {
  const { roomId } = await params

  const identity = await getCurrentIdentity()
  if (!identity) redirect("/sign-in")

  const { userId, email } = identity

  const project = await getProjectWithAccess(roomId, userId, email)
  if (!project) return <AccessDenied />

  const [ownedProjects, sharedProjects] = await Promise.all([
    getOwnedProjects(userId),
    getSharedProjects(email),
  ])

  return (
    <div className="h-screen bg-base">
      <WorkspaceShell
        project={project}
        isOwner={project.ownerId === userId}
        ownedProjects={ownedProjects}
        sharedProjects={sharedProjects}
      />
    </div>
  )
}
