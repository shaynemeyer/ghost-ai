import { z } from "zod"

export const aiStatusMessageSchema = z.object({
  text: z.string().optional(),
})

export type AiStatusMessageData = z.infer<typeof aiStatusMessageSchema>
