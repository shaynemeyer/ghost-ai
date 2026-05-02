export interface Project {
  id: string
  name: string
  slug: string
  ownerId: string
}

export const MOCK_CURRENT_USER_ID = "user_1"

export const MOCK_PROJECTS: Project[] = [
  {
    id: "1",
    name: "E-Commerce Platform",
    slug: "e-commerce-platform",
    ownerId: "user_1",
  },
  {
    id: "2",
    name: "Real-time Chat App",
    slug: "real-time-chat-app",
    ownerId: "user_1",
  },
  {
    id: "3",
    name: "Auth Service",
    slug: "auth-service",
    ownerId: "user_2",
  },
]
