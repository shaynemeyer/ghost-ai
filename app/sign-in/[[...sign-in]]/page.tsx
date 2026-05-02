import { SignIn } from "@clerk/nextjs"
import { BrainCircuit, Share2, FileCode2 } from "lucide-react"

const features = [
  {
    icon: BrainCircuit,
    title: "AI Architecture Generation",
    description:
      "Describe your system, AI maps it to nodes and edges on a live canvas.",
  },
  {
    icon: Share2,
    title: "Real-time Collaboration",
    description:
      "Live cursors, presence indicators, and shared node editing across your team.",
  },
  {
    icon: FileCode2,
    title: "Instant Spec Generation",
    description:
      "Export a complete Markdown technical spec directly from the canvas graph.",
  },
]

export default function SignInPage() {
  return (
    <div className="flex min-h-screen font-sans">
      <div className="hidden lg:flex w-1/2 flex-col bg-surface border-r border-surface-border p-12">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-brand shrink-0" />
          <span className="font-semibold text-copy-primary tracking-tight">
            Ghost AI
          </span>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <h1 className="text-5xl font-bold text-copy-primary leading-tight tracking-tight mb-5">
            Design systems at the speed of thought.
          </h1>
          <p className="text-copy-secondary leading-relaxed mb-12">
            Describe your architecture in plain English. Ghost AI maps it to a
            shared canvas your whole team can refine in real time.
          </p>

          <div className="space-y-6">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl border border-surface-border flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-brand" />
                </div>
                <div>
                  <p className="font-medium text-copy-primary text-sm">{title}</p>
                  <p className="text-copy-muted text-sm mt-0.5">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-copy-faint text-sm">
          © 2026 Ghost AI. All rights reserved.
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center bg-base min-h-screen p-8">
        <SignIn />
      </div>
    </div>
  )
}
