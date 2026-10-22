# Earth-anchored 0.3 preview — local browser handoff

Branch: `codex/celestial-true-3d`, based on a5e5aea. Package 0.3.0-preview.1; proposed minor 0.3.0. Rendering/test source: e7084f1973f53ce6a2fa53d0a391f365b38374f7. The archive commit adds evidence only. No main, release tag, consumer pin or production changes.

## Delivered

Stable world-space sphere meshes and Saturn RingGeometry; no screen-minimum mesh scaling. Original colour plus derived normal/roughness maps, linear filtering/mipmaps and directional lighting. Planets are meshes; labels are in a separate projection-tracked UI overlay. Only the Sun corona may be a spatial sprite. Selection rims are independent 3D geometry.

Earth is a procedural, non-selectable sphere at [0,0,0], radius 2.4 illustrative units. Camera stays at [0,2.85,0], altitude .45. Reset looks outward (yaw0/pitch0/FOV70); downward pitch reveals physical curvature/horizon. All supplied celestial coordinates remain unchanged. Earth physically occludes bodies/labels behind its limb; complete records stay in state and overview hints identify below-limb directions. No free flight, pan, translation or body-spin illusion.

Full-circle azimuth normalizes to [-180,180), pitch clamps ±70, FOV18–110. Drag and two-pointer pinch retain tap suppression; wheel while a pointer is down also suppresses selection. Moment switching preserves camera. Toolbar provides full azimuth, both pitch bounds, both FOV bounds and reset.

## Integration

See ../../docs-true-3d.md. Import createView/probeWebGL from the view export; call createView(data, options, {canvasFactory, require_webgl:true, onMode}). In this mode onMode/status use only webgl or unavailable. Failure has reason webgl-unavailable and a detail (webgl2-unavailable, context-lost, render-failure, performance); canvas is null when unavailable. Host must branch before mounting. No Canvas fallback allocation occurs. Recreate explicitly to retry. Omitted require_webgl preserves legacy non-product fallback compatibility.

Open ../../examples/true-3d.html via a local static server. Its rendering status is non-interactive, not a fake mode toggle. ?force_unavailable exercises startup failure. All controls/events are host-owned.

## Evidence and validation

46 automated tests pass, including coordinates, selection, recording seam interpolation, derived maps, world/ring matrices, Earth reference/observer immutability/occlusion, capability and required-WebGL failure transitions, legacy fallback, gestures, audited asset hashes and MIT/offline/no-global-access checks.

15 local Chromium browser checks pass. 12 screenshots show desktop and mobile-layout-emulation initial/rotated/close-Saturn/downward-Earth/opposite-azimuth views, plus simulated failure and a separate browser actually launched with WebGL disabled. Actual context loss reports unavailable with no substitute Canvas. Repeated canvas pixels match within the recorded environment. verification.json contains runtime/asset hashes and actual world-matrix snapshots. The 12-frame H.264/yuv420p MP4 regression is a local encoder smoke test, not a final video sequence.

The human user explicitly replaced the iPhone Safari gate with local-browser testing. No real-phone/Safari evidence is required or claimed. Mobile screenshots are only local layout/touch emulation.

All assets remain original illustrative MIT. The v2 asset manifest lists 22 colour PNGs plus five procedural sources (including Earth observation frame); normal/roughness data derives from source locally. No NASA/USGS imagery or precise geographic claim. No dependency additions or network/data-service integration.
