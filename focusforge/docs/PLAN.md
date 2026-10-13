# FocusForge — Product & Technical Plan

> A calm, encouraging focus companion. Block distractions on purpose, take kind breaks,
> and watch your focus grow — without guilt.

## 1. Name

**FocusForge** works and is what the code uses. It's simple to rename later (`app.json` → `name`, `slug`, `scheme`).

If you'd like something calmer, here are some options:

| Name | Why it fits |
| --- | --- |
| **Stillpoint** | "The still point of the turning world": calm, centred, not combative |
| **Tidewell** | Gentle, flowing, and it hints at well-being |
| **Hearth** | Warm, a place you come back to |

"Forge" suggests effort and heat, which is more intense than the calm feel we want.
I'd suggest **Stillpoint** if branding becomes important.

## 2. Tech stack

| Concern | Choice | Why |
| --- | --- | --- |
| Framework | **Expo SDK 57 + React Native 0.86 + TypeScript (strict)** | One codebase for iOS, Android and web; managed native builds through EAS; and Expo Modules let us add Swift/Kotlin blocking code later without ejecting. |
| Navigation | **Expo Router** (file-based, typed routes) | Routes are files in `src/app/`. You get deep links for free, which a blocking shield needs so it can link back into the app. |
| State | **Zustand** + `persist` middleware | Tiny, no boilerplate, and easy to test. Actions sit next to state. |
| Storage | **AsyncStorage** (behind a persistence adapter) | Local-first and no setup. Everything goes through one `persist` storage, so moving to `expo-sqlite` (or a sync engine) touches one file. |
| Graphics | **react-native-svg** | Progress rings and charts, with no heavy chart library. |
| Animation | React Native `Animated` (native driver) | The breathing circle, press feedback and ring progress. Reanimated is installed for future gesture-heavy work. |
| Icons / haptics | `@expo/vector-icons` (Ionicons), `expo-haptics` | Built into Expo. |
| Tests | **Jest (jest-expo)** | The domain logic is pure TypeScript and fully unit-tested. |

### Architecture in one picture

```
 ┌────────────────────────── UI (src/app, src/components) ──────────────────────────┐
 │  Screens are thin: read selectors, call store actions, render components.      │
 └───────────────▲───────────────────────────────────────────────┬───────────────────┘
                 │ hooks / selectors                             │ actions
 ┌───────────────┴───────────────── State (src/store) ───────────▼───────────────────┐
 │  Zustand store: sessions, block lists, schedules, limits, usage, gems, settings │
 │  Persisted to AsyncStorage (versioned, migratable).                             │
 └───────────────▲───────────────────────────────────────────────┬───────────────────┘
                 │ pure functions                                │ "these apps are blocked now"
 ┌───────────────┴──── Domain (src/domain) ───────┐   ┌───────────▼── Services (src/services) ──┐
 │ session timer · schedules · limits · blocking  │   │ BlockingService interface          │
 │ focus score · streaks · gems · weekly report   │   │  ├─ SimulatedBlockingService (now) │
 │ No React, no I/O → trivially unit-testable     │   │  ├─ iOS Screen Time module (later) │
 └────────────────────────────────────────────────┘   │  └─ Android Accessibility (later)  │
                                                      └────────────────────────────────────┘
```

**Key rule:** `src/domain` never imports React, the store or the platform. Every "business rule"
(Can I end this Deep Focus session? Is Instagram blocked right now? What's my score?) is a pure
function of `(state, now)`. That keeps the logic testable and lets the native layer reuse the same rules.

## 3. Folder structure

```
focusforge/
├── app.json                  # Expo config (name, scheme, plugins)
├── docs/
│   ├── PLAN.md               # this file
│   └── NATIVE_BLOCKING.md    # how real blocking works on iOS & Android
├── src/
│   ├── app/                  # Expo Router: every file is a screen
│   │   ├── _layout.tsx       # root stack, hydration gate, onboarding redirect, watchers
│   │   ├── (tabs)/           # Home · Blocks · Insights · Settings
│   │   ├── session/          # new.tsx (setup) · active.tsx (live timer)
│   │   ├── blocklist/[id].tsx
│   │   ├── schedule/[id].tsx
│   │   ├── limit/[id].tsx
│   │   ├── blocked.tsx       # the mindful block screen ("shield")
│   │   ├── simulator.tsx     # pretend phone home screen to try blocking
│   │   ├── allowlist.tsx
│   │   └── onboarding.tsx
│   ├── components/           # reusable UI (Card, Button, ProgressRing, …)
│   ├── domain/               # pure business logic + types (+ __tests__)
│   ├── data/                 # app catalog, quotes, sample-data generator
│   ├── hooks/                # useNow, useTheme, useSessionWatcher, …
│   ├── services/blocking/    # BlockingService abstraction + simulator
│   ├── store/                # Zustand store + selectors
│   └── theme/                # colour tokens (light/dark), spacing, type scale
└── package.json
```

## 4. Phased implementation

### Phase 1: core blocking and timer ✅
- App catalog (sample apps and websites, by category) and **block lists** (CRUD, categories and individual apps).
- **Allowlist** of essential apps that are never blocked (Phone, Messages, Maps, …).
- **Focus session engine:** presets (25/50/90) and custom length, wall-clock based so it survives backgrounding and restarts.
- **Difficulty levels**
  - *Easy*: end anytime, unlimited breaks.
  - *Medium*: a 10-second mindful countdown and confirmation before ending early; up to 2 breaks.
  - *Deep Focus*: no early end and no breaks; the timer must finish.
- **Breaks:** 5 or 15 minutes, with a countdown-and-confirm step; blocking resumes on its own when the break ends, and the session end time moves back so you don't lose focus time.
- **Mindful block screen:** a quote, a 4-7-8 breathing prompt, a gentle message and the reason ("Deep Focus until 10:40").
- `BlockingService` abstraction and a simulator ("Try your shield") to show blocking working.

### Phase 2: schedules and limits ✅
- **Recurring schedules** (weekdays, start/end time, overnight ranges such as 23:00→07:00), each with its own block lists and difficulty.
- **Daily app limits** (for example Instagram 30 min/day); once used up, the app is blocked until midnight.
- A single `getBlockState(appId, state, now)` resolver merges session, schedule and limit rules, so there is one source of truth.

### Phase 3: tracking and rewards ✅
- **Daily Focus Score** (0–100): 70% progress toward the daily focus goal + 30% focus-to-distraction ratio.
- **Screen-time breakdown** by app and category, a week chart, time saved and top distractions.
- **Weekly report:** focus hours, time saved against your baseline, longest streak, top distractions.
- **Streaks:** a day counts when you focus for at least 25 minutes.
- **Gems:** unlockable badges (first session, first Deep Focus, 10 h focused, 7-day streak, …) with a celebration on unlock.
- Sample data (14 days) so every screen looks alive on first launch; it can be reset in Settings.

### Phase 4: next steps (nice-to-haves)
- Real device blocking through native modules (see `docs/NATIVE_BLOCKING.md`).
- Home-screen widgets (iOS WidgetKit through an Expo config plugin, Android Glance).
- Cloud sync: swap the persistence adapter for a sync engine (Supabase/PowerSync, or Expo SQLite and a sync server).
- Social accountability: shared focus rooms and a friendly leaderboard.
- Local notifications: "Your break is over", "Deep Work starts in 5 min".

## 5. Tone and design principles
- **Never shame.** Say "You've focused 3h this week 🌱", not "You wasted 4h". Distraction is "time on other apps".
- **Friction, not walls** (except in Deep Focus, which the user chose on purpose).
- **Soft and calm:** warm neutral backgrounds, rounded 20 px cards, one accent colour per difficulty, generous spacing, and slow ease-in-out motion.
- **Empty states teach:** every empty list explains what it's for and offers the next step.
