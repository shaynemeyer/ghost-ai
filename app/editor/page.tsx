import { auth, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getOwnedProjects, getSharedProjects } from "@/lib/projects"
import { EditorShell } from "@/components/editor/editor-shell"

export default async function EditorPage() {
  const { userId } = await auth()
  if (!userId) redirect("/")

  const user = await currentUser()
  const email = user?.emailAddresses[0]?.emailAddress ?? ""

  const [ownedProjects, sharedProjects] = await Promise.all([
    getOwnedProjects(userId),
    getSharedProjects(email),
  ])

  return (
    <div className="h-screen bg-base">
      <EditorShell ownedProjects={ownedProjects} sharedProjects={sharedProjects} />
    </div>
  )
}
