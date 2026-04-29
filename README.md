# SEO Performance Hub (FinTrack)

## Overview

**Product:** SEO Performance Hub (internally: "Mull Performance Dashboard")
**Company context:** An internal analytics platform built for SEO and SMM departments. Tracks project delivery, revenue targets ($35,000/month), and individual/team productivity across four teams: **Geo Rankers**, **Rank Riser**, **Search Apex**, and **SMM**.
**Developer:** Jahidul Islam
**Tech Stack:** React 18 (Vite) + Flask (Python) + MongoDB + Vercel

### Repository & Architecture
- **GitHub Repository:** `https://github.com/jahidulislamseo/SEO-Performance`
- **Architecture:** 
  - **Frontend:** React-based SPA located in `/frontend`. Uses Vite for fast development and building.
  - **Backend:** Python/Flask API located in `/api`. Handles data processing, Google Sheets integration, and MongoDB storage.
  - **Database:** MongoDB for persistent storage of summaries, member profiles, and attendance.

---

## Project Structure

```bash
├── api/                     # Backend API (Flask)
│   ├── index.py             # Main entry point (Vercel Function)
│   ├── agent_engine.py      # Background logic & Data processing
│   ├── shared_utils.py      # Database & Google Sheets utilities
│   └── requirements.txt     # Python dependencies
├── frontend/                # React Frontend
│   ├── src/                 # Application source code
│   ├── public/              # Static assets
│   ├── package.json         # Node dependencies
│   └── vite.config.js       # Vite configuration
├── scripts/                 # Utility & Management scripts
│   └── legacy/              # Older scripts and archived code
├── vercel.json              # Vercel deployment configuration
└── README.md                # This file
```

---

## Getting Started

### Local Development

1. **Backend (Python):**
   ```bash
   cd api
   pip install -r requirements.txt
   python index.py
   ```
   *Note: Ensure you have a `.env` file in the `api/` directory with `MONGO_URI` and `SHEET_ID`.*

2. **Frontend (React):**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *The frontend will be available at `http://localhost:5173`.*

### Deployment (Vercel)

The project is configured for one-click deployment on Vercel. 
- The frontend is built using `@vercel/static-build`.
- The backend runs as a Serverless Function using `@vercel/python`.
- Environment variables (`MONGO_URI`, `SHEET_ID`) must be configured in the Vercel Dashboard.

---

## CONTENT FUNDAMENTALS
... [Rest of the design system content remains the same] ...

### Voice & Tone
- **Direct and data-forward.** Copy is terse and metric-focused. Numbers come first.
- **Internal tool vibes** — not marketing. No fluff. Speaks directly to team members.
- **First person plural** ("Our target", "Team progress") when referring to department. Second person ("Your delivered amount") for individual stats.
- **Title Case** for headings and nav items. ALL CAPS + letter-spacing for section tags/labels (e.g. "DEPARTMENT OVERVIEW").
- **Emoji are used extensively** throughout the UI as functional visual anchors — not decoration. Examples: 🌍 for geo/location, 📦 for delivery, 🚀 for performance/queries, 👤 for employees, 🏆 for leaderboard, ✅ for delivered, ⏳ for WIP, ❌ for cancelled, 🔄 for revision, 📅 for date, 📊 for data/CSV.
- **Numbers** formatted as currency ($1,234.56) or short-form (1.2k). Always bold in KPI contexts.
- **Status labels:** Delivered, WIP, Revision, Cancelled — always capitalized.
- **Tone:** Professional but energetic. Celebrates wins (confetti animation on goal hit). Urgency around month-end countdown.

### Copy Examples
- "GEO Rankers Department · April 2026" — header subtitle
- "$35,000" — monthly target (always shown as anchor)
- "🏆 Top Performers" — section heading
- "👥 Team Members" — section heading
- "⏳ WIP Pipeline" — pipeline status
- "Live" — with pulsing green dot
- "Target: $1,100/member" — per-member benchmark

---

## VISUAL FOUNDATIONS

### Color System
- **Dark mode is the default.** Light mode is a supported toggle (system preference respected).
- **Background:** `#09111f` — deep dark navy blue. Not pure black.
- **Cards:** `rgba(14, 24, 38, 0.97)` — slightly lighter navy, near-opaque
- **Borders/dividers:** `rgba(148, 163, 184, 0.18)` — very subtle slate tint
- **Accent (primary):** `#2f5d8a` — steel blue. Used for progress fills, active states, logo gradient.
- **Accent 2:** `#5f85a2` — lighter steel blue. Used for hover fills, secondary accents.
- **Green (success/delivered):** `#10b981` — emerald. Progress, live badges, delivered states.
- **Yellow (warning/WIP):** `#f59e0b` — amber. WIP states, CSV button, caution.
- **Red (danger/cancel):** `#ef4444` — red. Cancelled states, close hover.
- **Text primary:** `#f1f5f9` — near-white slate
- **Text muted:** `#94a3b8` — slate-400
- **Text label:** `#cbd5e1` — slate-300

### Backgrounds & Atmosphere
- **Radial gradient glows** (not solid colors): Blue top-left (`rgba(61,111,155,.16)`), teal bottom-right (`rgba(15,118,110,.10)`), amber center (`rgba(194,138,44,.07)`)
- **Subtle grid overlay** at `body::before`: 50×50px grid lines at `rgba(95,133,162,.03)` — nearly invisible but adds texture
- **Glass effect** on header and sticky nav: `backdrop-filter: blur(24px)` with semi-transparent bg
- **Card shine overlay:** `::before` pseudo-element with `linear-gradient(135deg, rgba(47,93,138,.12) ...)` inside cards

### Typography
- **Font:** Manrope (Google Fonts). Weights: 400, 500, 600, 700, 800, 900
- **No serif.** No monospace (except for tabular numbers via `font-variant-numeric: tabular-nums`)
- **Display headings:** 24–32px, weight 900, letter-spacing `-1px`, gradient text clip (white→slate gradient on dark)
- **Section labels:** 10–11px, weight 800, ALL CAPS, letter-spacing `1.8–2px`, `--m2` color
- **Body:** 12–14px, weight 500–600
- **Numbers/KPIs:** 20–28px, weight 900, gradient text or `--green`/`--yellow`

### Spacing & Layout
- Max content width: `1700px`
- Page padding: `32px` horizontal (desktop), `16px` (mobile)
- Card gap: `20px`
- Card border-radius: `18px` (small cards), `22–26px` (large cards/modals)
- Button border-radius: `9–12px` (buttons), `999px` (pills/nav)

### Cards
- Background: `var(--card)` = `rgba(14, 24, 38, 0.97)`
- Border: `1px solid var(--gb)` = `rgba(148,163,184,.18)`
- Border-radius: `18–26px`
- Inner gradient overlay (`::before`)
- No outer shadow on most cards. Modal uses `box-shadow: 0 40px 100px rgba(0,0,0,.65)`
- Cards animate in with `cardIn` (fade + translateY 16px → 0)

### Animations
- **cardIn:** `opacity 0→1, translateY 16px→0` — card entrance
- **mIn:** `scale(.95)→scale(1), translateY(18px)→0` — modal entrance, `cubic-bezier(.4,0,.2,1)`
- **shimmer:** `translateX(-100%)→translateX(200%)` — looping shimmer on progress bars (2.5s linear)
- **pulse:** scale+opacity — pulsing live dot (2s infinite)
- **rspin:** 360deg rotation — loading spinner
- **tIn/tOut:** toast slide in/out (0.3s ease)
- No bounce. Easings: `ease`, `cubic-bezier(.4,0,.2,1)`. Duration: 0.2–1.8s
- Progress bars use `1.8s cubic-bezier(.4,0,.2,1)` for fills

### Hover & Interaction States
- Buttons: background opacity increase (`rgba(...)` alpha +.08–.10), border-color lightens
- Close button: red tint on hover (`rgba(239,68,68,.15)`)
- Nav pills: `color: var(--text)`, border slightly lighter
- No scale transforms on hover (only on press — not explicitly coded but implied)
- Transitions: `all .2s` universal on interactive elements

### Iconography
- **Emoji-first.** No dedicated icon font or SVG icon system.
- Emoji used as functional icons in buttons, labels, section headings, badges
- Unicode arrows: `↻` for refresh, `↗` for external links, `✕` for close

### Borders & Shadows
- Borders: `1px solid rgba(148,163,184,.18)` — always subtle
- Shadows: Only on modals (`0 40px 100px rgba(0,0,0,.65)`) and logo (`0 14px 28px rgba(18,33,54,.35)`)
- No card-level drop shadows — depth from background contrast + border
- Live badge: `box-shadow: 0 0 8px rgba(126,210,199,.7)` — glow on dot only

### Corner Radii Scale
- `6px` — micro (sync button)
- `8px` — small (theme menu item)
- `9–12px` — buttons
- `14px` — theme dropdown
- `18px` — member cards
- `22–26px` — large cards, modals
- `50px` — progress bars, pills

### Progress Bars
- Height: `5px` (month track), `10px` (dept fill)
- Track: `var(--gb)` background
- Fill: `linear-gradient(90deg, #2f5d8a, #5f85a2, #4f8ea6)` — blue gradient
- Shimmer overlay animates continuously
- Rounded ends: `border-radius: 50px`

### Light Mode Overrides
- `--bg: #fdfdfd`, `--card: #ffffff`, `--card2: #f3f4f6`
- `--accent: #0f766e` (teal, not blue in light mode)
- Text darkens: `#111827` primary, `#4b5563` muted
- Gradient text on headings replaced by flat `var(--text)`

---

## ICONOGRAPHY

- **No custom icon font or SVG sprite system exists.** The app uses emoji exclusively as icons.
- Emoji are used consistently as functional shorthand:
  - 🌍 Geographic/SEO scope
  - 📦 Delivery / packages
  - 🚀 Performance / queries
  - 👤 Employee / manager
  - 🏆 Leaderboard / top performers
  - 📊 Data / CSV export
  - 🖨️ PDF / print
  - ✅ Delivered / success
  - ⏳ WIP / in progress
  - ❌ Cancelled / error
  - 🔄 Revision
  - 📅 Date / calendar
  - 🔍 Search
  - ↻ Refresh (unicode, not emoji)
  - ↗ External link (unicode)
- No external icon CDN used. No SVG icon assets.
- **Substitution note:** If a richer icon system is desired, Lucide Icons (`https://unpkg.com/lucide@latest`) matches the stroke weight and clean style of the app's aesthetic.

---

## FILE INDEX

```
README.md                    ← this file
SKILL.md                     ← agent skill descriptor
colors_and_type.css          ← CSS design tokens (colors, type, spacing)
assets/                      ← brand assets (logos if any)
preview/                     ← Design System tab preview cards
  colors-base.html
  colors-semantic.html
  colors-status.html
  type-scale.html
  type-specimens.html
  spacing-tokens.html
  card-anatomy.html
  buttons.html
  badges.html
  progress-bars.html
  nav-elements.html
  member-card.html
  kpi-card.html
  modals.html
ui_kits/
  dashboard/
    README.md
    index.html               ← Main Dashboard UI Kit
    Header.jsx
    MemberCard.jsx
    TeamCard.jsx
    KpiCard.jsx
    DeptOverview.jsx
    Leaderboard.jsx
```
