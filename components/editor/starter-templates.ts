import { MarkerType } from "@xyflow/react";
import { NODE_COLORS, SHAPE_DEFAULTS, type CanvasNode, type CanvasEdge } from "@/types/canvas";

export interface CanvasTemplate {
  id: string;
  name: string;
  description: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

const MARKER_END = { type: MarkerType.ArrowClosed, width: 12, height: 12 };

function node(
  id: string,
  label: string,
  shape: CanvasNode["data"]["shape"],
  colorIndex: number,
  x: number,
  y: number
): CanvasNode {
  const { width, height } = SHAPE_DEFAULTS[shape];
  return {
    id,
    type: "canvasNode",
    position: { x, y },
    data: { label, color: NODE_COLORS[colorIndex], shape },
    width,
    height,
  };
}

function edge(id: string, source: string, target: string): CanvasEdge {
  return {
    id,
    source,
    target,
    type: "canvasEdge",
    data: {},
    markerEnd: MARKER_END,
  };
}

const microservices: CanvasTemplate = {
  id: "microservices",
  name: "Microservices",
  description: "API gateway routing to three backend services with a shared database.",
  nodes: [
    node("ms-gateway",  "API Gateway",       "pill",      1, 150, 0),
    node("ms-auth",     "Auth Service",      "rectangle", 2, 0,   130),
    node("ms-orders",   "Order Service",     "rectangle", 6, 180, 130),
    node("ms-payments", "Payment Service",   "rectangle", 3, 360, 130),
    node("ms-db",       "Database",          "cylinder",  7, 195, 260),
  ],
  edges: [
    edge("e-ms-1", "ms-gateway",  "ms-auth"),
    edge("e-ms-2", "ms-gateway",  "ms-orders"),
    edge("e-ms-3", "ms-gateway",  "ms-payments"),
    edge("e-ms-4", "ms-orders",   "ms-db"),
  ],
};

const cicdPipeline: CanvasTemplate = {
  id: "cicd-pipeline",
  name: "CI/CD Pipeline",
  description: "Linear pipeline from source through build, test, deploy, and monitor stages.",
  nodes: [
    node("cicd-source",  "Source",  "pill", 1, 0,   50),
    node("cicd-build",   "Build",   "pill", 3, 160, 50),
    node("cicd-test",    "Test",    "pill", 4, 320, 50),
    node("cicd-deploy",  "Deploy",  "pill", 6, 480, 50),
    node("cicd-monitor", "Monitor", "pill", 7, 640, 50),
  ],
  edges: [
    edge("e-cicd-1", "cicd-source",  "cicd-build"),
    edge("e-cicd-2", "cicd-build",   "cicd-test"),
    edge("e-cicd-3", "cicd-test",    "cicd-deploy"),
    edge("e-cicd-4", "cicd-deploy",  "cicd-monitor"),
  ],
};

const eventDriven: CanvasTemplate = {
  id: "event-driven",
  name: "Event-Driven System",
  description: "Producer emits to an event bus, consumed by multiple independent services.",
  nodes: [
    node("ed-producer",   "Producer",    "rectangle", 3, 0,   65),
    node("ed-bus",        "Event Bus",   "hexagon",   1, 200, 50),
    node("ed-consumer-a", "Consumer A",  "rectangle", 6, 380, 10),
    node("ed-consumer-b", "Consumer B",  "rectangle", 2, 380, 120),
  ],
  edges: [
    edge("e-ed-1", "ed-producer",   "ed-bus"),
    edge("e-ed-2", "ed-bus",        "ed-consumer-a"),
    edge("e-ed-3", "ed-bus",        "ed-consumer-b"),
  ],
};

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  microservices,
  cicdPipeline,
  eventDriven,
];
