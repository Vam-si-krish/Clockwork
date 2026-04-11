# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Vite, localhost:5173)
npm run build     # Production build
npm run preview   # Preview production build locally
```

No test runner or linter is configured.

## Architecture

**Clockwork** is a freelance time-tracking app built with React 18 + Vite. There is no backend — all data lives in `localStorage` via Zustand's `persist` middleware.

### State (Zustand stores)

| Store | `localStorage` key | Purpose |
|---|---|---|
| `useCompanyStore` | `freelance-companies` | Companies with `name`, `hourlyRate`, `color` |
| `useShiftStore` | `freelance-shifts` | Logged shifts with `companyId`, `date`, `startTime`, `endTime`, `hours`, `pay`, `paid` |
| `useTimerStore` | `clockwork-timer` | Live timer state: `isRunning`, `startTime` (ISO string), `companyId` |
| `useTodoStore` | `freelance-todos` | Simple todos unrelated to shifts |

Shifts store a denormalized `hourlyRate` snapshot at log time so pay is stable even if the company rate changes later.

### Data flow

- `src/utils/calculations.js` — all pure functions: `calcHours(startTime, endTime)` (handles overnight), `calcPay`, `totalEarnings`, `shiftsThisWeek/Month` (via date-fns), `groupByCompany`, `formatCurrency`.
- Pages call store hooks directly; no context or prop drilling.
- The `TimerWidget` (Dashboard) reads `useTimerStore` + `useCompanyStore` and writes to `useShiftStore` on stop.

### Routing

React Router v6 with a single `<Layout>` shell (`src/components/Layout.jsx`) wrapping all routes via `<Outlet>`. Routes: `/` Dashboard, `/shifts`, `/calendar`, `/companies`, `/todos`, `/reports`.

### Styling

Tailwind CSS with a custom `brand` color palette (sky-blue, defined in `tailwind.config.js`). Company colors are arbitrary hex values stored in the store and applied inline via `style={{ backgroundColor: c.color }}`.
