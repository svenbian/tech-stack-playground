# Real device blocking: iOS and Android

FocusForge decides **what** is blocked in pure TypeScript (`src/domain/blocking.ts`). A
`BlockingService` (`src/services/blocking/`) **enforces** it. Today that is the
`SimulatedBlockingService`. This document explains how to replace it with real enforcement.

> Neither approach works in **Expo Go**. Both need native code, so you'd build a
> [development build](https://docs.expo.dev/develop/development-builds/introduction/)
> (`npx expo run:ios|android` or `eas build --profile development`) and add the native parts
> as a local **Expo Module** plus a **config plugin**. Never edit `ios/` or `android/` by hand.

```
modules/
└── focus-shield/                  # npx create-expo-module --local focus-shield
    ├── index.ts                   # JS API: requestAuthorization, applyShield, clearShield, events
    ├── ios/FocusShieldModule.swift
    ├── android/.../FocusShieldModule.kt
    └── plugin/withFocusShield.ts  # entitlements, extensions, manifest entries
```

---

## iOS: Screen Time API (FamilyControls, ManagedSettings, DeviceActivity)

Apple provides three frameworks (iOS 16+). Opal uses these as well.

| Framework | Role in FocusForge |
| --- | --- |
| **FamilyControls** | `AuthorizationCenter.shared.requestAuthorization(for: .individual)` asks the user for Screen Time access. Also provides `FamilyActivityPicker`, the system UI where users choose apps, categories and web domains. |
| **ManagedSettings** | `ManagedSettingsStore().shield.applications = tokens` applies the block. Use `shield.applicationCategories` for categories and `shield.webDomains` for sites. |
| **DeviceActivity** | `DeviceActivityCenter().startMonitoring(...)` with a `DeviceActivitySchedule` handles **schedules** and **daily limits** (`DeviceActivityEvent(threshold: DateComponents(minute: 30))`), even when the app isn't running. |

### Important constraints
1. **Opaque tokens.** iOS never tells you which app is which. The picker returns
   `ApplicationToken`s, not bundle IDs or names. A block list therefore stores
   `FamilyActivitySelection` (encoded as `Data`) instead of our `appIds`. `BlockList.appIds`
   becomes a per-platform payload.
2. **Entitlement.** You need `com.apple.developer.family-controls`. It works in development
   immediately, but App Store distribution requires
   [requesting it from Apple](https://developer.apple.com/contact/request/family-controls-distribution).
3. **App extensions** (added through the config plugin, each with its own target and App Group):
   - `DeviceActivityMonitor` extension: `intervalDidStart` / `intervalDidEnd` apply or clear the
     shield for schedules, and `eventDidReachThreshold` enforces daily limits.
   - `ShieldConfiguration` extension: customizes the system shield (calm colours, icon,
     a short quote). This is our "mindful block screen" on iOS.
   - `ShieldAction` extension: handles the shield's buttons. "Open FocusForge" can deep-link to
     `focusforge://blocked?appId=…` for the full breathing experience.
   - `DeviceActivityReport` extension: renders real **screen time** charts. Usage data stays
     inside the extension's sandbox (privacy by design), so Insights embeds this report view.
4. **Shared state.** The app and its extensions share an **App Group** (`group.com.focusforge`).
   We'd write the active session and schedules there so extensions can enforce Deep Focus
   without the app running.

### Mapping to our code
```ts
// src/services/blocking/ScreenTimeBlockingService.ts (sketch)
import FocusShield from '../../../modules/focus-shield';

export class ScreenTimeBlockingService implements BlockingService {
  name = 'Screen Time';
  isNative = true;
  requestAuthorization = () => FocusShield.requestAuthorization();      // FamilyControls
  getAuthorizationStatus = () => FocusShield.getAuthorizationStatus();
  applyShield = ({ appIds, title, subtitle }) =>
    FocusShield.applyShield(selectionFor(appIds), { title, subtitle });  // ManagedSettingsStore
  clearShield = () => FocusShield.clearShield();
}
```
Schedules and limits map to `DeviceActivitySchedule` and `DeviceActivityEvent`, registered whenever
the user saves a schedule or limit. The OS enforces them in the background.

---

## Android: AccessibilityService + UsageStatsManager + overlay

Android has no single "shield" API, so focus apps combine a few system services:

| Piece | Role |
| --- | --- |
| **AccessibilityService** | Receives `TYPE_WINDOW_STATE_CHANGED` events with the foreground `packageName`. If the package is blocked (same rules as `getBlockState`), launch our block screen at once. |
| **Block screen** | Start a `FLAG_ACTIVITY_NEW_TASK` activity (or a `SYSTEM_ALERT_WINDOW` overlay) showing the mindful screen, then use `performGlobalAction(GLOBAL_ACTION_HOME)` on "Close app". |
| **UsageStatsManager** | `queryEvents` / `queryUsageStats` (needs `PACKAGE_USAGE_STATS`, granted in Settings) provide real **screen time** for Insights and **daily limits**. |
| **Foreground service + AlarmManager / WorkManager** | Keeps schedules and session timers reliable in the background and survives Doze. |
| **PackageManager** | Lists installed launchable apps for the block list picker, so we get real names and icons. |
| **VPN or DNS (optional)** | A local `VpnService` can block **websites** across browsers. A lighter option is reading the browser URL bar through accessibility. |

### Important constraints
1. **Google Play policy.** Apps using `AccessibilityService` for non-accessibility purposes need a
   prominent disclosure, user consent and a Play Console declaration. Digital-wellbeing apps are
   an accepted use case, but the disclosure screen is mandatory.
2. **OEM battery killers** (Xiaomi, Samsung, …) may stop the service. Onboarding should guide
   users to exclude FocusForge from battery optimisation.
3. **Permissions UX.** Accessibility, Usage Access and Display over other apps are all special
   permissions granted in system Settings. Onboarding deep-links to each with an `Intent`.

### Mapping to our code
The Kotlin service can't run JavaScript, so the JS side pushes a compact **rules snapshot**
(blocked package set, session end time, schedules, limits) to native storage through
`applyShield`. The service evaluates it on every window change, a native port of
`getBlockState`. The rules stay small and declarative, which keeps the port straightforward
and easy to test against the same cases as `src/domain/__tests__/blocking.test.ts`.

---

## Why the simulator is still useful
- The **same resolver** drives the simulator, the UI and the snapshot sent to native code, so
  every rule is unit-tested once.
- The in-app **block screen** (`src/app/blocked.tsx`) is the deep-link target for both native
  shields, so the full mindful experience is shared across platforms.
