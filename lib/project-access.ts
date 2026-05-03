import "server-only";
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { Project } from "@/app/generated/prisma/client";

interface CollaboratorProfile {
  email: string;
  name: string | null;
  imageUrl: string | null;
}

export async function enrichCollaborators(emails: string[]): Promise<CollaboratorProfile[]> {
  if (emails.length === 0) return [];

  try {
    const clerk = await clerkClient();
    const { data: users } = await clerk.users.getUserList({ emailAddress: emails });

    const byEmail = new Map(
      users.flatMap((u) =>
        u.emailAddresses.map((e) => [
          e.emailAddress,
          { name: [u.firstName, u.lastName].filter(Boolean).join(" ") || null, imageUrl: u.imageUrl },
        ])
      )
    );

    return emails.map((email) => {
      const profile = byEmail.get(email);
      return { email, name: profile?.name ?? null, imageUrl: profile?.imageUrl ?? null };
    });
  } catch {
    return emails.map((email) => ({ email, name: null, imageUrl: null }));
  }
}

export async function getCurrentIdentity(): Promise<{ userId: string; email: string } | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress ?? "";
  return { userId, email };
}

export async function getProjectWithAccess(
  projectId: string,
  userId: string,
  email: string
): Promise<Project | null> {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return null;

  if (project.ownerId === userId) return project;

  const collaborator = await prisma.projectCollaborator.findUnique({
    where: { projectId_email: { projectId, email } },
  });

  return collaborator ? project : null;
}
