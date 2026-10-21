# Metavie Celestial Simulator

AGPL-3.0-or-later. Independent generic celestial visualization, version 0.1.0.

`npm ci && npm test`. `npx playwright install chromium` then `npm run record -- shots/landscape.json output/landscape` (requires FFmpeg with libx264). Portrait: use `shots/portrait.json`.

## Contracts

`celestial_positions.v1`: `{schema_version, moments: [{id, color, bodies: [{id, kind, longitude_deg, latitude_deg, distance_au, altitude_deg, label}]}]}`. Angles in degrees; ecliptic longitude/latitude of date. Altitude is independently supplied by the consumer; no observer input or ephemeris calculation. `axis` bodies render as markers, never spheres. Earth is the camera origin and must be omitted by consumers. Moment ids are opaque: consumers map their discrete datasets to them. No continuous ephemeris interpolation.

`state(data,{moment_id,camera,ring,selection})` is deterministic. Camera is Earth-centered: yaw ±45°, pitch ±30°, FOV 45–85°. Ecliptic coordinates determine geometry; below-horizon presentation uses supplied altitude. This is an ecliptic schematic, not an observer-oriented planetarium.

Ring is optional external generic geometry: `[{id,start_deg,width_deg,color}]`. The caller owns ordering, meaning and interaction state. Selection values are `pending`, `discovered`, `disabled`; only the first two emit `{id,state}`. No application business rules exist here.

`createScene` creates pure Three.js objects without DOM access. `createRenderer(canvas,...)` accepts a consumer-owned canvas. Caller owns events, WebGL context lifecycle and fallback canvas replacement. `fallbackReason` chooses reasons for WebGL2 unavailable, context loss or frame time over 33.34ms; `drawFallback` renders the same moment and ring to Canvas 2D with hit testing. Scene objects must be disposed on replacement.

`cosmos_shot.v1` fields are demonstrated in shots/. Fixed Earth-view camera keyframes interpolate by frame index. Only bundled `synthetic_geometry_001` is accepted; arbitrary coordinates, paths and remote sources are rejected. `recordFrames` emits timestamped deterministic state to a host encoder. The local CLI demonstrates PNG frame output and H.264/yuv420p MP4 plus provenance. Recording-only effects belong exclusively in the recording module; narrative beams/heliocentric shots are deferred and rejected by v1 rather than silently ignored. Labels are supplied as consumer-owned textures through `labelTextures`; the local recorder builds them at its DOM boundary. Ring visibility in recordings uses a generic twelve-sector synthetic ring.

## Verification and provenance

Cross-device assertions cover state and angular geometry to 1e-10 degrees. Pixel hashes apply only to an identical browser/SwiftShader/OS/architecture/font environment recorded by the CLI. Node dependencies and Chromium revision are pinned by package-lock.json. FFmpeg version is recorded; MP4 bitstreams are not asserted identical across encoders. Never compare pixels across devices. No external textures or random runtime assets; see THIRD_PARTY_NOTICES.md.

Source recipients and network users must receive corresponding source and this license. Before any deployment, link SOURCE_URL in SOURCE.md to the actual immutable source revision. No production deployment is included.

For the verified local recording environment, set `CELESTIAL_CHROMIUM_PATH` to a Chromium 145.0.7632.6 executable. The default uses Playwright’s bundled Chromium; its pixels are a separate baseline. See evidence/verification.json for the pinned proof environment.
