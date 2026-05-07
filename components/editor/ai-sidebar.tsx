"use client"

import { useState, useRef, useEffect } from "react"
import { Bot, X, FileText, Download, Send, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useOthers, useCreateFeed, useFeedMessages } from "@liveblocks/react"
import { aiStatusMessageSchema } from "@/types/tasks"

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

interface AiSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function AiSidebar({ isOpen, onClose }: AiSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const others = useOthers()
  const isGenerating = others.some((o) => o.presence.thinking === true)

  const createFeed = useCreateFeed()
  const { messages: feedMessages } = useFeedMessages(AI_STATUS_FEED)

  const latestFeedMessage = (() => {
    if (!feedMessages || feedMessages.length === 0) return null
    const sorted = [...feedMessages].sort((a, b) => b.createdAt - a.createdAt)
    const parsed = aiStatusMessageSchema.safeParse(sorted[0].data)
    return parsed.success ? parsed.data : null
  })()

  useEffect(() => {
    createFeed(AI_STATUS_FEED, {}).catch(() => {
      // Feed already exists — ignore
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  function handleSend() {
    const text = input.trim()
    if (!text || isGenerating) return
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: text },
    ])
    setInput("")
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleStarterChip(prompt: string) {
    if (isGenerating) return
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

      {/* AI status feed message */}
      {latestFeedMessage?.text && (
        <div className="mx-4 mt-3 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-300">
          {latestFeedMessage.text}
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="architect" className="flex flex-col flex-1 min-h-0">
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
                    disabled={isGenerating}
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
                    <div className="max-w-[85%] px-3 py-2 rounded-xl text-xs bg-accent-dim border-2 border-brand/50 text-copy-primary">
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div key={msg.id} className="flex justify-start">
                    <div className="max-w-[85%] px-3 py-2 rounded-xl text-xs bg-elevated border border-surface-border text-brand">
                      {msg.content}
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {/* Input Area */}
          <div className="shrink-0 px-4 pb-4 pt-3 border-t border-surface-border">
            <div className={cn(
              "relative flex flex-col gap-2 rounded-xl bg-elevated border p-2 transition-colors",
              isGenerating ? "border-purple-500/30 opacity-60" : "border-surface-border"
            )}>
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isGenerating}
                placeholder={isGenerating ? "AI is generating..." : "Describe your architecture..."}
                className="min-h-18 max-h-40 resize-none border-0 bg-transparent p-1 text-xs text-copy-primary placeholder:text-copy-muted focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none disabled:cursor-not-allowed"
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleSend}
                  disabled={!input.trim() || isGenerating}
                  className="h-7 w-7 p-0 bg-brand text-base hover:bg-brand/90 disabled:opacity-40"
                  aria-label="Send message"
                >
                  {isGenerating ? (
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

        {/* Specs Tab */}
        <TabsContent value="specs" className="flex flex-col flex-1 min-h-0 mt-0 px-4 py-3">
          <div className="flex justify-end mb-3">
            <Button size="sm" className="bg-brand text-base hover:bg-brand/90 text-xs h-8">
              Generate Spec
            </Button>
          </div>

          {/* Demo spec card */}
          <div className="rounded-xl bg-elevated border border-surface-border p-3 flex gap-3">
            <div className="shrink-0 p-2 rounded-lg bg-subtle">
              <FileText className="h-4 w-4 text-brand" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-copy-primary truncate">Microservices Architecture</p>
              <p className="text-[11px] text-copy-muted mt-0.5 line-clamp-2">
                API Gateway → Auth, Product, Order, Payment services with event bus and shared database.
              </p>
              <button
                disabled
                className="mt-2 flex items-center gap-1 text-[10px] text-copy-faint cursor-not-allowed opacity-50"
              >
                <Download className="h-3 w-3" />
                Download
              </button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </aside>
  )
}
