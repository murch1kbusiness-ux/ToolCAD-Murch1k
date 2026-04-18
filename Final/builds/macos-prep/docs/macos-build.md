# macOS build guide (ToolCAD)

## 1) Prerequisites
- macOS 11+
- Node.js 20.x (LTS recommended)
- npm 10+
- Xcode Command Line Tools (`xcode-select --install`)

## 2) Install dependencies
```bash
cd Final/builds/macos-prep/app-source
npm ci
```

## 3) Build application sources
```bash
npm run build
```

## 4) Package macOS build
```bash
export CSC_IDENTITY_AUTO_DISCOVERY=false
npm run dist:mac
```

## 5) Expected output
- App bundle: `app-source/release/mac-universal/ToolCAD.app`
- Disk image: `app-source/release/ToolCAD-*.dmg`

## 6) Notes on signing and notarization
- This prep package targets unsigned packaging by design.
- Signing + notarization must be executed on macOS with Apple Developer credentials.
- Windows host cannot complete notarization.