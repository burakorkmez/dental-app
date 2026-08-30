<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Design system — use it, never re-implement it

`src/components/ui.tsx` + `src/components/icons.tsx` are the single source of
truth for every surface in the dashboard. The tokens come from
`apps/mobile/design/design-system.png` so the dashboard and the patient app read
as one product; the target layout is `apps/web/design/dashboard-design.png`.

1. **Colours and effects live in `globals.css`** as `@theme` tokens
   (`aqua`, `navy`, `muted`, `powder`, `hairline`, …) plus the `card`,
   `card-floating`, `btn-aqua` and `btn-glass` utilities. Don't re-sample hex
   values per page — a second palette is how the app drifts out of sync.
2. **Never write a local button or card.** Use `Card`, `CardTitle`, `StatTile`,
   `StatusPill`, `Chip`, `Field`, `ToggleRow`, `LevelMeter`, `EmptyState`. If a
   page needs a variation, add a prop — don't fork it.
3. Light mode only, 8pt spacing, 16–24px radii, pill-shaped controls.
