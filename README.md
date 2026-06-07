# Triveni Child Club Portal

The official website & portal for the **Triveni Child Club** — Triveni Barah Nanda Prasad Tripathee School.

> **Phase 2 — Design System Foundation.** This repo currently contains the complete
> design-system foundation (tokens, theme, component library, showcase, homepage
> shell). Feature modules (elections, magazine, activities, CMS, dashboards) are
> intentionally **not** built yet. See [`docs/`](docs/README.md) for the Phase 1
> architecture.

## Stack

- **Next.js 15** (App Router) · **TypeScript** (strict)
- **Tailwind CSS v4** (CSS-first, variable-driven theming)
- **shadcn/ui**-style components, themed to Triveni (no default shadcn colors)
- **Radix UI** primitives + **vaul** (drawer) · **lucide-react** icons
- Fonts via `next/font`: Bricolage Grotesque, Plus Jakarta Sans, Noto Sans Devanagari

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run typecheck  # tsc --noEmit
```

## Project structure

```
src/
├─ app/
│  ├─ layout.tsx              # root: fonts, metadata, <body>
│  ├─ page.tsx                # homepage shell (hero + nav + footer)
│  ├─ not-found.tsx
│  └─ design-system/          # living documentation
│     ├─ layout.tsx           # sidebar shell
│     ├─ page.tsx             # overview
│     ├─ colors/              # palette + semantic tokens + a11y contract
│     ├─ typography/          # fluid type scale + families
│     ├─ components/          # live component gallery
│     ├─ layout/              # spacing / radius / elevation / motion
│     └─ _components/         # showcase helpers (server) + side-nav (client)
├─ components/
│  ├─ ui/                     # Button, Badge, Card, Input, Textarea, Select,
│  │                          # Dialog, Drawer, Tabs, Table, Avatar, Pagination,
│  │                          # Breadcrumb, Label
│  └─ layout/                 # Navbar, Footer
├─ lib/
│  ├─ utils.ts                # cn()
│  └─ fonts.ts                # next/font configuration
└─ styles/
   ├─ tokens.css             # RAW + SEMANTIC + SYSTEM design tokens (CSS vars)
   ├─ theme.css              # Tailwind v4 @theme mapping + keyframes
   └─ globals.css            # entry: tailwind + tokens + theme + base layer
```

## Design system

### Token layers
1. **Raw** — brand palette (`--navy-800`, `--emerald-500`, `--gold-500`, `--slate-200`, …)
2. **Semantic** — meaning-based aliases components use: `--bg`, `--surface`, `--ink`,
   `--soft`, `--primary`, `--accent`, `--line` (+ states like `--primary-hover`,
   `--on-primary`).
3. **System** — spacing (`--sp-1..6`), radius (`sm/md/lg/xl/pill`), elevation
   (`sm/md/lg`), motion (`--ease-out`, durations), fluid typography.

These are mapped to Tailwind utilities in `theme.css` via `@theme inline`, so you
write `bg-primary`, `text-ink`, `p-sp-3`, `rounded-lg`, `shadow-md`,
`text-h1`, `font-display`, `animate-fade-in`, etc.

### Rules
- **Components consume semantic/system tokens — never raw hex.**
- **Accessibility contract:** WCAG AA, visible focus on every control, and
  **never white text on emerald or gold** — the `--on-primary` / `--on-accent`
  tokens are always Navy 800. (Demonstrated on `/design-system/colors`.)
- **Calm motion:** easing `cubic-bezier(.22,1,.36,1)`, durations 0.2/0.45/0.8s,
  and `prefers-reduced-motion` is respected globally.
- **Bilingual-ready:** apply `lang="ne"` or `.font-nepali` for Devanagari text.
- **Future theming:** a dark theme only needs to re-point the semantic layer
  (`[data-theme="dark"]` is already stubbed in `tokens.css`).

### Explore it
Run the app and visit **`/design-system`** for living documentation of colors,
typography, components, and layout systems. The homepage (`/`) verifies the
system in a real page.
