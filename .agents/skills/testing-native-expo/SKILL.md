---
name: testing-native-expo
description: Run and UI-test the Getsu native app (apps/native, Expo SDK 52 / RN 0.76) on an Android emulator. Use when verifying native-view changes end-to-end (tabs, Year timeline, Reflect, You/Insights, Month navigation).
---

# Testing the Getsu native app (Expo, Android)

`apps/native` is an Expo (SDK 52) React Native app that lives OUTSIDE the root npm
workspaces and reuses `@getsu/core` / `@getsu/shared`. It needs its own
`npm install`. Web tests do NOT cover it.

## Environment setup (Android emulator)
- SDK at `/home/ubuntu/android-sdk`; env in `/home/ubuntu/android-env.sh`
  (`ANDROID_HOME`, `ANDROID_SDK_ROOT`, PATH for platform-tools/emulator).
- AVD `getsu-api34` (API 34, `google_apis;x86_64`), serial `emulator-5554`.
- Needs KVM: `qemu-kvm libvirt-daemon-system bridge-utils cpu-checker`.
- Expo Go is installed as `host.exp.exponent`. A minor version mismatch warning
  (recommended vs installed) is fine — the app still runs.

## Two PRE-EXISTING blockers that stop the app from booting
As of this writing the native app will NOT run without working around two gaps.
They are unrelated to any single view change; expect to hit them every time until
they're fixed in the repo. Both fixes below are **temporary/test-only** — revert
before committing and do not include them in a feature PR.

1. **Metro `.js` resolution.** `@getsu/core` / `@getsu/shared` set
   `"main": "./src/index.ts"` and use NodeNext `.js` import specifiers
   (`export * from './vault.js'`). Metro can't rewrite `.js`→`.ts`, so bundling
   fails: `Unable to resolve module ./vault.js from packages/core/src/index.ts`.
   Temp fix — add to `apps/native/metro.config.js` before `module.exports`:
   ```js
   const defaultResolve = config.resolver.resolveRequest;
   config.resolver.resolveRequest = (context, moduleName, platform) => {
     if (moduleName.startsWith('.') && moduleName.endsWith('.js')) {
       try { return context.resolveRequest(context, moduleName.replace(/\.js$/, ''), platform); }
       catch { /* fall through */ }
     }
     return (defaultResolve ?? context.resolveRequest)(context, moduleName, platform);
   };
   ```
   A real fix likely builds the packages and points RN at `dist`, or adds this
   resolver permanently.

2. **`nanoid` needs `crypto.getRandomValues` (missing under Hermes).**
   `store.load()` → `seedDemoVault()` → `nanoid()` throws on first run; because
   `seedDemoVault` is called OUTSIDE `load()`'s try/catch, the app hangs on the
   loading spinner forever (NO red box — easy to misread as "slow"). Symptom:
   cream screen with a spinner that never resolves and no JS error in Metro logs.
   Temp fix — `npm install --no-save --package-lock=false react-native-get-random-values`
   then add `import 'react-native-get-random-values';` as the FIRST line of
   `apps/native/index.ts`. A real fix adds this import (and dep) permanently.

## Run it
```bash
cd apps/native && npm install
# apply the two temp workarounds above
source /home/ubuntu/android-env.sh
# start emulator if not running:  emulator -avd getsu-api34 -no-window &  (or with window)
CI=1 npx expo start --localhost --clear    # run in a PERSISTENT shell; --clear after config edits
adb shell am force-stop host.exp.exponent
adb shell am start -a android.intent.action.VIEW -d "exp://127.0.0.1:8081" host.exp.exponent
```
Tips:
- Run Metro in a long-lived shell (backgrounded one-shots can die). After editing
  `metro.config.js`, restart with `--clear` or the old bundle/cache is served.
- First bundle ~15-60s (928 modules). On launch, dismiss the Expo Go dev-menu
  ("Continue") and any emulator "Compatibility Warnings" dialogs.
- `adb exec-out screencap -p > shot.png` is a reliable way to peek at state; for
  the recorded walkthrough use the `computer` tool so clicks are visible.
- Check JS errors with `adb logcat -d | grep -i ReactNativeJS`.

## What to verify (Phase 8 IA)
- Tab bar order **Year / Goals / Reflect / You** (no "Insights" tab).
- **Year** = journaling-first vertical timeline (big month #, name, journal
  snippet, colored goal dots; faint "yet to come"/"nothing written yet" months;
  "GOALS FOR <year>" add-goal input preserved). Tapping a month opens Month.
- **Reflect** = MEMORIES rail + REFLECTION grouped Highlights / Areas of growth /
  To work on + "Reflected offline." footer, and NO Claude/"go deeper" button
  (native is offline-only). Note: the seed vault has **0 photos**, so the rail
  shows the journal-snippet **fallback** cards, not image cards — the
  image-rail + photo→Month tap paths need a vault with photos to exercise.
- **You** = INSIGHTS section (metric tiles + "GOALS ACROSS <year>" bars +
  PROGRESS) folded in ABOVE Theme/Plan/Sync.

## Devin Secrets Needed
None. The app runs fully offline; sync is off unless
`EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` are set (not needed
for UI testing).
