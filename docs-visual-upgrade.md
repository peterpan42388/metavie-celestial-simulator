# Historical visual and interaction preview

This document describes the previous 0.2 preview. The current feature branch follows [the 0.3 Earth-anchored contract](docs-true-3d.md).

Branch `codex/celestial-visual-interaction`, based on `198a746`. Proposed next minor version: **0.2.0**, feature package **0.2.0-preview.1**. No release tag or consumer pin changes. MIT remains unchanged.

## Additive API

```js
const view = createView(positions, {
  moment_id: 'moment_0',
  selection: {sun: 'pending', moon: 'discovered'},
  onSelect: ({id, state}) => inspect(id, state),
  visuals: {
    quality: 'standard', // or 'low_memory'
    labels: 'symbols_and_names', // 'symbols' | 'none'
    stars: true,
    asset_resolver: id => preloadedTextures[id] ?? null,
  },
}, {canvasFactory, onMode});
view.render(width, height);
view.orbitBy({delta_x_px: dx, delta_y_px: dy,
  viewport_width: cssWidth, viewport_height: cssHeight});
view.zoomBy({delta: wheelDelta});
view.resetCamera();
view.setOptions({...nextOptions, moment_id: 'moment_1'});
```

Yaw clamps to ±72°, pitch ±52°, vertical FOV 30–100°. Orbit maps one viewport width to 144° and one height to 104°. Positive horizontal delta increases yaw; positive vertical delta increases pitch. Zoom is `FOV * exp(delta * 0.001)` with clamping. Nonfinite deltas or nonpositive viewport dimensions reject; repeated updates never accumulate state outside the bounds. Reset is exactly yaw 0°, pitch 0°, FOV 70°. `setOptions` with no explicit camera preserves current camera; an explicit camera remains authoritative and rejects outside bounds. Get `view.camera` or `view.state` for reproducible snapshots. `view.visibleBodyIds` reports actual body-centre visibility for the active representation, so host overview hints do not mislabel the complete 2D map. No inertia, clock or frame loop exists. Camera origin is always [0,0,0]. Camera rotation is a stable spherical direction transform; materials and screen-space labels add spatial legibility without translating the observer or falsifying directions.

`createScene`, `createRenderer`, `selectAt`, fallback and recording exports remain. Direct renderer hosts may call `setCamera` and `setFocus`. `view.hoverAt(x,y)` returns a controlled interactive id or null; only pending/discovered can show focus treatment. Injected `labelTextures` continue to override default labels. Default atlas generation uses a bundled original bitmap alphabet and astronomy glyphs without a DOM/font dependency. `visuals.label_padding: {top,bottom,left,right}` can reserve host HUD space (pixels in the render viewport). Sprite labels use stable id-priority placement, avoiding body footprints and other labels; if no safe slot exists a label is hidden rather than overlapped. Labels, halos, stars and guides never participate in raycasts.

## Host gestures

See `examples/exploration.html` and `examples/exploration.js`. Import `createGestureController` from the gestures export, provide `viewport()` with `{css_width,css_height,render_width,render_height}`, and forward `{pointer_id,x,y}` in local CSS pixels to `pointerDown/Move/Up/Cancel`. The example owns event listeners and pointer capture; reset/cancel on lifecycle changes. An 8px movement threshold distinguishes tap from drag; after any two-pointer interaction, neither pointer release can tap. Pinch uses the distance ratio; wheel forwards delta (host converts line units to pixels). The host maps the eventual tap to render coordinates once. Keyboard-operable buttons cover orbit, zoom and reset. No touch event APIs leak into the scene.

## Assets and memory

Visible spheres retain at least a 7px screen radius (Sun 14px, axis markers 5px), without changing their direction/position.

Default surfaces are original procedural MIT maps, not NASA/USGS imagery. Every bundled PNG is registered and SHA-256 verified in `assets/ASSET_MANIFEST.json`; regenerate with `npm run assets:generate`. There are 11 body ids × two resolutions. PNG total is about 1.22 MiB. Standard maps are 512×256 (11 RGBA base maps total 5.5 MiB; about 7.33 MiB with mipmaps if enabled), low-memory maps 128×64 (352 KiB total base level). Runtime generates equivalent deterministic data maps internally, so no network or PNG decode is needed. The bounded CPU cache holds at most those 22 map variants (~5.84 MiB raw); select low memory on constrained devices. No 4K data, external fonts or star catalogues are bundled.

`asset_resolver` is synchronous and returns a preloaded THREE.Texture, ImageBitmap or null; alternatively use `visuals.asset_map`. A thrown resolver or missing asset falls back to generated material. Caller-owned THREE.Textures are never disposed by the scene; wrappers and generated textures are disposed. Callers own ImageBitmap lifetime. The package never loads URLs; the host can preload audited local assets itself. Stars use one fixed seeded distribution in both renderers. Surface mapping, radii, light and labels are illustrative; authoritative ecliptic direction and distances remain in deterministic state.

Canvas mode is explicitly a 2D sky map, not a second 3D renderer. It uses the same camera snapshot to orient/scale its complete polar overview; radial compression separates bodies without altering azimuths. Surface shading uses the same generated pixel maps. Context loss and performance fallback retain moment, camera and selection. A host gesture controller survives replacement canvases; `canvasFactory` binds listeners to each new canvas.

## Accepted spatial boundary

A true fixed-origin perspective cannot show bodies behind the observer inside a 100° FOV. The approved product is a controlled local view, with stable overview cards for every supplied direction. The demo marks in-view, rotate/zoom-to-locate and outside-controlled-arc positions accurately. It does not claim that every direction is reachable inside the bounded camera. No hidden longitude remapping, observer translation or all-sky projection has been introduced.

## Verification

Run `npm test`, `node scripts/verify-picking.mjs` and `npm run verify:visuals`. Set `CELESTIAL_CHROMIUM_PATH` to the pinned Chromium 145 executable when matching local goldens. `evidence/visual-upgrade/verification.json` records browser, DPR, runtime hash, asset-manifest hash and screenshots of desktop landscape/portrait plus iPhone/Android portrait, both WebGL and forced Canvas. Device profiles are browser emulations, not physical hardware certification. Screenshot equality applies only within that exact local environment. Historical v0.1.0 recording proofs remain unchanged; preview renders intentionally differ. No production integration or cinematic quality claim is made.
