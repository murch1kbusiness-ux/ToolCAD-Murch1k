# Release Status: macOS prep

## Prepared on Windows
- macOS prep folder structure created.
- Application source snapshot copied to `app-source`.
- Build script and usage docs prepared.
- Build config snapshots generated.
- Dependency and readiness check files generated.

## Remaining on macOS
- Run `scripts/build-macos.sh`.
- Validate generated `.app` launch on macOS.
- Validate generated `.dmg` install flow.
- Perform signing/notarization (if release policy requires signed build).

## Current limitations
- No code signing identity on Windows.
- No notarization token workflow on Windows.
- Final signed distribution requires macOS CI or local Mac environment.