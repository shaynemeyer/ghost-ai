import { logger, metadata, schemaTask } from "@trigger.dev/sdk/v3";
import { Liveblocks } from "@liveblocks/node";
import { mutateFlow } from "@liveblocks/react-flow/node";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { designMessageSchema } from "@/types/tasks";
import type { CanvasNode, CanvasEdge } from "@/types/canvas";

const payloadSchema = z.object({
  projectId: z.string().min(1),
  roomId: z.string().min(1),
  chatHistory: z.array(designMessageSchema),
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
    const { projectId, roomId, chatHistory } = payload;

    metadata.set("status", "starting");
    logger.log("Spec generation started", { projectId, roomId });

    const liveblocks = new Liveblocks({ secret: process.env.LIVEBLOCKS_SECRET_KEY! });

    let currentNodes: readonly CanvasNode[] = [];
    let currentEdges: readonly CanvasEdge[] = [];
    await mutateFlow<CanvasNode, CanvasEdge>({ client: liveblocks, roomId }, (flow) => {
      currentNodes = flow.nodes;
      currentEdges = flow.edges;
    });

    logger.log("Canvas state read", { nodeCount: currentNodes.length, edgeCount: currentEdges.length });

    const nodeDescriptions = currentNodes.map((n) => ({
      id: n.id,
      label: n.data?.label ?? n.id,
      shape: n.data?.shape ?? "rectangle",
      x: n.position?.x ?? 0,
      y: n.position?.y ?? 0,
    }));

    const edgeDescriptions = currentEdges.map((e) => ({
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

    // Generate ID before upload so the record is created in a single write
    const specId = crypto.randomUUID();
    const blob = await put(`specs/${projectId}/${specId}.md`, spec, {
      access: "private",
      contentType: "text/markdown",
      addRandomSuffix: false,
      allowOverwrite: false,
    });

    const specRecord = await prisma.projectSpec.create({
      data: { id: specId, projectId, filePath: blob.url },
    });

    metadata.set("status", "completed");
    logger.log("Spec generation completed", { chars: spec.length, specId: specRecord.id });

    return { spec, specId: specRecord.id };
  },
});
