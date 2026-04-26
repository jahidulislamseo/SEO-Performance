# Dashboard UI Kit

**Surface:** Main SEO Performance Dashboard (`/`)
**Design width:** 1440px
**Theme:** Dark-first (Manrope, navy base, steel-blue accent)

## Components
- `Header.jsx` — Sticky top bar: logo, title, subtitle, theme toggle, live badge, action buttons, clock
- `DeptOverview.jsx` — Department card: heading, progress bar, ring chart, KPI sub-stats
- `KpiCard.jsx` — Single KPI metric card (value, label, trend)
- `TeamCard.jsx` — Team summary card (team name, members, progress)
- `MemberCard.jsx` — Individual member stat card: avatar, rank, progress, delivered/wip/cancel stats
- `Leaderboard.jsx` — Full ranking table with rank change, team, stats, progress bar
- `PageNav.jsx` — Sticky section nav with pill buttons

## Screens
1. **Main Dashboard** — full overview with dept card, KPI strip, top performers, team grid, member cards
2. **Member Detail Modal** — project list per member, tabs by status

## Usage
```jsx
// index.html loads React + Babel, imports all component .jsx files
// Components are assigned to window.* for cross-file access
```
