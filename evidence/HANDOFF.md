# C3 / C5 local handoff

C3 core is implemented; C5 local synthetic recording proof passes. Existing host worker/encoder integration remains for the consumer owner. Source and proof use `celestial_positions.v1`, `cosmos_shot.v1`, `cosmos_provenance.v1`. Moment ids are opaque; the host maps discrete datasets. Ring sectors and selection ids are external; no product mapping is embedded.

Public source: https://github.com/peterpan42388/metavie-celestial-simulator
Branch: `codex/celestial-core`. Worktree: sibling directory `metavie-celestial-simulator-worktree` of the independent repository. No service dependency or production changes.

Import `recordFrames` from the recording export. Each awaited sink call provides frame index, microsecond timestamp/duration and deterministic state. Render that state with `createRenderer`, then pass the supplied canvas to the host's existing encoder. The local CLI supplies a separate FFmpeg proof path; it does not import any host application. Reject arbitrary source payloads before beginning any recording. Allowlisted fixture selection happens inside the adapter; callers cannot supply positions.

`createView` replaces canvases for initialization failure, context loss and reported slow frames. Host `canvasFactory(mode)` must return a fresh canvas and mount it; retain supplied options/selection when creating the view. Call `dispose` when leaving.

See verification.json for tests, encoding details and exact repeat-frame evidence. MP4s are 12-frame/0.4-second smoke proofs, not final video materials. Scene changes after the proof source commit require regenerating goldens. Product-specific privacy, ring mapping, selection/settlement and real mobile device acceptance belong to consumer integration.
