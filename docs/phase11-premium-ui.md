# Phase 11 — Premium UI/UX Transformation

Visual-excellence pass. **No business logic changed.** The strategy: transform
the **shared design layer** (tokens → theme → utilities → base components) so
every page across public / portal / admin upgrades coherently from one place,
plus the hero and navbar that define first impressions. Build-verified, ~102 kB
First Load JS (no new runtime dependency — premium motion is performant CSS +
tiny dependency-free client islands).

> Why no Framer Motion: the spec also demands minimal bundle / Lighthouse >95.
> The motion system is delivered with GPU-friendly CSS transforms +
> `IntersectionObserver` reveal/counter hooks, all `prefers-reduced-motion`
> safe. Swapping in Framer Motion later is a drop-in per-component change —
> documented under Roadmap.

---

## Color system ([tokens.css](../src/styles/tokens.css))
Refined premium palette wired entirely through **semantic tokens** (components
never hard-code colors):
- **Primary** emerald `#10B981` · **Secondary** royal blue `#2563EB` (new full
  scale + `--on-secondary` white, AA-safe) · **Accent/Highlight** gold
  (`#F59E0B` base, `#FBBF24` highlight) · **Background** `#F8FAFC` · **Surface**
  white · **Success** `#16A34A/#22C55E` family.
- The a11y rule holds: **navy ink on emerald/gold, white on royal blue/red.**

## Gradient + glass system
- Gradient tokens: `--gradient-brand` (blue→violet), `emerald-cyan`,
  `gold-orange`, `navy-indigo`, and a layered `--gradient-aurora`. Utilities:
  `bg-gradient-brand`, `bg-aurora`, `text-gradient`, `gradient-border`.
- Glass tokens (`--glass-bg/border/blur`) + `.glass` / `.glass-panel`
  utilities — used on the navbar (on scroll), and available for dialogs and
  floating cards. Adapts automatically in dark mode.

## Typography
- **Display** Space Grotesk (added) · **Headings** Bricolage Grotesque ·
  **Body** Plus Jakarta Sans → **Inter** fallback (added) · **Nepali** Noto Sans
  Devanagari. Wired via `next/font` in [fonts.ts](../src/lib/fonts.ts) and the
  `--font-display/heading/body` token chain. Fluid clamp hierarchy unchanged.

## Spacing / radius / shadows ([tokens.css](../src/styles/tokens.css))
- 4/8px-aligned spacing scale (unchanged from Phase 10).
- **Premium radii:** sm 10 · md 16 · cards (`lg`) 20 · dialogs (`xl`) 24 · hero
  (`2xl`) 32 · **buttons 14** (`rounded-button`).
- **Soft layered elevation:** `shadow-sm/md/lg/xl` rebuilt as 2–3 stacked
  low-opacity layers so cards float naturally; added `shadow-glow`.

## Motion system
- Durations retuned to the spec's tiers — `--duration-instant/fast/snappy/base/
  slow` = 150/200/250/300/500ms — and **registered as real `duration-*`
  utilities** (they previously resolved to nothing). Added `--ease-spring`.
- Utilities (all reduced-motion-safe): `animate-fade-in/slide-up/scale-in`,
  `stagger-children`, `hover-lift`, `animate-float(-slow)`, `.skeleton` shimmer,
  `.reveal`/`.reveal-visible`, `.hover-zoom`, `.nav-underline`.
- New primitives: [`<Reveal>`](../src/components/ui/reveal.tsx) (scroll-in via
  IntersectionObserver) and [`<AnimatedCounter>`](../src/components/ui/animated-counter.tsx)
  (counts up on view, parses `120+`/`98%`, instant under reduced-motion).

## Dark mode (premium, persisted)
- Deep-navy (never pure black) dark palette in `[data-theme="dark"]` — lifted
  surfaces for layering, alpha lines, glow-soft shadows, glass re-pointed.
- [`<ThemeToggle>`](../src/components/ui/theme-toggle.tsx) persists to
  `localStorage`; a **pre-paint inline script** in [layout.tsx](../src/app/layout.tsx)
  sets `data-theme` before first paint (no flash), honoring system preference on
  first visit. Smooth color-only transition; `themeColor` meta is per-scheme.

## Components upgraded (propagate everywhere)
- **Button** ([button.tsx](../src/components/ui/button.tsx)): 14px radius, hover
  lift + shadow, new **`secondary`** (royal blue), **`gradient`**, and **`dark`**
  variants, and a **`loading`** prop (spinner + `aria-busy`).
- **Card** ([card.tsx](../src/components/ui/card.tsx)): 20px radius, stronger
  hover-lift, optional **`glass`** and **`gradientBorder`** props.
- **HeroSection** ([hero-section.tsx](../src/components/sections/hero-section.tsx)):
  redesigned with aurora wash, masked grid, floating gradient orbs, slide-up /
  scale-in entrances, glowing 32px-radius framed photo with image-zoom.
- **Navbar** ([navbar.tsx](../src/components/layout/navbar.tsx)): transparent →
  **glass on scroll**, animated link underlines, integrated **theme toggle**
  (desktop + mobile).
- **EmptyState / ErrorState**: consistent illustrated treatment (concentric
  rings + soft gradient halo + icon), secondary action / support-link slots —
  no plain-text empties.
- **Homepage**: animated stat counters in gradient-bordered interactive cards,
  staggered section grids.

## Accessibility & performance held
WCAG-AA contrast preserved by the on-* token rules; every decorative layer is
`aria-hidden`; all motion respects `prefers-reduced-motion`; focus-visible rings
global; theme toggle is keyboard + screen-reader labelled (`aria-pressed`).
First Load JS unchanged (~102 kB) — no animation library added; images stay
`next/image` + lazy.

---

## Roadmap (documented, not faked)
- **Framer Motion** for orchestrated page transitions / shared-layout
  animations (current CSS system covers entrances, hover, reveal, counters).
- **Mega menu, notification bell, profile dropdown, language switch** in the
  public navbar (theme switch shipped; the rest are net-new surfaces).
- **Per-page bespoke section layouts** (alternating magazine/gallery/testimonial
  layouts) and a marketing **sponsors/partners** section — the shared component
  language + utilities are in place to build these without rework.
- **Responsive card-mode for admin tables** and **floating bottom-nav** on
  mobile (carried from Phase 10 roadmap).
- **Glass dialogs everywhere** — `.glass` is ready; applying it to every Radix
  dialog is a mechanical follow-up.

## Verification
`npm run build` — compiled successfully, all routes generated, First Load JS
~102 kB shared. Token/utility changes are pure CSS (cannot regress types); new
client islands (`ThemeToggle`, `Reveal`, `AnimatedCounter`) are typed and SSR-safe.
