import "server-only";
import { prisma } from "@/lib/prisma";

export function getOwnedProjects(userId: string) {
  return prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
  });
}

export function getSharedProjects(email: string) {
  return prisma.project.findMany({
    where: { collaborators: { some: { email } } },
    orderBy: { createdAt: "desc" },
  });
}
