"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Bot, X, FileText, Download, Send, Loader2, MessageSquare } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useOthers, useCreateFeed, useFeedMessages, useCreateFeedMessage, useSelf } from "@liveblocks/react"
import { useRealtimeRun } from "@trigger.dev/react-hooks"
import { aiStatusMessageSchema, chatMessageSchema, type ChatMessageData } from "@/types/tasks"

interface ProjectSpec {
  id: string
  createdAt: string
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

const STARTER_PROMPTS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
]

const AI_STATUS_FEED = "ai-status-feed"
const AI_CHAT_FEED = "ai-chat"

interface AiSidebarProps {
  isOpen: boolean
  onClose: () => void
  roomId: string
  projectId: string
}

export function AiSidebar({ isOpen, onClose, roomId, projectId }: AiSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [chatInput, setChatInput] = useState("")
  const [chatSendError, setChatSendError] = useState(false)
  const [activeRunId, setActiveRunId] = useState<string | null>(null)
  const [publicToken, setPublicToken] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("architect")
  const [specs, setSpecs] = useState<ProjectSpec[]>([])
  const [specsLoading, setSpecsLoading] = useState(false)
  const [previewSpec, setPreviewSpec] = useState<ProjectSpec | null>(null)
  const [previewContent, setPreviewContent] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const chatTextareaRef = useRef<HTMLTextAreaElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const chatScrollRef = useRef<HTMLDivElement>(null)

  const me = useSelf()
  const others = useOthers()
  const isGenerating = others.some((o) => o.presence.thinking === true)

  const createFeed = useCreateFeed()
  const createFeedMessage = useCreateFeedMessage()
  const { messages: feedMessages } = useFeedMessages(AI_STATUS_FEED)
  const { messages: chatFeedMessages } = useFeedMessages(AI_CHAT_FEED)

  const { run: activeRun } = useRealtimeRun(activeRunId ?? undefined, {
    accessToken: publicToken ?? undefined,
    enabled: !!activeRunId && !!publicToken,
    onComplete: async (run) => {
      const summary = run.status === "COMPLETED"
        ? "Design complete. Check the canvas for updates."
        : "Generation ended."
      await createFeedMessage(AI_CHAT_FEED, {
        sender: "Ghost AI",
        role: "user",
        content: summary,
        timestamp: Date.now(),
      }).catch(() => {})
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: summary },
      ])
      setActiveRunId(null)
      setPublicToken(null)
    },
  })

  const isRunActive = !!activeRunId && !!activeRun &&
    !["COMPLETED", "FAILED", "CANCELED", "CRASHED", "TIMED_OUT", "INTERRUPTED", "SYSTEM_FAILURE"].includes(activeRun.status)

  const latestFeedMessage = (() => {
    if (!feedMessages || feedMessages.length === 0) return null
    const sorted = [...feedMessages].sort((a, b) => b.createdAt - a.createdAt)
    const parsed = aiStatusMessageSchema.safeParse(sorted[0].data)
    return parsed.success ? parsed.data : null
  })()

  const validatedChatMessages: (ChatMessageData & { id: string })[] = (() => {
    if (!chatFeedMessages) return []
    return chatFeedMessages
      .map((msg) => {
        const parsed = chatMessageSchema.safeParse(msg.data)
        if (!parsed.success) return null
        return { ...parsed.data, id: msg.id }
      })
      .filter((m): m is ChatMessageData & { id: string } => m !== null)
  })()

  useEffect(() => {
    createFeed(AI_STATUS_FEED, {}).catch(() => {})
    createFeed(AI_CHAT_FEED, {}).catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchSpecs = useCallback(async () => {
    setSpecsLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/specs`)
      if (!res.ok) return
      const data = await res.json()
      setSpecs(data.specs ?? [])
    } finally {
      setSpecsLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    if (activeTab === "specs") {
      fetchSpecs()
    }
  }, [activeTab, fetchSpecs])

  async function openPreview(spec: ProjectSpec) {
    setPreviewSpec(spec)
    setPreviewContent(null)
    setPreviewLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/specs/${spec.id}/download`)
      if (!res.ok) throw new Error()
      setPreviewContent(await res.text())
    } catch {
      setPreviewContent(null)
    } finally {
      setPreviewLoading(false)
    }
  }

  function downloadSpec(spec: ProjectSpec) {
    const a = document.createElement("a")
    a.href = `/api/projects/${projectId}/specs/${spec.id}/download`
    a.download = `spec-${spec.id}.md`
    a.click()
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [validatedChatMessages.length])

  async function handleSend() {
    const text = input.trim()
    if (!text || isGenerating || isRunActive) return
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: text },
    ])
    setInput("")

    await createFeedMessage(AI_CHAT_FEED, {
      sender: me?.info.name ?? "You",
      role: "user",
      content: text,
      timestamp: Date.now(),
    }).catch(() => {})

    try {
      const designRes = await fetch("/api/ai/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text, roomId, projectId }),
      })
      if (!designRes.ok) throw new Error("Failed to start generation")
      const { runId } = await designRes.json()

      const tokenRes = await fetch("/api/ai/design/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId }),
      })
      if (!tokenRes.ok) throw new Error("Failed to get token")
      const { token } = await tokenRes.json()

      setActiveRunId(runId)
      setPublicToken(token)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to start generation"
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: msg },
      ])
      await createFeedMessage(AI_CHAT_FEED, {
        sender: "Ghost AI",
        role: "user",
        content: msg,
        timestamp: Date.now(),
      }).catch(() => {})
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  async function handleChatSend() {
    const text = chatInput.trim()
    if (!text || !me) return
    setChatSendError(false)
    setChatInput("")
    try {
      await createFeedMessage(AI_CHAT_FEED, {
        sender: me.info.name,
        role: "user",
        content: text,
        timestamp: Date.now(),
      })
    } catch {
      setChatSendError(true)
    }
  }

  function handleChatKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleChatSend()
    }
  }

  function handleStarterChip(prompt: string) {
    if (isGenerating || isRunActive) return
    setInput(prompt)
    textareaRef.current?.focus()
  }

  return (
    <aside
      className={cn(
        "fixed top-12 right-0 bottom-0 z-30 w-80 flex flex-col",
        "bg-base/95 backdrop-blur-md border-l border-surface-border shadow-2xl",
        "transition-transform duration-200 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between px-4 py-3 border-b border-surface-border shrink-0">
        <div className="flex items-center gap-2.5">
          <div className={cn("p-1.5 rounded-lg", isGenerating ? "bg-purple-500/20" : "bg-accent-dim")}>
            {isGenerating ? (
              <Loader2 className="h-4 w-4 text-purple-400 animate-spin" />
            ) : (
              <Bot className="h-4 w-4 text-brand" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-copy-primary leading-tight">AI Workspace</p>
            <p className="text-xs text-copy-muted leading-tight">
              {isGenerating ? "Ghost AI is thinking..." : "Collaborate with Ghost AI"}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-copy-muted hover:text-copy-primary hover:bg-elevated transition-colors"
          aria-label="Close AI sidebar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
        <TabsList
          className="shrink-0 mx-4 mt-3 mb-0 w-auto bg-elevated rounded-lg"
        >
          <TabsTrigger
            value="architect"
            className="flex-1 text-xs data-active:bg-accent-dim data-active:text-brand text-copy-muted"
          >
            AI Architect
          </TabsTrigger>
          <TabsTrigger
            value="chat"
            className="flex-1 text-xs data-active:bg-accent-dim data-active:text-brand text-copy-muted"
          >
            Chat
          </TabsTrigger>
          <TabsTrigger
            value="specs"
            className="flex-1 text-xs data-active:bg-accent-dim data-active:text-brand text-copy-muted"
          >
            Specs
          </TabsTrigger>
        </TabsList>

        {/* AI Architect Tab */}
        <TabsContent value="architect" className="flex flex-col flex-1 min-h-0 mt-0">
          {messages.length === 0 ? (
            <div className="flex flex-col flex-1 items-center justify-center px-4 gap-4 min-h-0">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="p-3 rounded-full bg-accent-dim">
                  <Bot className="h-6 w-6 text-brand" />
                </div>
                <p className="text-sm font-medium text-copy-primary">Ghost AI Architect</p>
                <p className="text-xs text-copy-muted leading-relaxed">
                  Describe your system and I&apos;ll help design the architecture on your canvas.
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full">
                {STARTER_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleStarterChip(prompt)}
                    disabled={isGenerating || isRunActive}
                    className="text-left px-3 py-2 rounded-full text-xs bg-subtle text-brand border border-surface-border hover:bg-elevated transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3 min-h-0"
            >
              {messages.map((msg) =>
                msg.role === "user" ? (
                  <div key={msg.id} className="flex justify-end">
                    <div className="max-w-[85%] px-3 py-2 rounded-xl text-xs bg-brand text-zinc-900 font-medium">
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div key={msg.id} className="flex justify-start">
                    <div className="max-w-[85%] px-3 py-2 rounded-xl text-xs bg-elevated border border-surface-border text-copy-primary">
                      {msg.content}
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {/* Status strip — only shown during active run */}
          {isRunActive && latestFeedMessage?.text && (
            <div className="mx-4 mb-0 px-3 py-1.5 rounded-lg bg-base border border-brand/30 flex items-center gap-2 text-[11px] text-brand">
              <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse shrink-0" />
              {latestFeedMessage.text}
            </div>
          )}

          {/* Input Area */}
          <div className="shrink-0 px-4 pb-4 pt-3 border-t border-surface-border">
            <div className={cn(
              "relative flex flex-col gap-2 rounded-xl bg-elevated border p-2 transition-colors",
              (isGenerating || isRunActive) ? "border-brand/30 opacity-60" : "border-surface-border"
            )}>
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isGenerating || isRunActive}
                placeholder={(isGenerating || isRunActive) ? "AI is generating..." : "Describe your architecture..."}
                className="min-h-18 max-h-40 resize-none border-0 bg-transparent p-1 text-xs text-copy-primary placeholder:text-copy-muted focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none disabled:cursor-not-allowed"
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleSend}
                  disabled={!input.trim() || isGenerating || isRunActive}
                  className="h-7 w-7 p-0 bg-brand text-base hover:bg-brand/90 disabled:opacity-40"
                  aria-label="Send message"
                >
                  {(isGenerating || isRunActive) ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
            <p className="mt-1.5 text-center text-[10px] text-copy-faint">
              Enter to send · Shift+Enter for newline
            </p>
          </div>
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat" className="flex flex-col flex-1 min-h-0 mt-0">
          {validatedChatMessages.length === 0 ? (
            <div className="flex flex-col flex-1 items-center justify-center px-4 gap-2">
              <MessageSquare className="h-6 w-6 text-copy-faint" />
              <p className="text-xs text-copy-muted text-center">
                No messages yet. Say hello to your collaborators.
              </p>
            </div>
          ) : (
            <div
              ref={chatScrollRef}
              className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3 min-h-0"
            >
              {validatedChatMessages.map((msg) => (
                <div key={msg.id} className="flex flex-col gap-0.5">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[10px] font-medium text-copy-primary">{msg.sender}</span>
                    <span className="text-[9px] text-copy-faint">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="px-3 py-2 rounded-xl text-xs bg-elevated border border-surface-border text-copy-primary">
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Chat Input */}
          <div className="shrink-0 px-4 pb-4 pt-3 border-t border-surface-border">
            {chatSendError && (
              <p className="mb-2 text-[10px] text-red-400">Failed to send. Please try again.</p>
            )}
            <div className="relative flex flex-col gap-2 rounded-xl bg-elevated border border-surface-border p-2">
              <Textarea
                ref={chatTextareaRef}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleChatKeyDown}
                placeholder="Message the room..."
                className="min-h-18 max-h-40 resize-none border-0 bg-transparent p-1 text-xs text-copy-primary placeholder:text-copy-muted focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleChatSend}
                  disabled={!chatInput.trim()}
                  className="h-7 w-7 p-0 bg-brand text-base hover:bg-brand/90 disabled:opacity-40"
                  aria-label="Send message"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <p className="mt-1.5 text-center text-[10px] text-copy-faint">
              Enter to send · Shift+Enter for newline
            </p>
          </div>
        </TabsContent>

        {/* Specs Tab */}
        <TabsContent value="specs" className="flex flex-col flex-1 min-h-0 mt-0">
          <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2 min-h-0">
            {specsLoading ? (
              <div className="flex flex-1 items-center justify-center">
                <Loader2 className="h-4 w-4 text-copy-faint animate-spin" />
              </div>
            ) : specs.length === 0 ? (
              <div className="flex flex-col flex-1 items-center justify-center gap-2">
                <FileText className="h-6 w-6 text-copy-faint" />
                <p className="text-xs text-copy-muted text-center">
                  No specs yet. Generate a spec from the AI Architect tab.
                </p>
              </div>
            ) : (
              specs.map((spec) => (
                <button
                  key={spec.id}
                  onClick={() => openPreview(spec)}
                  className="w-full text-left rounded-xl bg-elevated border border-surface-border p-3 flex gap-3 hover:border-brand/40 transition-colors"
                >
                  <div className="shrink-0 p-2 rounded-lg bg-subtle">
                    <FileText className="h-4 w-4 text-brand" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-copy-primary truncate">
                      spec-{spec.id}.md
                    </p>
                    <p className="text-[10px] text-copy-muted mt-0.5">
                      {new Date(spec.createdAt).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); downloadSpec(spec) }}
                    className="shrink-0 p-1.5 rounded-lg text-copy-faint hover:text-copy-primary hover:bg-subtle transition-colors"
                    aria-label="Download spec"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                </button>
              ))
            )}
          </div>
        </TabsContent>

        {/* Spec Preview Modal */}
        <Dialog open={!!previewSpec} onOpenChange={(open) => { if (!open) setPreviewSpec(null) }}>
          <DialogContent className="max-w-2xl bg-elevated border-surface-border text-copy-primary">
            <DialogHeader>
              <DialogTitle className="text-copy-primary text-sm font-semibold">
                {previewSpec ? `spec-${previewSpec.id}.md` : ""}
              </DialogTitle>
            </DialogHeader>
            {previewLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 text-copy-faint animate-spin" />
              </div>
            ) : previewContent === null ? (
              <p className="text-xs text-copy-muted py-8 text-center">Failed to load content.</p>
            ) : (
              <ScrollArea className="max-h-[60vh] pr-2">
                <div className="prose prose-invert prose-sm max-w-none text-copy-primary">
                  <ReactMarkdown>{previewContent}</ReactMarkdown>
                </div>
              </ScrollArea>
            )}
            <div className="flex justify-end pt-2 border-t border-surface-border">
              <Button
                size="sm"
                onClick={() => previewSpec && downloadSpec(previewSpec)}
                className="bg-brand text-base hover:bg-brand/90 text-xs h-8 flex items-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </Tabs>
    </aside>
  )
}
