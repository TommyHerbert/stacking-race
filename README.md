# Stacking Race

Offline schizolo race-betting game. See [`docs/spec-v1.md`](docs/spec-v1.md).

## pnpm requirement

pnpm is a prerequisite for running the app. This command is meant to download and run the Linux installation script:

```bash
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

But when I ran it, I found I had to add `~/.local/share/pnpm` to the path and then run again.

## Develop

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm dev
```

Open the printed local URL (phone-portrait shell).

## Deploy

```bash
pnpm build
```

## Android (offline APK)

Capacitor wraps `apps/web`. Native project: `apps/web/android`.

Needs `ANDROID_HOME` (e.g. `~/Android/Sdk`) and a JDK that can run the Gradle wrapper (Java 25 works with the pinned Gradle 9.1).

```bash
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$ANDROID_HOME/platform-tools:$PATH"

pnpm android:apk
```

Debug APK: `apps/web/android/app/build/outputs/apk/debug/app-debug.apk`

Install on a USB-debugging phone:

```bash
adb install -r apps/web/android/app/build/outputs/apk/debug/app-debug.apk
```

Or copy the APK to the phone and open it (allow install from that source).
