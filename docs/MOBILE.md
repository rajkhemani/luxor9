# LUXOR9 Mobile (thin)

Flutter app: **Tower · Chat · Approvals** against the same FastAPI backend.

## Platforms

| Platform | Where to build |
|---|---|
| Android | Mac / Linux / Windows + Android Studio / emulator |
| iOS | **Mac only** — Xcode + CocoaPods + Simulator/device |

This Cloud Agent is Linux: it can scaffold and analyze the app, not run an iOS Simulator.

## One-time Mac setup (iPhone)

```bash
# Flutter
git clone https://github.com/flutter/flutter.git -b stable $HOME/flutter
export PATH="$PATH:$HOME/flutter/bin"

# Xcode (App Store) then:
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -license accept
xcodebuild -runFirstLaunch
sudo gem install cocoapods   # or: brew install cocoapods

flutter doctor
```

## Run full stack (thin)

Terminal 1 — API:

```bash
cd apps/api && source .venv/bin/activate
AUTH_DISABLED_FOR_TESTS=true ENVIRONMENT=development \
  uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Terminal 2 — Web Control Tower (optional):

```bash
cd apps/control-tower && NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000 npm run dev
```

Terminal 3 — Mobile:

```bash
cd apps/mobile
# Simulator / emulator must reach your machine:
flutter run --dart-define=API_BASE_URL=http://127.0.0.1:8000
# Physical device: use your LAN IP, e.g. http://192.168.1.20:8000
```

Android emulator loopback: `http://10.0.2.2:8000`.

## Winning demo path (same on web + mobile)

1. Chat → objective (Dubai RE launch)
2. Approve blueprint
3. See report / evidence in Tower
4. Approvals → sandbox campaign publish

No Clerk JWKS required in development (`X-Demo-User` / demo headers).
