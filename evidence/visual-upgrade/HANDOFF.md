# Visual interaction upgrade — local handoff

Feature package 0.2.0-preview.1; proposed minor 0.2.0. New branch `codex/celestial-visual-interaction`, based on 198a746. Render evidence source: 60c35192f649ad3b77ad38ffc6c899c5b6ce3d8f. The final archive commit adds evidence/document metadata only. No main, release tag, consumer dependency or production change.

## Review result

36 automated tests pass. Eight complete-page screenshots have been visually inspected: desktop landscape/portrait, iPhone portrait and Android portrait, each in WebGL and forced Canvas. The field has quiet three-layer stars, a textured emissive Sun and several shaded bodies, Saturn rings, default glyph labels, a subdued guide and controlled interaction treatments. Labels avoid other label/body boxes and a host-reserved safe area; crowded labels may be deterministically hidden. An extra screenshot records the expanded bounds.

Browser tests pass real desktop drag without selection, wheel zoom, keyboard reset, simulated two-pointer pinch without selection, discrete dataset camera retention, actual WebGL context loss, performance fallback, no page errors and no horizontal overflow. WebGL and Canvas repeat screenshots match byte-for-byte within the recorded 1024×900 / DPR1 / Chromium145 / Darwin-arm64 / SwiftShader environment. The recording export also produces a 12-frame 1920×1080 H.264/yuv420p MP4 on the exact source commit; that is an encoder smoke test, not a finished sequence.

## API and source

`orbitBy`, `zoomBy`, `resetCamera`, `camera`, `state`, `visibleBodyIds`, `hoverAt` and the `gestures` export are additive. Camera-origin and geometry truth are unchanged. Yaw ±72°, pitch ±52°, FOV 30–100°, reset 0/0/70. Direct camera validation rejects invalid inputs; gesture updates clamp. Omitting camera on `setOptions` preserves it. Host event listeners remain in the example. Surface/bitmap injection is optional and never fetched by the core. See ../../docs-visual-upgrade.md and ../../examples/exploration.html.

All assets: ../../assets/ASSET_MANIFEST.json. 22 original MIT PNGs (11 bodies ×512/128 widths, 1,276,577 bytes total) plus four hashed procedural-code sources for surfaces, stars/layout, glyph atlas and Saturn rings/halos. All illustrative; no NASA/USGS imagery and no geographic accuracy claim. Low-memory maps and texture ownership are documented.

## Boundaries and remaining acceptance

Mobile screenshots are Chromium viewport/touch emulations, not real iPhone/Android or Safari certification. Physical device/Safari acceptance and reviewed consumer pinning remain with the product owner. The approved experience is a local Earth-centred perspective; bodies behind the bounded camera are accurately marked in an overview. No angle compression, observer translation or all-sky perspective trick is used. Canvas is labeled as a complete polar sky map. No production deployment is requested.
