import { z } from "zod"

export const aiStatusMessageSchema = z.object({
  text: z.string().optional(),
})

export type AiStatusMessageData = z.infer<typeof aiStatusMessageSchema>

export const designMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
})

export type DesignMessageData = z.infer<typeof designMessageSchema>

export const chatMessageSchema = z.object({
  sender: z.string(),
  role: z.literal("user"),
  content: z.string(),
  timestamp: z.number(),
})

export type ChatMessageData = z.infer<typeof chatMessageSchema>
