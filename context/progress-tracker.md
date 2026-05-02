# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Phase 1: Foundation

## Current Goal

- Feature 05: Prisma data models (complete)

## Completed

- Feature 01: Design system — shadcn/ui (base-nova style, Tailwind v4), lucide-react, dark-only CSS tokens in globals.css, cn() helper in lib/utils.ts, components: Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea.
- Feature 02: Editor chrome — EditorNavbar (fixed top bar with sidebar toggle), ProjectSidebar (floating overlay, slides from left, Tabs with empty states, New Project button).
- Feature 03: Authentication (Clerk) — ClerkProvider with dark theme in root layout, proxy.ts at project root (protected-first, Next.js 16 convention), sign-in and sign-up pages with two-panel layout (large) / form-only (small), / redirects authenticated→/editor and renders SignIn with routing="hash" for unauthenticated users, UserButton in EditorNavbar right section.
- Feature 04: Project dialogs and editor home — EditorShell client wrapper, editor home screen with New Project button, useProjectDialogs hook (dialog/form/loading state), Create/Rename/Delete dialogs with live slug preview, sidebar project items with rename/delete actions (owner-only), mobile backdrop scrim. Mock data only in types/project.ts.
- Feature 05: Prisma data models — prisma/models/project.prisma with Project (ownerId, name, description, status enum DRAFT/ARCHIVED, canvasJsonPath, timestamps, indexes on ownerId and createdAt) and ProjectCollaborator (projectId cascade, email, createdAt, unique project/email, indexes on email and projectId/createdAt). Migration applied (20260502162854_init). lib/prisma.ts singleton with PrismaPg adapter, branches on DATABASE_URL prefix (prisma+postgres:// vs direct), cached on globalThis in development. Client generated to app/generated/prisma/.

## In Progress

- None.

## Next Up

- Feature 06: TBD

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- Add decisions that affect the system design or data model.

## Session Notes

- Prisma v7 multi-file schema: generator output is `app/generated/prisma/`, import PrismaClient from `@/app/generated/prisma/client` (no index.ts — must use /client suffix).
- PrismaPg (from @prisma/adapter-pg) accepts a connection string directly; used as the factory passed to `new PrismaClient({ adapter })`.
- For prisma+postgres:// URLs, PrismaPg accepts the string but pg library won't connect at runtime without @prisma/extension-accelerate — install that package and extend the client in the Accelerate branch when Prisma Postgres is used.

- shadcn uses "base-nova" style with @base-ui/react (not Radix) — this is the new default for shadcn 4.x. Do not modify components/ui/* files.
- Feature spec 01-design-system.md has a typo: `liv/utils.ts` should be `lib/utils.ts` (correct path, confirmed by shadcn components.json alias).
- Tailwind v4: all token config is CSS-first in globals.css via @theme inline — no tailwind.config.js exists or is needed.
- Next.js 16 renamed middleware.ts → proxy.ts. The Clerk clerkMiddleware export goes in proxy.ts at the project root.
- Clerk appearance variables use colorForeground (not colorText), colorInput (not colorInputBackground), colorInputForeground (not colorInputText). @clerk/ui/themes provides the dark theme for current SDK (v7+).
- CORS error on sign-out when SignIn is rendered at "/": Clerk's useEnforceCatchAllRoute hook (dev-only) builds a probe URL as `${origin}${pathname}/${component}_clerk_catchall_check_...`. At pathname "/" this produces a double-slash ("//...") which the browser treats as a protocol-relative URL. Clerk middleware redirects it to the hosted accounts domain, which CORS-blocks the response. Fix: pass routing="hash" to the SignIn component when it is rendered outside its canonical catch-all route. The hook returns early for any routing value other than "path". Note: "virtual" exists in @clerk/shared RoutingStrategy but is not in the SignIn component prop union — "hash" is the correct prop value to use.
