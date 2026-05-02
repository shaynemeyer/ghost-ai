# Code Review — Feature 04: Project Dialogs & Editor Home

Files reviewed: `types/project.ts`, `lib/slug.ts`, `hooks/use-project-dialogs.ts`,
`components/editor/project-dialogs.tsx`, `components/editor/project-sidebar.tsx`,
`components/editor/editor-navbar.tsx`, `components/editor/editor-shell.tsx`,
`app/editor/page.tsx`

---

## Bugs

### 1. Editor home content not truly centered below the navbar

**File:** `components/editor/editor-shell.tsx:21`

```tsx
<main className="flex h-screen items-center justify-center">
```

`h-screen` makes the flex container span the full viewport height including the fixed navbar area (48px). The items-center calculation uses the full `100vh` as its baseline, so the content appears 24px lower than true visual center of the content area. The navbar covers the top of the centering box but is not accounted for.

**Fix:**

```tsx
<main className="flex h-screen items-center justify-center pt-12">
```

`pt-12` shifts the top boundary of the flex box down by the navbar height, making the centering feel correct visually.

**Resolution:** Fixed. `pt-12` added to `<main>` in `editor-shell.tsx`.

---

## Issues

### 2. `"use client"` directive is misplaced on a hook module

**File:** `hooks/use-project-dialogs.ts:1`

`"use client"` is an RSC boundary marker for component modules — it signals to the Next.js bundler that this module and its transitive imports belong in the client bundle. Placing it on a custom hook file is not wrong (it won't break anything), but it's conceptually incorrect: hooks are functions, not components, and the directive's purpose is to split the module graph at a component boundary. The hook will only ever be called from `EditorShell`, which is already `"use client"`, so the directive here is redundant.

Remove it, or accept it as a harmless marker. Either way, this pattern should not spread to other hooks.

**Resolution:** Fixed. `"use client"` removed from `use-project-dialogs.ts`.

### 3. `close()` does not reset form state

**File:** `hooks/use-project-dialogs.ts:35-37`

```ts
function close() {
  setState((s) => ({ ...s, dialog: null }))
}
```

`close()` only nulls out `dialog`. `name` and `selectedProject` are left stale. If a user opens Rename (which pre-fills `name`), dismisses, then opens Create, the Create dialog will open with the previously renamed project's name pre-filled until the user types something.

This is not visible in the current mock-only flow because `openCreate()` always resets state fully. But if `close()` is ever called without going through an `open*()` call first — e.g. from a submit handler that clears the dialog directly — the stale state will surface.

**Fix:**

```ts
function close() {
  setState((s) => ({ ...s, dialog: null, name: "", selectedProject: null }))
}
```

**Resolution:** Fixed. `close()` now resets `name` and `selectedProject` alongside `dialog`.

### 4. `MOCK_CURRENT_USER_ID` is exported but never used

**File:** `types/project.ts:9`

```ts
export const MOCK_CURRENT_USER_ID = "user_1"
```

`role` on the `Project` type already encodes ownership from the perspective of the mock user. `MOCK_CURRENT_USER_ID` is never imported anywhere. Remove it, or delete it when it stays unused after the next feature.

**Resolution:** Fixed as part of issue 6. `role` was removed from `Project` and ownership is now derived by comparing `p.ownerId === currentUserId`. `MOCK_CURRENT_USER_ID` is now the source of truth for that comparison, threaded from `EditorShell` through `EditorNavbar` to `ProjectSidebar`.

### 5. Shared project list items have pointer affordance but no action

**File:** `components/editor/project-sidebar.tsx:99-106`

```tsx
<li className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-2 hover:bg-elevated">
```

Shared project rows show a hover highlight and `cursor-pointer`, which implies they are interactive. They have no click handler. This is deceptive UX — a user will click and nothing will happen. Either remove the pointer affordance until navigation is wired, or add a placeholder `onClick` with a comment marking it as a stub.

**Resolution:** Fixed. `cursor-pointer` and `hover:bg-elevated` removed from shared project `<li>` items. They are now visually inert until navigation is wired.

### 6. `role` field is redundant with `ownerId` — will drift from real data model

**File:** `types/project.ts:1-7`

```ts
interface Project {
  ownerId: string
  role: "owner" | "collaborator"
}
```

In the real data model (Prisma), `role` will be derived by comparing `project.ownerId` to the authenticated user's Clerk ID — it is not a stored field. The mock type stores both. When the API response replaces mock data, `role` will not exist on the server type, and components that read `p.role === "owner"` will break.

Consider computing role at the boundary where mock data is introduced:

```ts
// When replacing mock data, derive role at the data-fetch boundary:
const projects = rawProjects.map((p) => ({
  ...p,
  role: p.ownerId === currentUserId ? "owner" : "collaborator",
}))
```

This keeps the component logic (which correctly branches on `role`) intact while making the derivation explicit.

**Resolution:** Fixed. `role` removed from the `Project` interface and mock data. `ProjectSidebar` now accepts a `currentUserId` prop and derives ownership inline: `p.ownerId === currentUserId` for owned, `p.ownerId !== currentUserId` for shared. `MOCK_CURRENT_USER_ID` is passed as `currentUserId` from `EditorShell`. When real API data arrives, the only change needed is sourcing `currentUserId` from Clerk's `useUser()` hook.

---

## Minor / Style

### 7. Inline anonymous handlers on `onOpenChange`

**File:** `components/editor/project-dialogs.tsx:36, 82, 117`

```tsx
onOpenChange={(open) => { if (!open) dialogs.close() }}
```

The same inline handler appears three times. Extracting it as a named constant at the top of each dialog sub-component or as a shared utility would reduce duplication and improve readability. At this scale it is not harmful.

**Resolution:** Fixed. Each dialog sub-component now declares a named `handleOpenChange` function before the return statement.

### 8. Backdrop has no fade transition on close

**File:** `components/editor/project-sidebar.tsx:31-37`

```tsx
{isOpen && (
  <div className="fixed inset-0 z-49 bg-black/60 md:hidden" ... />
)}
```

The backdrop is conditionally mounted — it appears and disappears instantly while the sidebar has a 200ms `transition-transform`. On close, the scrim snaps off before the sidebar finishes sliding out. This is a minor visual mismatch. Consider using `opacity`/`pointer-events` toggling instead of conditional mounting so the backdrop can fade in sync with the sidebar.

**Resolution:** Fixed. The backdrop now renders unconditionally and toggles between `opacity-100 pointer-events-auto` and `opacity-0 pointer-events-none` with `transition-opacity duration-200`, matching the sidebar's slide timing.

---

## What Is Working Well

- **State model in `useProjectDialogs`**: Using a single state object (`setState({...})`) rather than individual `useState` calls means all dialog transitions are atomic — there is no intermediate state where `dialog === "rename"` but `selectedProject === null`.
- **`toSlug` is correct**: The chain of `.trim()`, `.replace(/[^a-z0-9]+/g, "-")`, and the trim of leading/trailing dashes handles all common edge cases (spaces, special characters, consecutive separators) correctly.
- **Callback prop threading**: `EditorShell` → `EditorNavbar` → `ProjectSidebar` keeps the dialog state ownership at the shell level. Components below it stay stateless with respect to dialogs.
- **`ProjectDialogsHandle` type export**: Typing the dialogs prop via `ReturnType<typeof useProjectDialogs>` avoids a separate interface definition and stays automatically in sync with the hook.
- **Ownership filtering**: `p.ownerId === currentUserId` for rename/delete actions is correctly isolated to `ProjectItem` and entirely absent from the shared tab.
- **TypeScript is clean**: Zero errors, no `any` usage, all props are typed.
