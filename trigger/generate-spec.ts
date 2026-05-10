import { logger, metadata } from "@trigger.dev/sdk/v3";
import { schemaTask } from "@trigger.dev/sdk/v3";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const nodeSchema = z.object({
  id: z.string(),
  data: z
    .object({
      label: z.string().optional(),
      shape: z.string().optional(),
    })
    .optional(),
  position: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .optional(),
});

const edgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  data: z.object({ label: z.string().optional() }).optional(),
});

const payloadSchema = z.object({
  projectId: z.string().min(1),
  roomId: z.string().min(1),
  chatHistory: z.array(chatMessageSchema),
  nodes: z.array(nodeSchema),
  edges: z.array(edgeSchema),
});

const SYSTEM_PROMPT = `You are Ghost AI, an expert software architect and technical writer.
Your task is to generate a clear, structured Markdown technical specification from a system design canvas and conversation context.

The specification should include:
- Overview: a brief summary of the system
- Architecture: description of the main components and their responsibilities
- Components: for each node on the canvas, describe its role, technology choices, and key behaviors
- Data Flow: describe how data moves between components
- Key Design Decisions: notable architectural choices inferred from the canvas

Use clear Markdown with headings (##, ###), bullet lists, and code blocks where appropriate.
Keep the output professional and concise. Do not include a title — start directly with the overview section.`;

export const generateSpecTask = schemaTask({
  id: "generate-spec",
  schema: payloadSchema,
  maxDuration: 300,
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
    randomize: true,
  },
  run: async (payload) => {
    const { projectId, roomId, chatHistory, nodes, edges } = payload;

    metadata.set("status", "starting");
    logger.log("Spec generation started", { projectId, roomId, nodeCount: nodes.length, edgeCount: edges.length });

    const nodeDescriptions = nodes.map((n) => ({
      id: n.id,
      label: n.data?.label ?? n.id,
      shape: n.data?.shape ?? "rectangle",
      x: n.position?.x ?? 0,
      y: n.position?.y ?? 0,
    }));

    const edgeDescriptions = edges.map((e) => ({
      from: e.id,
      source: e.source,
      target: e.target,
      label: e.data?.label,
    }));

    const conversationContext =
      chatHistory.length > 0
        ? chatHistory.map((m) => `${m.role === "user" ? "User" : "AI"}: ${m.content}`).join("\n")
        : "No conversation history available.";

    const userPrompt = `Generate a technical specification for the following system design.

Canvas nodes:
${JSON.stringify(nodeDescriptions, null, 2)}

Canvas edges (connections between nodes):
${JSON.stringify(edgeDescriptions, null, 2)}

Conversation context:
${conversationContext}

Generate a Markdown technical specification for this system.`;

    metadata.set("status", "generating");
    logger.log("Calling Gemini for spec generation");

    const result = await generateText({
      model: google("gemini-2.0-flash"),
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
    });

    const spec = result.text;

    metadata.set("status", "saving");
    logger.log("Uploading spec to Vercel Blob");

    const specRecord = await prisma.projectSpec.create({
      data: { projectId, filePath: "" },
    });

    const blob = await put(`specs/${projectId}/${specRecord.id}.md`, spec, {
      access: "private",
      contentType: "text/markdown",
      addRandomSuffix: false,
      allowOverwrite: false,
    });

    await prisma.projectSpec.update({
      where: { id: specRecord.id },
      data: { filePath: blob.url },
    });

    metadata.set("status", "completed");
    logger.log("Spec generation completed", { chars: spec.length, specId: specRecord.id });

    return { spec, specId: specRecord.id };
  },
});
