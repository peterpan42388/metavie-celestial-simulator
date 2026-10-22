# Earth-anchored observation — 0.3 preview

Independent MIT feature branch `codex/celestial-true-3d`, based on `a5e5aea`. Package **0.3.0-preview.1**, proposed minor version **0.3.0**. No merge, release tag, consumer pin or deployment is part of this work.

## Observation frame and physical rendering

Earth remains the coordinate origin. A procedural reference sphere of radius **2.4 illustrative world units** is centered at `[0,0,0]`. The camera is fixed at **`[0,2.85,0]`**, an illustrative altitude of **0.45** above it. These values are exported as immutable `observationFrame` from the observer export. They have no relation to real geography, surface location, orbital altitude, date or scale. The initial view looks horizontally outward; tilt down to reveal the actual sphere's curved limb. The atmosphere is a thin 3D shell, not a flat horizon photograph.

Only camera orientation and optical FOV change. There is no pan, translation, free flight or planet-spin-on-drag. Supplied celestial geometry remains geocentric: `direction(longitude,latitude,8+log1p(distance))` is unchanged. The elevated perspective introduces the corresponding illustrative parallax; it does not rewrite input longitude/latitude or re-compute ephemeris values. All world-space sphere positions, radii, scales and Saturn ring-plane transforms are invariant under viewport, camera, selection and zoom changes. Zooming changes projected physical size; screen-pixel minimum scaling has been removed.

Bodies are SphereGeometry Meshes with StandardMaterial, original illustrative colour textures, derived tangent-space normals and roughness maps. A key light, restrained ambient and a subtle rim make curvature readable. Saturn's RingGeometry stays in one world-space plane. Selection rims are separate 3D spheres; only the Sun's restrained corona is a sprite in the spatial scene. Glyph/name sprites are in a separate orthographic **UI overlay**, decluttered against projected physical footprints and HUD padding. No body is a billboard.

Earth is a non-selectable foreground reference and physical occluder. Bodies/labels behind its limb are not rendered through it or raycast-selected through it; all supplied records remain intact in `state`, and the example overview identifies below-limb directions. `projection` and `visibleBodyIds` agree with this illustrative Earth occlusion. This is spatial occlusion, not deletion or a new interpretation of supplied altitude. Disabled/inactive bodies otherwise keep the existing controlled selection rules. The generic Earth input exclusion remains unchanged: this reference mesh is not an invented supplied celestial record and never emits a selection id.

## Camera and input

Azimuth is normalized to **[-180°,180°)**, with continuous full-circle drag (360° per viewport width). Elevation clamps to **±70°** (140° per viewport height); FOV clamps to **18–110°**. Direct camera validation rejects nonfinite values or invalid elevation/FOV and normalizes finite azimuth. Gesture methods clamp their controlled ranges; arithmetic overflow rejects rather than corrupting state. Reset is exactly **0° yaw, 0° pitch, 70° FOV**, at the same fixed observation position. `setOptions` without `camera` preserves current orientation/FOV. Recording keyframes now use the short arc across the ±180° seam; use intermediate keyframes less than 180° apart for an intentional full turn.

`createGestureController` still receives CSS-local pointer samples from the host. Tap/move threshold is at least 8 CSS px. Drag, any multi-touch interaction and wheel during a pending pointer cancel selection on release. Wheel and pinch only zoom; no inertia, animation clock or rAF integration is added. The example provides keyboard-operable left/right/up/down/zoom/reset controls. Touch layout evidence is local Chromium emulation only.

## Required WebGL host contract

```js
import {createView, probeWebGL} from '@metavie/celestial-simulator/view';

// Optional preflight; host owns the probe canvas and its context lifecycle.
const capability = probeWebGL(probeCanvas);
// capability: {supported, mode:'webgl'|'unavailable', reason, version? ,detail?}

const view = createView(positions, {
  moment_id: 'moment_0',
  selection: {sun: 'pending', moon: 'discovered'},
  onSelect: ({id, state}) => inspectEnabledBody(id, state),
  visuals: {quality:'standard', labels:'symbols_and_names'},
}, {
  require_webgl: true,
  canvasFactory: () => makeFreshHostCanvas(),
  onMode: ({mode, reason, detail, canvas}) => {
    if (mode === 'webgl') mount(canvas);
    else showUnavailable({reason, detail});
  },
});
view.render(width, height);
```

`probeWebGL` takes a host-supplied canvas, tries WebGL2, checks context/version, catches creation errors, and returns `reason:'webgl-unavailable'` for unsupported/lost contexts. Use a separate fresh probe canvas; probing may create a context with default attributes. Release it when finished. A successful probe is not a guarantee against later loss or performance limits. It never reads DOM globals, hardware identifiers, storage or network data.

With **`require_webgl:true`**, `view.mode` / `view.status.mode` can only be **`webgl` or `unavailable`**. Initialization failure, draw failure, context loss and explicitly reported poor performance yield:

```js
{mode:'unavailable', reason:'webgl-unavailable', detail:'context-lost'}
```

Other details are `webgl2-unavailable`, `render-failure` or `performance`. `onMode` receives `canvas:null` when unavailable, so the host must branch before mounting. No 2D canvas is allocated or drawn. `selectAt` returns false, `hoverAt` null, and `visibleBodyIds` an empty list; camera/data snapshots remain available. Calls to `setOptions` or camera methods do not silently recover or downgrade. Recreate the view explicitly to retry. `render` returns the current status; the callback and `view.status` are the authoritative state interfaces, not an interactive “3D” switch.

For API compatibility, **omitting** `require_webgl` retains the old Canvas fallback for tests/non-product use. Existing public imports are retained. The product-style example `examples/true-3d.html` always requires WebGL; `?force_unavailable` exercises the unavailable host state. It contains no 2D/3D selector. Older `exploration.html` remains explicitly a legacy mixed-renderer example.

## Asset and licence boundary

All surfaces, normal/roughness derivation, star shell, Earth anchor, atmosphere, selection geometry and glyph atlas are original MIT illustrative work. No NASA/USGS pixels or scientific geography claims. The current `visual_pack.v2` manifest lists 22 colour PNGs (512/128 widths) plus hashed procedural sources; normal/roughness maps are derived locally and require no download. Maps are linearly filtered with mipmaps for stable enlarged/oblique views. Low-memory mode uses 128×64 colour and 64×32 derived detail; standard mode uses 512×256 colour and 256×128 detail. Only fixed world-space mesh tessellation changes with quality, never camera-driven body scaling. Caller-owned injected textures remain caller-owned.

No dependencies were added. The public scene/contracts/recording code contains no DOM globals, random placement, clock, network, user records or persistence. The example alone owns browser events and display copy. Corresponding evidence uses synthetic geometry only.

## Local acceptance and evidence

The user explicitly removed the actual-iPhone/Safari requirement and requested local-browser validation. No Safari or real-phone evidence is required or claimed for this handoff. `npm test` covers coordinate/selection/provenance/MIT isolation, world matrices, the elevated fixed observer, Earth occlusion, normal/roughness generation, camera bounds/wrap, capability/unavailable transitions, legacy fallback and gesture suppression. `npm run verify:true-3d` checks the real local WebGL host, tap/drag/wheel, simulated multi-pointer pinch, complete toolbar bounds, moment preservation, actual context loss, no-Canvas unavailable state and repeated pixels in the pinned environment.

`evidence/true-3d/` contains desktop and mobile-layout-emulation initial, rotated, close-Saturn, opposite-azimuth and Earth-horizon screenshots, plus forced-unavailable. `verification.json` records the actual browser/OS, source commit, runtime and asset-manifest hashes, world-transform comparisons and interaction results. Screen pixels are only compared inside that exact local environment; source state/geometry assertions remain independent of device pixels. No production changes or deployment request.
