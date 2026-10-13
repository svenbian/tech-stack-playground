# FocusForge 🌿

A calm, encouraging focus app inspired by Opal. Block distracting apps on purpose, take kind
breaks, and watch your focus grow, without guilt.

Built with **Expo SDK 57 · React Native 0.86 · TypeScript · Expo Router · Zustand**.

- 📋 Product and technical plan: [`docs/PLAN.md`](docs/PLAN.md)
- 🔐 How real device blocking works: [`docs/NATIVE_BLOCKING.md`](docs/NATIVE_BLOCKING.md)

## Features

| | |
| --- | --- |
| **Focus sessions** | 25/50/90-minute or custom timers. Wall-clock based, so they survive backgrounding and restarts. |
| **Difficulty** | *Easy* (end anytime) · *Medium* (10 s mindful countdown, 2 breaks) · *Deep Focus* (no breaks, no early end) |
| **Breaks** | 5 or 15 minutes with optional friction. Blocking resumes on its own, and break time never eats focus time. |
| **Block lists** | Whole categories and/or individual apps and sites, plus an **allowlist** of essentials that are never blocked. |
| **Schedules** | Recurring blocks (weekdays, overnight ranges such as 11 pm–7 am), each with its own lists and difficulty. |
| **App limits** | Daily allowances (e.g. Instagram 30 min). When used up, the app rests until midnight. |
| **Mindful block screen** | Breathing animation, a gentle message and a quote instead of the app. |
| **Insights** | Daily Focus Score, week chart, time saved, streaks, top distractions, category breakdown |
| **Gems** | 10 unlockable milestone badges with a celebration on unlock |
| **Polish** | Light and dark themes, haptics, spring-press animations, onboarding, empty states and sample data |

## Getting started

```bash
cd focusforge
npm install
npx expo start          # then press i (iOS simulator), a (Android) or w (web)
```

Everything runs in **Expo Go** and on the **web**, because blocking is simulated. Open
**Today → Try your shield** to tap apps on a pretend phone and see the block screen and limits in action.

| Command | What it does |
| --- | --- |
| `npm test` | Jest unit tests for all business rules (`src/domain`) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (Expo config, React Compiler rules) |
| `npx expo export --platform web` | Static web build in `dist/` |

## Project structure

```
src/
├── app/            Expo Router screens (every file is a route)
│   ├── (tabs)/     Today · Blocks · Insights · Settings
│   ├── session/    new (setup) · active (live timer, breaks, friction)
│   ├── blocklist/[id] · schedule/[id] · limit/[id]   editors (id = "new" to create)
│   ├── blocked.tsx       mindful block screen (shield)
│   ├── simulator.tsx     pretend phone to try blocking
│   ├── allowlist.tsx · onboarding.tsx
│   └── _layout.tsx       hydration gate, onboarding guard, background watchers
├── domain/         Pure TypeScript rules: session, schedule, blocking, stats, gems (+ tests)
├── store/          Zustand store (persisted to AsyncStorage) + memoized selectors
├── services/       BlockingService interface + simulator (native backends go here)
├── components/     Reusable UI: Card, Button, ProgressRing, BreathingCircle, …
├── data/           App catalog, quotes, deterministic sample-data generator
├── hooks/          useNow, useHaptics, useAppWatchers
└── theme/          Colour tokens (light/dark), spacing, type scale
```

### How the pieces fit together
1. **Screens** read state through selectors and call store actions. They contain no business rules.
2. **The store** applies **pure domain transitions** (`startBreak(session, 5, now)` returns a new session).
3. **`useAppWatchers`** (mounted once in the root layout) ticks every second. It completes due sessions,
   ends expired breaks, and pushes the current blocked set to the `BlockingService`.
4. **`getBlockState(appId, ctx, now)`** is the single source of truth for "is this blocked, and why?".
   It merges sessions, schedules and limits.

## Design notes
- **Tone:** "time on other apps", never "wasted time". A score always rewards *some* focus, and
  streaks don't break until the day is actually over.
- **Colour means mode:** sage = Easy, amber = Medium, violet = Deep Focus.
- **Storage:** everything goes through `src/store/storage.ts`, so swapping AsyncStorage for SQLite or a
  sync engine is a one-file change.
