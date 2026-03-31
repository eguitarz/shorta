# Design System — Shorta

## Product Context
- **What this is:** AI-powered YouTube video analysis tool. Analyzes video frames, scoring, and content to help creators improve.
- **Who it's for:** YouTube creators who publish regularly and want to understand why some videos perform better.
- **Space:** YouTube analytics tools (VidIQ, TubeBuddy, OutlierKit). Differentiator: visual frame analysis via Gemini.
- **Project type:** Web app (dashboard + analysis results). Data-dense, professional, not corporate.

## Aesthetic Direction
- **Direction:** Industrial/Utilitarian. Function-first, data-dense, minimal chrome.
- **Decoration level:** Minimal. Typography and color do the work, not decoration.
- **Mood:** Like a professional studio monitor. Precise, calm, trustworthy. The product earns trust by showing data clearly, not by looking flashy.

## Typography
- **Display/Hero:** Space Grotesk (`@fontsource/space-grotesk`, installed) — geometric, technical feel. Use for page titles and hero headings.
- **Body:** System font stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`) — fast loading, familiar, high readability.
- **UI/Labels:** Same as body, uppercase tracking-wider at `text-[10px]` for category labels.
- **Data/Tables:** System monospace for timestamps and scores. Body font with `tabular-nums` for numeric data.
- **Code:** System monospace (`ui-monospace, SFMono-Regular, monospace`).
- **Scale:**
  - `text-[9px]` — micro labels (impact badges, timestamps on thumbnails)
  - `text-[10px]` — category labels, tooltips, metric labels
  - `text-[11px]` — secondary info, fallback notes
  - `text-xs` (12px) — body text, metric values, analysis text
  - `text-sm` (14px) — card titles, change descriptions
  - `text-base` (16px) — section headings
  - `text-lg` (18px) — page title
  - `text-2xl` (24px) — letter grades (A, B, C...)

## Color

### Surfaces (dark theme only)
| Token | Hex | Usage |
|-------|-----|-------|
| `bg-page` | `#0a0a0a` | Page background |
| `bg-surface` | `#1a1a1a` | Cards, panels, accordions |
| `bg-surface-hover` | `#252525` | Hover state on surfaces |
| `bg-elevated` | `#141414` | Elevated panels, modals |
| `bg-inset` | `#111111` | Inset areas, code blocks |

### Text
| Token | Tailwind | Usage |
|-------|----------|-------|
| `text-primary` | `text-white` | Headings, values, key data |
| `text-secondary` | `text-gray-200` / `text-gray-300` | Body text, descriptions |
| `text-muted` | `text-gray-400` | Most common — labels, analysis text |
| `text-subtle` | `text-gray-500` | Secondary labels, tooltips, hints |
| `text-faint` | `text-gray-600` | Timestamps, dividers, disabled |

### Borders
| Token | Tailwind | Usage |
|-------|----------|-------|
| `border-default` | `border-gray-800` | Card borders, dividers (primary) |
| `border-hover` | `border-gray-700` | Hover state on interactive cards |
| `border-strong` | `border-gray-600` | Focus states, active borders |

### Semantic Colors (score categories)
These are the product's signature colors. Each scoring category has its own color:

| Category | 500 (badges) | 400 (text/values) | /10 bg | Usage |
|----------|-------------|-------------------|--------|-------|
| Hook | `orange-500` | `orange-400` | `orange-500/10` | Hook scoring, category pills |
| Structure | `blue-500` | `blue-400` | `blue-500/10` | Structure scoring, accent actions |
| Clarity | `green-500` | `green-400` | `green-500/10` | Clarity scoring, success states |
| Delivery | `purple-500` | `purple-400` | `purple-500/10` | Delivery scoring |

### Status Colors
| Status | Badge | Text | Background |
|--------|-------|------|------------|
| Critical | `red-500` | `red-400` | `red-500/10` |
| Moderate | `orange-500` | `orange-400` | `orange-500/10` |
| Minor | `blue-500` | `blue-400` | `blue-500/10` |
| Success | `green-500` | `green-400` | `green-500/10` |

### Grade Colors
| Grade | Color |
|-------|-------|
| S | `purple-500` |
| A | `green-500` |
| B | `blue-500` |
| C | `yellow-500` |
| D | `orange-500` |
| F | `red-500` |

## Spacing
- **Base unit:** 4px (Tailwind default)
- **Density:** Compact. This is a data-dense app. Tight spacing is intentional.
- **Scale:** `p-0.5`(2) `p-1`(4) `p-1.5`(6) `p-2`(8) `p-3`(12) `p-4`(16) `p-5`(20) `p-6`(24)
- **Card padding:** `p-3` (12px) for metric cards, `p-4` (16px) for larger sections
- **Gap between cards:** `gap-2` (8px) for accordion stacks, `gap-3` (12px) for card grids
- **Section spacing:** `mb-4` to `mb-8` between major sections

## Layout
- **Approach:** Grid-disciplined. Consistent alignment, predictable structure.
- **Max content width:** Full width with sidebar (no max-width container on results page)
- **Grid:** Results page uses sidebar layout. Content area + collapsible right panel.
- **Mobile:** Stack everything. Sidebar moves below content. Fix List cards go single-column.
- **Breakpoints:** `md` (768px) for grid changes (Fix List 1-col → 3-col), sidebar collapse.

## Border Radius
| Level | Value | Usage |
|-------|-------|-------|
| `sm` | `rounded` (4px) | Small badges, pills, tooltips |
| `md` | `rounded-md` (6px) | Buttons, form inputs |
| `lg` | `rounded-lg` (8px) | Inner cards, accordions |
| `xl` | `rounded-xl` (12px) | Primary cards, panels (most common) |
| `full` | `rounded-full` | Avatars, number badges, circular buttons |

## Motion
- **Approach:** Minimal-functional. Motion aids comprehension, nothing decorative.
- **Accordion open/close:** 200ms ease-out
- **Sidebar collapse/expand:** 100ms (fast, per existing implementation)
- **Hover transitions:** `transition-colors` (150ms default)
- **Scroll-to-beat highlight:** 1000ms yellow flash then fade
- **No entrance animations.** Content appears immediately. Users are here for data, not spectacle.

## Icons
- **Library:** Lucide React
- **Sizes:** `w-3 h-3` (12px) for inline, `w-3.5 h-3.5` (14px) for card headers, `w-4 h-4` (16px) for buttons
- **Color:** `text-gray-500` default, semantic colors for status

## Components (existing patterns)

### Card
```
bg-[#1a1a1a] border border-gray-800 rounded-xl p-3
hover: border-gray-700 (if interactive)
```

### Category Pill
```
px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide
bg-{color}-500/10 text-{color}-400
```

### Score Accordion (ScoreAccordion.tsx)
```
bg-[#1a1a1a] border border-gray-800 rounded-xl
Header: p-3, flex items-center gap-2
Expanded content: px-3 pb-3
```

### Fix List Card (FixList.tsx)
```
bg-gray-900/50 border border-gray-800 rounded-lg p-3
Number badge: w-6 h-6 bg-blue-600 text-white rounded-full
Interactive: cursor-pointer hover:border-gray-700
```

### Blur for Anonymous Users
```
blur-sm cursor-pointer select-none
onClick → open upgrade modal
```

### Metric Row (with tooltip)
```
flex justify-between items-center
Label: text-gray-500 cursor-help group relative
Tooltip: absolute bg-gray-900 border border-gray-700 rounded text-[10px] text-gray-300
Value: font-semibold text-{status-color}-400
```

## Anti-Patterns (do not use)
- Purple/violet gradients as backgrounds
- Centered everything with uniform spacing
- 3-column feature grids with icon circles
- Decorative blobs, wavy SVG dividers
- Generic hero sections with stock-photo feel
- `!important` overrides
- Inline styles (use Tailwind classes)

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-01 | Initial design system created | Codified from existing codebase patterns by /design-consultation |
| 2026-04-01 | Dark theme only (no light mode) | Product is data-dense analysis tool. Dark theme reduces eye strain for extended use. |
| 2026-04-01 | System fonts for body, Space Grotesk for display | System fonts for performance. Space Grotesk installed but unused — recommended for hero text. |
| 2026-04-01 | Category colors: orange/blue/green/purple | Matches existing scoring system (hook/structure/clarity/delivery). Established in codebase. |
