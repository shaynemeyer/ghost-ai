import { logger, task } from "@trigger.dev/sdk/v3";
import { Liveblocks } from "@liveblocks/node";
import { mutateFlow } from "@liveblocks/react-flow/node";
import { generateText, Output } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { NODE_COLORS, NODE_SHAPES, SHAPE_DEFAULTS } from "@/types/canvas";
import type { CanvasNode, CanvasEdge } from "@/types/canvas";

const AI_AGENT_ID = "ghost-ai-agent";

function getLiveblocksClient(): Liveblocks {
  return new Liveblocks({ secret: process.env.LIVEBLOCKS_SECRET_KEY! });
}

const CanvasActionsSchema = z.object({
  actions: z.array(
    z.discriminatedUnion("action", [
      z.object({
        action: z.literal("add_node"),
        id: z.string(),
        label: z.string(),
        shape: z.enum(NODE_SHAPES),
        colorIndex: z.number().int().min(0).max(7),
        x: z.number(),
        y: z.number(),
      }),
      z.object({
        action: z.literal("move_node"),
        id: z.string(),
        x: z.number(),
        y: z.number(),
      }),
      z.object({
        action: z.literal("resize_node"),
        id: z.string(),
        width: z.number(),
        height: z.number(),
      }),
      z.object({
        action: z.literal("update_node_data"),
        id: z.string(),
        label: z.string().optional(),
        colorIndex: z.number().int().min(0).max(7).optional(),
        shape: z.enum(NODE_SHAPES).optional(),
      }),
      z.object({ action: z.literal("delete_node"), id: z.string() }),
      z.object({
        action: z.literal("add_edge"),
        id: z.string(),
        source: z.string(),
        target: z.string(),
        label: z.string().optional(),
      }),
      z.object({ action: z.literal("delete_edge"), id: z.string() }),
    ])
  ),
  summary: z.string(),
});

const SYSTEM_PROMPT = `You are Ghost AI, an expert software architect.
You help users design system architectures on a collaborative canvas with nodes and edges.

Available node shapes: rectangle, diamond, circle, pill, cylinder, hexagon
Color indices (0-7):
  0: dark (fill #1F1F1F, text #EDEDED) - default/neutral
  1: blue (fill #10233D, text #52A8FF) - frontend/user-facing
  2: purple (fill #2E1938, text #BF7AF0) - AI/ML
  3: orange (fill #331B00, text #FF990A) - queues/async/messaging
  4: red (fill #3C1618, text #FF6166) - security/auth
  5: pink (fill #3A1726, text #F75F8F) - external/third-party
  6: green (fill #0F2E18, text #62C073) - services/backend
  7: teal (fill #062822, text #0AC7B4) - databases/storage

Layout rules:
  - Use coordinate space x: 0-1400, y: 0-900
  - Space nodes at least 200px apart horizontally, 150px vertically
  - Group related services together spatially
  - Left-to-right or top-to-bottom data flow

Shape semantics:
  - cylinder: databases and storage
  - hexagon: microservices and backend services
  - diamond: decision points and gateways
  - pill: APIs and interfaces
  - circle: endpoints and users
  - rectangle: general components and groups

Generate node IDs as: "{shape}-{short-slug}" e.g. "cylinder-postgres", "hexagon-auth-service"`;

export const designAgentTask = task({
  id: "design-agent",
  maxDuration: 300,
  run: async (payload: { prompt: string; roomId: string }) => {
    const { prompt, roomId } = payload;
    const liveblocks = getLiveblocksClient();

    async function broadcastStatus(message: string) {
      await liveblocks.broadcastEvent(roomId, { type: "AI_STATUS", message });
    }

    async function setAIPresence(thinking: boolean) {
      await liveblocks.setPresence(roomId, {
        userId: AI_AGENT_ID,
        data: { cursor: null, thinking },
        userInfo: { name: "Ghost AI", avatar: "", cursorColor: "#A855F7" },
        ttl: thinking ? 3599 : 5,
      });
    }

    try {
      await setAIPresence(true);
      await broadcastStatus("Ghost AI is analyzing your prompt...");
      logger.log("Design agent started", { prompt, roomId });

      // Read current canvas state
      let currentNodes: readonly CanvasNode[] = [];
      let currentEdges: readonly CanvasEdge[] = [];
      await mutateFlow<CanvasNode, CanvasEdge>({ client: liveblocks, roomId }, (flow) => {
        currentNodes = flow.nodes;
        currentEdges = flow.edges;
      });

      await broadcastStatus("Ghost AI is generating your design...");

      const userMessage = `Current canvas:
Nodes: ${JSON.stringify(currentNodes.map((n) => ({ id: n.id, label: n.data?.label, shape: n.data?.shape, x: n.position?.x, y: n.position?.y })))}
Edges: ${JSON.stringify(currentEdges.map((e) => ({ id: e.id, source: e.source, target: e.target, label: e.data?.label })))}

User request: "${prompt}"

Respond with the canvas actions needed to fulfill this request.`;

      const result = await generateText({
        model: google("gemini-2.0-flash"),
        output: Output.object({ schema: CanvasActionsSchema }),
        system: SYSTEM_PROMPT,
        prompt: userMessage,
      });
      const object = result.output;

      await broadcastStatus(`Applying ${object.actions.length} changes...`);
      logger.log("AI actions generated", { count: object.actions.length, summary: object.summary });

      // Apply actions to the canvas
      await mutateFlow<CanvasNode, CanvasEdge>({ client: liveblocks, roomId }, (flow) => {
        for (const action of object.actions) {
          switch (action.action) {
            case "add_node": {
              const color = NODE_COLORS[action.colorIndex] ?? NODE_COLORS[0];
              const defaults = SHAPE_DEFAULTS[action.shape as keyof typeof SHAPE_DEFAULTS];
              flow.addNode({
                id: action.id,
                type: "canvasNode",
                position: { x: action.x, y: action.y },
                width: defaults.width,
                height: defaults.height,
                data: { label: action.label, color, shape: action.shape },
              } as CanvasNode);
              break;
            }
            case "move_node":
              flow.updateNode(action.id, { position: { x: action.x, y: action.y } });
              break;
            case "resize_node":
              flow.updateNode(action.id, { width: action.width, height: action.height });
              break;
            case "update_node_data": {
              const partial: Partial<CanvasNode["data"]> = {};
              if (action.label !== undefined) partial.label = action.label;
              if (action.colorIndex !== undefined) partial.color = NODE_COLORS[action.colorIndex] ?? NODE_COLORS[0];
              if (action.shape !== undefined) partial.shape = action.shape;
              flow.updateNodeData(action.id, partial);
              break;
            }
            case "delete_node":
              flow.removeNode(action.id);
              break;
            case "add_edge":
              flow.addEdge({
                id: action.id,
                source: action.source,
                target: action.target,
                type: "canvasEdge",
                data: action.label ? { label: action.label } : {},
              } as CanvasEdge);
              break;
            case "delete_edge":
              flow.removeEdge(action.id);
              break;
          }
        }
      });

      await broadcastStatus(`Ghost AI: ${object.summary}`);
      logger.log("Design agent completed", { summary: object.summary });
      return { summary: object.summary, actionsCount: object.actions.length };
    } catch (error) {
      await broadcastStatus("Ghost AI encountered an error. Please try again.").catch(() => {});
      logger.error("Design agent failed", { error });
      throw error;
    } finally {
      await setAIPresence(false).catch(() => {});
    }
  },
});
