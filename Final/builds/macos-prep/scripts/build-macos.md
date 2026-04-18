# build-macos.sh usage

## Run directory
Run from `Final/builds/macos-prep/scripts` on a macOS machine.

## Commands
```bash
cd Final/builds/macos-prep/scripts
chmod +x build-macos.sh
./build-macos.sh
```

## Expected result
The script installs dependencies (`npm ci`), builds app sources (`npm run build`), and packages macOS artifacts (`npm run dist:mac`).

## Output paths
- `.app`: `Final/builds/macos-prep/app-source/release/mac-universal/ToolCAD.app`
- `.dmg`: `Final/builds/macos-prep/app-source/release/ToolCAD-*.dmg`

## Signing note
Unsigned macOS build is supported from this prep package.
Code signing and notarization are not performed on Windows; run signing/notarization later on macOS CI or a macOS host.