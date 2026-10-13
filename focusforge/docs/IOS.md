# FocusForge on your iPhone 📱

There are three ways to get FocusForge onto an iPhone. **Start with Option 1.** It's free,
works today, and needs no Mac and no Apple Developer account.

| | Option 1: Expo Go | Option 2: TestFlight (cloud build) | Option 3: Xcode on a Mac |
| --- | --- | --- | --- |
| **Cost** | Free | $99/year Apple Developer Program | Free (app expires after 7 days) or $99/year |
| **You need** | Any computer (Windows, Mac or Linux) + iPhone | Free Expo account; **no Mac needed** | A Mac with Xcode |
| **Result** | Runs inside the *Expo Go* app while your computer serves the code | A real app with the FocusForge icon on your home screen | A real app, built and installed from your Mac |
| **Best for** | Trying it now, learning, live-editing code | Using it day to day, sharing with friends | Native debugging, real Screen Time blocking later |

---

## Option 1: Run it in Expo Go (about 15 minutes, free)

**How it works:** Expo Go is an App Store app that already contains all the native iOS parts
FocusForge uses (storage, haptics, graphics). Your computer runs a small server (*Metro*) that sends
the app's JavaScript to your phone over Wi-Fi. When you edit code, the phone updates within a
second, which makes it a great way to learn.

### On your computer (one-time setup)
1. Install **Node.js LTS** from <https://nodejs.org> (the "LTS" button). Accept the defaults.
2. Install **Git** from <https://git-scm.com/downloads> (Macs usually have it already).
3. Open a terminal (*Terminal* on Mac, *PowerShell* on Windows) and run:
   ```bash
   git clone https://github.com/svenbian/tech-stack-playground.git
   cd tech-stack-playground
   git checkout claude/focusforge-distraction-blocker-7oldvt   # or main, once merged
   cd focusforge
   npm install
   ```

### On your iPhone (one-time setup)
4. Install **Expo Go** from the App Store (it's free and made by Expo).

### Every time you want to run it
5. In the `focusforge` folder on your computer:
   ```bash
   npx expo start
   ```
   A QR code appears in the terminal.
6. Make sure your phone and computer are on the **same Wi-Fi**.
7. Open the iPhone **Camera**, point it at the QR code and tap the banner. FocusForge opens in Expo Go.
   If iOS asks to let Expo Go find devices on your **local network**, tap **Allow**.

### If something goes wrong
| Problem | Fix |
| --- | --- |
| Phone can't connect / spins forever | Different networks, or a work or school Wi-Fi that blocks devices from seeing each other. Stop the server (Ctrl+C) and run `npx expo start --tunnel` |
| "Project is incompatible with this version of Expo Go" | Update Expo Go in the App Store. The project uses **Expo SDK 57** |
| Windows asks about the firewall for Node.js | Click **Allow** (private networks) |
| Red error screen | Shake the phone → **Reload**. If it persists, copy the message and ask me |
| Want to start fresh | In the app: Settings → Reset everything |

**Limitations of Option 1:** your computer must be running `npx expo start` whenever you open the
app, and blocking is simulated (*Try your shield*).

---

## Option 2: Install it as a real app with TestFlight (no Mac needed)

This gives you FocusForge with its own icon, running without your computer. Expo's cloud service
(**EAS Build**) compiles the iOS app on Apple hardware for you. The project already includes the
build profiles (`eas.json`) and iOS settings (`app.json`).

1. **Join the Apple Developer Program** at <https://developer.apple.com/programs/> ($99/year).
   Approval usually takes a day or two.
2. **Create a free Expo account** at <https://expo.dev/signup>.
3. Install the EAS command-line tool and log in:
   ```bash
   npm install -g eas-cli
   eas login
   ```
4. Link the project to your Expo account (run inside `focusforge/`):
   ```bash
   eas init
   ```
   This adds a `projectId` to `app.json`. Commit that change.
5. **Check the bundle ID.** `app.json → expo.ios.bundleIdentifier` is `com.svenbian.focusforge`.
   It must be unique on the App Store. If the build says it's taken, change it (for example
   `com.yourname.focusforge`).
6. Build in the cloud:
   ```bash
   eas build --platform ios --profile production
   ```
   EAS asks you to sign in with your Apple ID and then **creates the certificates and provisioning
   profiles for you**. Say yes to the defaults. The build takes about 15–30 minutes. The free
   Expo plan may queue it for a while.
7. Upload to Apple:
   ```bash
   eas submit --platform ios --latest
   ```
8. In **App Store Connect** (<https://appstoreconnect.apple.com>) → your app → **TestFlight**,
   add yourself as an **internal tester**. Install the **TestFlight** app on your iPhone, accept the
   invite and tap **Install**. FocusForge now lives on your home screen. 🎉

To ship a new version later, run steps 6–7 again. The build number goes up automatically
(`autoIncrement` in `eas.json`).

> **Skip TestFlight (optional):** register your phone with `eas device:create`, then run
> `eas build --platform ios --profile preview`. EAS gives you a link or QR code that installs
> the app straight onto that phone. This also needs the paid Apple account.

---

## Option 3: Build from a Mac with Xcode

If you get a Mac later, install Xcode from the Mac App Store, plug in your iPhone and run:
```bash
npx expo run:ios --device
```
With a free Apple ID the app stops opening after 7 days and must be reinstalled. With the paid
program it lasts a year.

---

## What's needed for real app blocking?

Expo Go can only *simulate* blocking. Real blocking uses Apple's Screen Time APIs, which need:
- a **development build** (Option 2 with a development profile, or Option 3), because Expo Go can't
  include custom native code, and
- the **Family Controls entitlement**, which you request from Apple for App Store distribution.

The full plan is in [`NATIVE_BLOCKING.md`](NATIVE_BLOCKING.md). When you're ready for that step,
Option 2 or 3 will already be set up.
