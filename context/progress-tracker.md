# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Phase 1: Foundation

## Current Goal

- Install and configure the design system (shadcn/ui, lucide-react, Tailwind tokens, cn() helper).

## Completed

- Feature 01: Design system — shadcn/ui (base-nova style, Tailwind v4), lucide-react, dark-only CSS tokens in globals.css, cn() helper in lib/utils.ts, components: Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea.

## In Progress

- None.

## Next Up

- Feature 02: Authentication (Clerk) and route protection.

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- Add decisions that affect the system design or data model.

## Session Notes

- shadcn uses "base-nova" style with @base-ui/react (not Radix) — this is the new default for shadcn 4.x. Do not modify components/ui/* files.
- Feature spec 01-design-system.md has a typo: `liv/utils.ts` should be `lib/utils.ts` (correct path, confirmed by shadcn components.json alias).
- Tailwind v4: all token config is CSS-first in globals.css via @theme inline — no tailwind.config.js exists or is needed.
