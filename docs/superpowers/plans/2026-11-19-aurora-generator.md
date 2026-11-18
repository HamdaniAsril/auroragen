# Auroragen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A public, static web studio that renders realistic aurora borealis scenes on the GPU and exports them as still images (PNG/JPG/WebP, up to 8K).

**Architecture:** A pure TypeScript scene model (types, ranges, clamping, codec) feeds a WebGL2 renderer. The renderer has three passes: an HDR scene pass ported from the approved prototype, a bloom chain, and a composite/tonemap pass. It can render the full frame or one tile of a larger image. A zustand store holds the scene, history and playback. React renders a three-column studio (library, preview, inspector) that becomes a bottom-sheet layout below 768 px. Export renders tiles offscreen and encodes them in the browser.

**Tech Stack:** Node ≥ 20, Vite (react-ts template), React, TypeScript (strict), zustand, lz-string, @jsquash/webp (lazy-loaded), Vitest + @testing-library/react + jsdom, Playwright (Chromium with SwiftShader for WebGL tests). Install the current stable version of each.

**Spec:** `docs/superpowers/specs/2026-11-19-aurora-generator-design.md` (Indonesian). Visual baseline: `docs/superpowers/specs/prototypes/aurora-3d-prototype.html`.

## Global Constraints

- Everything renders in the visitor's browser with **WebGL2**. No server or backend, and the build is static hosting. If WebGL2 is missing, show a clear message.
- Targets: latest Chrome, Safari, Firefox and Edge, on desktop and phone.
- UI languages: **Indonesian and English**, following the browser language, with a toggle. All user-facing copy goes through i18n.
- **Dark theme only.** Do not reuse Wayglim names, branding or presets.
- 1–4 aurora layers. Aurora types: `tirai`, `busur`, `korona`, `pilar`, `pusaran`.
- Seeds are integers **1–9999**. The aurora seed and the land seed are separate.
- Camera: pitch **−10° to 90°**, yaw **−180° to 180°**. Lens **12–50 mm full-frame equivalent, measured on the frame diagonal** (43.267 mm).
- Export formats **PNG, JPG, WebP**. Size presets: 1920×1080, 2560×1440, 3840×2160, 5120×2880, 3440×1440, 1290×2796, 1440×3200, 2048×2048, 2560×1280. Custom sizes have a **long side of at most 7680** and a minimum of 256 on each side.
- The preview lowers its internal resolution when fps drops below **~30**. After pausing or when idle, it re-renders sharp. With `prefers-reduced-motion`, it starts paused.
- Mobile layout below **768 px** width.
- The share link carries the whole scene **including frame aspect**, but **not** pixel size. Picking a preset never changes the frame aspect.
- State format and renderer each carry a version number. Old links must always open; their look may change slightly.
- The final look must be at least as realistic as the prototype. Exports match the preview in composition, shape, colour and element placement.
- Commit after every task. `.superpowers/` is git-ignored.

## Review Focus

1. **Portrait phone wallpaper (9:16, e.g. 1290×2796):** the export must have the same framing as the preview, without stretching. Test: Task 12, "portrait export matches preview framing".
2. **A link made at 16:9 on desktop and opened on a phone:** it restores the same frame aspect, camera and shapes. Test: Task 14, "link restores frame aspect and camera".
3. **An export size above the device's canvas limit (iPhone ≈ 16.7 MP):** the size is disabled with a reason, and there is no crash or blank file. Test: Task 12, "oversized export is refused with a reason".
4. **WebGL context lost** (mobile tab backgrounded, GPU reset): the preview renders again with the same scene. Test: Task 6, "renders again after context loss".
5. **Corrupted, hand-edited or future-version link or saved data, or blocked localStorage:** the app opens the default scene with a notice, never a blank screen. Tests: Task 2 (decode), Task 13 (saved), Task 14 (link).

---

## File Structure

```
index.html, harness.html             app entry; WebGL test harness entry (dev only)
vite.config.ts, playwright.config.ts, tsconfig*.json, package.json, .gitignore
src/main.tsx, src/App.tsx             app bootstrap, WebGL2 gate, layout switch
src/scene/types.ts                    Scene model types
src/scene/ranges.ts                   numeric min/max/step per field
src/scene/palettes.ts                 palette colours
src/scene/defaults.ts                 defaultScene(), defaultLayer()
src/scene/clamp.ts                    clampScene(unknown): Scene
src/scene/codec.ts                    encodeScene / decodeScene / migrate
src/scene/random.ts                   randomSeed(), randomizeScene()
src/render/camera.ts                  lens/FOV math, drag/wheel/pinch mapping
src/render/uniforms.ts                sceneToUniforms()
src/render/shaders/*.glsl             fullscreen.vert, scene.frag, bloom.frag, composite.frag
src/render/gl.ts                      program/target helpers
src/render/Renderer.ts                three-pass renderer, tiles, context loss
src/render/adaptive.ts                AdaptiveScaler
src/render/PreviewLoop.ts             rAF loop, live clock, refine-on-idle
src/harness/main.ts                   window.harness for Playwright
src/state/history.ts                  pure undo/redo history
src/state/store.ts                    zustand studio store
src/state/saved.ts                    localStorage saved scenes
src/state/urlSync.ts                  hash read/write
src/i18n/strings.ts, src/i18n/useT.ts translations, detection, hook
src/presets/presets.ts                curated presets, filterPresets()
src/presets/thumbnails.ts             lazy thumbnail renderer
src/export/sizes.ts                   size presets, aspect, device limits
src/export/tiles.ts                   planTiles()
src/export/encode.ts                  encodeCanvas() with WebP fallback
src/export/exportImage.ts             tiled export orchestration
src/export/naming.ts                  exportFilename(), cssSnippet()
src/ui/styles.css                     tokens and layout (dark)
src/ui/TopBar.tsx, Preview.tsx, PlayBar.tsx, LibraryPanel.tsx, Inspector.tsx, ExportDialog.tsx, MobileSheet.tsx, Toast.tsx, Unsupported.tsx
src/ui/controls/SliderRow.tsx, SeedRow.tsx, ColorRow.tsx, VisualPicker.tsx, Section.tsx, InfoTip.tsx, Toggle.tsx
src/ui/sections/FrameSection.tsx, AuroraSection.tsx, LayerEditor.tsx, SkySection.tsx, LandSection.tsx, CameraSection.tsx, EffectsSection.tsx
e2e/helpers.ts, e2e/*.spec.ts         Playwright tests
```

Unit tests sit next to their source as `*.test.ts(x)`.

---

### Task 1: Project scaffold and scene model

**Files:**
- Create: the Vite react-ts scaffold at the repo root, `.gitignore` (add `.superpowers/`, `test-results/`, `playwright-report/`), and `src/scene/{types,ranges,palettes,defaults,clamp}.ts`
- Test: `src/scene/clamp.test.ts`

**Interfaces:**
- Produces:

```ts
export type AuroraType = 'tirai' | 'busur' | 'korona' | 'pilar' | 'pusaran';
export type LandType = 'none' | 'mountains' | 'hills' | 'pines';
export type PaletteId = 'classic-green' | 'green-violet' | 'rare-red' | 'pink-violet' | 'ice-blue' | 'custom';
export type Hex = string; // '#RRGGBB'
export interface AuroraLayer {
  type: AuroraType; seed: number; distance: number; azimuth: number; length: number;
  foldAmount: number; foldDensity: number; baseAltitude: number; rayHeight: number;
  rayDensity: number; rayContrast: number; brightness: number; speed: number;
  palette: PaletteId; colors: { bottom: Hex; body: Hex; top: Hex }; fringe: boolean;
}
export interface Sky { zenith: Hex; horizon: Hex; starDensity: number; starBrightness: number; auroraGlow: number;
  moon: { enabled: boolean; azimuth: number; elevation: number; brightness: number } }
export interface Land { type: LandType; seed: number; height: number; roughness: number; color: Hex;
  water: { enabled: boolean; ripple: number; reflection: number } }
export interface Camera { pitch: number; yaw: number; lens: number }
export interface Effects { exposure: number; bloom: number; saturation: number; grain: number; vignette: number }
export interface Frame { aspectW: number; aspectH: number }
export interface Scene { v: number; renderer: number; time: number; frame: Frame; layers: AuroraLayer[];
  sky: Sky; land: Land; camera: Camera; effects: Effects }
export const SCENE_VERSION = 1; export const RENDERER_VERSION = 1; export const MAX_LAYERS = 4;
```

- `RANGES` in `ranges.ts`: `{ min, max, step }` keyed by dotted path. Values:

| Field | min | max | step |
|---|---|---|---|
| `layer.seed`, `land.seed` | 1 | 9999 | 1 |
| `layer.distance` | 0.2 | 8 | 0.05 |
| `layer.azimuth`, `sky.moon.azimuth`, `camera.yaw` | −180 | 180 | 1 |
| `layer.length`, `layer.foldAmount`, `layer.foldDensity`, `layer.rayHeight`, `layer.rayDensity`, `layer.rayContrast`, `sky.starDensity`, `sky.starBrightness`, `sky.auroraGlow`, `sky.moon.brightness`, `land.height`, `land.roughness`, `land.water.ripple`, `land.water.reflection`, `effects.bloom`, `effects.grain`, `effects.vignette` | 0 | 1 | 0.01 |
| `layer.baseAltitude` | 0.8 | 1.4 | 0.01 |
| `layer.brightness`, `layer.speed`, `effects.saturation` | 0 | 2 | 0.01 |
| `sky.moon.elevation` | 0 | 60 | 1 |
| `camera.pitch` | −10 | 90 | 1 |
| `camera.lens` | 12 | 50 | 1 |
| `effects.exposure` | −2 | 2 | 0.05 |
| `time` | 0 | 600 | 0.01 |

- `PALETTES: Record<Exclude<PaletteId,'custom'>, {bottom,body,top}>`:
  - classic-green: `#38FF73` / `#1ACC9E` / `#CC2980`
  - green-violet: `#3DFF8A` / `#2EC4B6` / `#8A4DFF`
  - rare-red: `#7CFF6B` / `#FF5A4D` / `#B3122E`
  - pink-violet: `#FF6FB5` / `#C86BFF` / `#5B3DFF`
  - ice-blue: `#7FF5FF` / `#3DA9FF` / `#5B4DFF`
  - `FRINGE = '#FF4D9E'`
- `defaultLayer(type?: AuroraType): AuroraLayer` and `defaultScene(): Scene`. The default scene mirrors the prototype's opening view:
  - one `tirai` layer, seed 1207, classic-green;
  - land `mountains`, seed 7205, water on;
  - camera pitch 14, yaw 0, lens 17;
  - frame 16:9, time 30.
- `clampScene(input: unknown): Scene`:
  - Never throws.
  - Fills missing fields from the defaults and clamps numbers to `RANGES`. Seeds are rounded to integers.
  - Invalid enum values and invalid hex values fall back to the default.
  - Keeps 1–4 layers. An empty array becomes `[defaultLayer()]`.
  - Frame: each aspect term is an integer from 1 to 10000. Anything else becomes 16:9.

- [ ] **Step 1: Scaffold and dependencies**

Run `npm create vite@latest . -- --template react-ts`, then `npm i zustand lz-string @jsquash/webp`, then `npm i -D vitest jsdom @testing-library/react @testing-library/user-event @playwright/test`. Add the scripts `"test": "vitest run"`, `"e2e": "playwright test"` and `"typecheck": "tsc -b --noEmit"`. Set Vitest `environment: 'jsdom'` in `vite.config.ts`. Run `git init`.

- [ ] **Step 2: Write the failing test** in `src/scene/clamp.test.ts`

```ts
test('default scene is already valid', () => expect(clampScene(defaultScene())).toEqual(defaultScene()));
test('fills missing fields', () => expect(clampScene({ camera: { pitch: 20 } }).land).toEqual(defaultScene().land));
test('clamps and rounds numbers', () => {
  const s = clampScene({ camera: { pitch: 400, yaw: -999, lens: 3 }, layers: [{ seed: 12345.7 }] });
  expect(s.camera).toEqual({ pitch: 90, yaw: -180, lens: 12 });
  expect(s.layers[0].seed).toBe(9999);
});
test('caps layers at 4 and never returns zero layers', () => {
  expect(clampScene({ layers: Array(7).fill({}) }).layers).toHaveLength(4);
  expect(clampScene({ layers: [] }).layers).toHaveLength(1);
});
test('rejects bad enums, hex and frame', () => {
  const s = clampScene({ layers: [{ type: 'laser', colors: { bottom: 'red' } }], land: { type: 'ocean' }, frame: { aspectW: -1, aspectH: 0 } });
  expect(s.layers[0].type).toBe('tirai'); expect(s.layers[0].colors.bottom).toBe('#38FF73');
  expect(s.land.type).toBe('mountains'); expect(s.frame).toEqual({ aspectW: 16, aspectH: 9 });
});
test('never throws on garbage', () => { for (const g of [null, 42, 'x', [], { layers: 'no' }]) expect(() => clampScene(g)).not.toThrow(); });
```

- [ ] **Step 3: Run it and confirm it fails.** Run `npm test -- src/scene/clamp.test.ts`. Expected: FAIL (module not found).
- [ ] **Step 4: Implement** `types.ts`, `ranges.ts`, `palettes.ts`, `defaults.ts` and `clamp.ts` as specified above.
- [ ] **Step 5: Run it and confirm it passes.** Expected: PASS.
- [ ] **Step 6: Commit.** `git add -A && git commit -m "feat: scaffold app and scene model"`

---

### Task 2: Scene codec and versioning

**Files:**
- Create: `src/scene/codec.ts`
- Test: `src/scene/codec.test.ts`

**Interfaces:**
- Consumes: `Scene`, `clampScene`, `SCENE_VERSION`, `RENDERER_VERSION` (Task 1)
- Produces:
  - `encodeScene(scene: Scene): string` returns `'1.' + lz.compressToEncodedURIComponent(JSON.stringify(scene))`. The number before the dot is `scene.v`.
  - `decodeScene(s: string): Scene | null` parses the prefix, runs `migrate`, then `clampScene`. It returns `null` on any failure.
  - `migrate(raw: unknown, fromVersion: number): unknown | null` is the identity for version 1 and returns `null` for any version above `SCENE_VERSION` or below 1.

- [ ] **Step 1: Write the failing test**

```ts
test('round-trips the default scene', () => expect(decodeScene(encodeScene(defaultScene()))).toEqual(defaultScene()));
test('keeps frame aspect and renderer version', () => {
  const s = { ...defaultScene(), frame: { aspectW: 9, aspectH: 16 } };
  const d = decodeScene(encodeScene(s))!; expect(d.frame).toEqual({ aspectW: 9, aspectH: 16 }); expect(d.renderer).toBe(RENDERER_VERSION);
});
test('link stays short', () => expect(encodeScene(defaultScene()).length).toBeLessThan(1500));
test('rejects garbage and future versions', () => {
  for (const g of ['', 'abc', '1.%%%', '1.' + 'A'.repeat(50)]) expect(decodeScene(g)).toBeNull();
  expect(decodeScene('99.' + encodeScene(defaultScene()).slice(2))).toBeNull();
});
test('clamps hand-edited values', () => {
  const raw = { ...defaultScene(), camera: { pitch: 300, yaw: 0, lens: 17 } };
  const enc = '1.' + compressToEncodedURIComponent(JSON.stringify(raw));
  expect(decodeScene(enc)!.camera.pitch).toBe(90);
});
```

- [ ] **Step 2: Run it and confirm it fails.** Run `npm test -- src/scene/codec.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement `codec.ts`.**
- [ ] **Step 4: Run it and confirm it passes.**
- [ ] **Step 5: Commit.** `feat: scene codec with versioning`

---

### Task 3: Camera math

**Files:**
- Create: `src/render/camera.ts`
- Test: `src/render/camera.test.ts`

**Interfaces:**
- Consumes: `Camera`, `RANGES` (Task 1)
- Produces:
  - `fovFromLens(lensMm: number, aspect: number): { tanHalfX: number; tanHalfY: number }`. Use `tanHalfDiag = 21.6335 / lensMm`, `tanHalfX = tanHalfDiag * aspect / √(aspect²+1)`, `tanHalfY = tanHalfDiag / √(aspect²+1)`.
  - `dragCamera(cam: Camera, dxPx: number, dyPx: number, viewW: number, viewH: number): Camera`. It works like grabbing the sky: dragging right lowers yaw, dragging down raises pitch. The rate is the view's degrees per pixel. Yaw wraps into [−180, 180) and pitch clamps to [−10, 90]. Use `aspect = viewW / viewH`.
  - `wheelLens(lens: number, deltaY: number): number` returns `clamp(lens * Math.exp(-deltaY * 0.001), 12, 50)`. Scrolling up zooms in.
  - `pinchLens(startLens: number, startDist: number, dist: number): number` returns `clamp(startLens * dist / startDist, 12, 50)`.

- [ ] **Step 1: Write the failing test**

```ts
test('landscape and portrait share the diagonal field of view', () => {
  const a = fovFromLens(17, 16 / 9), b = fovFromLens(17, 9 / 16);
  expect(Math.hypot(a.tanHalfX, a.tanHalfY)).toBeCloseTo(Math.hypot(b.tanHalfX, b.tanHalfY), 6);
  expect(a.tanHalfX).toBeCloseTo(b.tanHalfY, 6); expect(a.tanHalfX).toBeCloseTo(1.109, 2);
});
test('drag right turns left, drag down looks up', () => {
  const c = dragCamera({ pitch: 14, yaw: 0, lens: 17 }, 100, 50, 1600, 900);
  expect(c.yaw).toBeLessThan(0); expect(c.pitch).toBeGreaterThan(14);
});
test('yaw wraps, pitch clamps', () => {
  expect(dragCamera({ pitch: 89, yaw: -179, lens: 17 }, 400, 900, 1600, 900).pitch).toBe(90);
  const y = dragCamera({ pitch: 0, yaw: -179, lens: 17 }, 200, 0, 1600, 900).yaw;
  expect(y).toBeGreaterThanOrEqual(-180); expect(y).toBeLessThan(180);
});
test('wheel and pinch stay inside 12–50 mm', () => {
  expect(wheelLens(17, -100)).toBeGreaterThan(17); expect(wheelLens(50, -1e5)).toBe(50); expect(pinchLens(17, 100, 1)).toBe(12);
});
```

- [ ] **Step 2: Run it and confirm it fails.** Run `npm test -- src/render/camera.test.ts`.
- [ ] **Step 3: Implement `camera.ts`.**
- [ ] **Step 4: Run it and confirm it passes.**
- [ ] **Step 5: Commit.** `feat: diagonal lens camera math`

---

### Task 4: Uniform packing

**Files:**
- Create: `src/render/uniforms.ts`
- Test: `src/render/uniforms.test.ts`

**Interfaces:**
- Consumes: `Scene` (Task 1), `fovFromLens` (Task 3)
- Produces: `sceneToUniforms(scene: Scene, time: number, aspect: number): Uniforms`, where:

```ts
interface Uniforms {
  uTime: number; uLayerCount: number;
  uLayerType: Int32Array;    // 4; tirai=0 busur=1 korona=2 pilar=3 pusaran=4
  uLayerSeed: Float32Array;  // 4; fract(seed * 0.6180339)
  uLayerGeom: Float32Array;  // 16; vec4(distance, azimuthRad, foldAmount, foldDensity)
  uLayerRays: Float32Array;  // 16; vec4(baseAltitude, rayHeight, rayDensity, rayContrast)
  uLayerMisc: Float32Array;  // 16; vec4(brightness, length, speed, fringe ? 1 : 0)
  uLayerColBottom: Float32Array; uLayerColBody: Float32Array; uLayerColTop: Float32Array; // 12 each; linear RGB
  uSkyZenith: [number, number, number]; uSkyHorizon: [number, number, number];
  uStars: [number, number]; uAuroraGlow: number;          // density, brightness
  uMoon: [number, number, number, number];                // enabled, azimuthRad, elevationRad, brightness
  uLand: [number, number, number, number];                // type 0 none 1 mountains 2 hills 3 pines, fract(seed*0.7548777), height, roughness
  uLandColor: [number, number, number];
  uWater: [number, number, number];                       // enabled, ripple, reflection
  uCam: [number, number, number, number];                 // pitchRad, yawRad, tanHalfX, tanHalfY
  uFx: [number, number, number, number, number];          // exposureEV, bloom, saturation, grain, vignette
}
```

Hex colours convert to linear light (sRGB → linear). Slots for unused layers are all zeros.

- [ ] **Step 1: Write the failing test**

```ts
test('packs one layer and zeroes the rest', () => {
  const u = sceneToUniforms(defaultScene(), 30, 16 / 9);
  expect(u.uLayerCount).toBe(1); expect(u.uLayerType[0]).toBe(0);
  expect(Array.from(u.uLayerMisc.slice(4))).toEqual(Array(12).fill(0));
});
test('aurora seed and land seed are independent', () => {
  const a = sceneToUniforms(defaultScene(), 0, 1), s = defaultScene(); s.land.seed = 42;
  const b = sceneToUniforms(s, 0, 1);
  expect(b.uLayerSeed[0]).toBe(a.uLayerSeed[0]); expect(b.uLand[1]).not.toBe(a.uLand[1]);
});
test('converts hex to linear light', () => {
  const s = defaultScene(); s.layers[0].colors.bottom = '#FFFFFF';
  expect(Array.from(sceneToUniforms(s, 0, 1).uLayerColBottom.slice(0, 3))).toEqual([1, 1, 1]);
  s.layers[0].colors.bottom = '#808080';
  expect(sceneToUniforms(s, 0, 1).uLayerColBottom[0]).toBeCloseTo(0.2159, 3);
});
test('camera uses diagonal lens', () => expect(sceneToUniforms(defaultScene(), 0, 16 / 9).uCam[2]).toBeCloseTo(1.109, 2));
```

- [ ] **Step 2: Run it and confirm it fails.** Run `npm test -- src/render/uniforms.test.ts`.
- [ ] **Step 3: Implement `uniforms.ts`.**
- [ ] **Step 4: Run it and confirm it passes.**
- [ ] **Step 5: Commit.** `feat: scene to shader uniforms`

---

### Task 5: Renderer core and WebGL test harness

Port the prototype into a real renderer: the default scene only (one layer, mountains and water), plus the composite pass. Bloom and the remaining features come in Task 6.

**Files:**
- Create: `src/render/gl.ts`, `src/render/Renderer.ts`, `src/render/shaders/{fullscreen.vert,scene.frag,composite.frag}.glsl` (imported with `?raw`), `harness.html`, `src/harness/main.ts`, `playwright.config.ts`, `e2e/helpers.ts`, `e2e/render.spec.ts`
- Modify: `vite.config.ts` (add `harness.html` as a second input, dev only)

**Interfaces:**
- Consumes: `sceneToUniforms` (Task 4), `Scene`
- Produces:

```ts
export type Quality = 'preview' | 'refine' | 'export';
export interface RenderTarget { width: number; height: number; tile?: { x: number; y: number; w: number; h: number } }
export class Renderer {
  constructor(canvas: HTMLCanvasElement);            // throws RendererUnsupportedError if no WebGL2
  render(scene: Scene, time: number, target: RenderTarget, quality: Quality): void; // draws to the canvas
  readPixels(): Uint8Array;                           // RGBA, top-to-bottom rows
  onRestored(cb: () => void): () => void;             // fires after webglcontextrestored and a rebuild
  dispose(): void;
}
export class RendererUnsupportedError extends Error {}
// harness (window.harness): render(sceneJson: string, time: number, w: number, h: number, q: Quality): Promise<number[]>; loseContext(): void; restoreContext(): void
// e2e/helpers.ts: renderPixels(page, scene, time, w, h, q), meanLuma(px, w, h, rect?), meanAbsDiff(a, b), downsample2x(px, w, h)
```

- Scene pass: port `aurora()`, `curtain()`, `emission()`, `sky()`, `stars()` and the water/mountain logic from the prototype into `scene.frag`. Read every parameter from the Task 4 uniforms instead of constants. Output **linear HDR** into an RGBA16F target. Use `EXT_color_buffer_float` when available and fall back to RGBA8 with values pre-scaled ×0.25.
- Composite pass: multiply by `2^exposure`, apply the prototype tonemap `1 − exp(−c·1.9)`, then saturation, vignette and grain, then `pow(c, 0.92)`.
- Tiles: map `gl_FragCoord.xy + tileOrigin` into full-image coordinates through `uFullRes`/`uTileOrigin`, so a tile is pixel-identical to the same region of a full render. Grain hashes full-image coordinates.
- Quality controls the march steps and per-pixel jitter. `export` uses no jitter and more steps, enough to show no banding. `preview` matches the prototype.
- Stars keep the same angular size at any resolution.
- Playwright: Chromium only, launched with `--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`. `webServer` runs `npm run dev -- --port 5199`. Test timeout 90 s. Keep renders at 320×180 or smaller.

- [ ] **Step 1: Write the failing e2e test** in `e2e/render.spec.ts`

```ts
test('default scene draws green aurora above a dark lake', async ({ page }) => {
  const px = await renderPixels(page, defaultScene(), 30, 320, 180, 'export');
  const sky = channelMeans(px, 320, 180, { x: 0, y: 20, w: 320, h: 60 });
  expect(sky.g).toBeGreaterThan(sky.r); expect(sky.g).toBeGreaterThan(20);
  expect(meanLuma(px, 320, 180, { x: 0, y: 170, w: 320, h: 10 })).toBeLessThan(sky.luma);
});
test('same scene and time give the same pixels', async ({ page }) => {
  const a = await renderPixels(page, defaultScene(), 30, 160, 90, 'export');
  const b = await renderPixels(page, defaultScene(), 30, 160, 90, 'export');
  expect(meanAbsDiff(a, b)).toBe(0);
});
test('a tile equals the same region of the full frame', async ({ page }) => {
  // harness.renderTile(sceneJson, t, fullW, fullH, tile) returns tile pixels
  const full = await renderPixels(page, defaultScene(), 30, 256, 144, 'export');
  const tile = await renderTile(page, defaultScene(), 30, 256, 144, { x: 128, y: 0, w: 128, h: 72 });
  expect(meanAbsDiff(tile, crop(full, 256, 144, { x: 128, y: 0, w: 128, h: 72 }))).toBeLessThan(1);
});
```

`channelMeans`, `crop` and `renderTile` also go in `e2e/helpers.ts`, and the harness exposes `renderTile`.

- [ ] **Step 2: Run it and confirm it fails.** Run `npx playwright install chromium && npm run e2e -- e2e/render.spec.ts`. Expected: FAIL (harness missing).
- [ ] **Step 3: Implement** `gl.ts`, the shaders, `Renderer.ts`, the harness and the Playwright config as specified.
- [ ] **Step 4: Run it and confirm it passes.** Then open `harness.html?view=1` and compare it side by side with `docs/superpowers/specs/prototypes/aurora-3d-prototype.html`. It should be at least as realistic.
- [ ] **Step 5: Commit.** `feat: webgl2 renderer core ported from prototype`

---

### Task 6: Full scene rendering: layers, types, land, moon, bloom, context loss

**Files:**
- Modify: `src/render/shaders/scene.frag.glsl`, `src/render/Renderer.ts`
- Create: `src/render/shaders/bloom.frag.glsl`
- Test: `e2e/scene.spec.ts`

**Interfaces:**
- Consumes: Task 5's `Renderer` and harness.
- Produces: no new API.
  - Renderer also accepts `render(..., { bloomSource?: 'self' | WebGLTexture })` internally. For tiles, Task 12 supplies bloom computed from a low-res full frame. Expose `renderBloomSource(scene, time, longSide = 1024): void` and use it in `render()` whenever `target.tile` is set.

- Layers: loop over `uLayerCount` (at most 4) and sum each layer's emission. Map per-layer params:
  - `distance` and `azimuth` place the curtain's centreline.
  - `length` masks it along its length.
  - `foldAmount` and `foldDensity` scale the prototype's fold sine/fbm amplitude and frequency.
  - `baseAltitude` is H0, `rayHeight` scales `hgt`, `rayDensity` scales `rayFreq`, and `rayContrast` is `contrast`.
  - `brightness` multiplies emission, and `speed` multiplies time for that layer.
  - Colour comes from the three layer colours; the fringe uses `FRINGE` and is gated by `fringe`.
- Types keep the prototype's curtain shapes (tirai/busur/korona/pilar/pusaran).
- Land:
  - `none` means a flat horizon.
  - `mountains` uses the prototype's ridge.
  - `hills` is a smooth low ridge.
  - `pines` is a low ridge with a jagged treeline of narrow triangles.
  - `height` scales the ridge and `roughness` scales its high-frequency noise.
  - Water obeys `uWater`: off means dark ground below the horizon; `ripple` scales the distortion; `reflection` scales the Fresnel mix.
- Sky: zenith/horizon colours and the star uniforms. The moon is a soft disc at azimuth/elevation with a glow that brightens the sky by `brightness`. `auroraGlow` scales how much aurora light tints the sky.
- Bloom: threshold, then downsample/blur (a 4–5 level chain), added in composite by `effects.bloom`.
- Context loss: `preventDefault` on `webglcontextlost`; rebuild programs and targets on `webglcontextrestored`, then call the `onRestored` callbacks.

- [ ] **Step 1: Write the failing e2e tests**

```ts
test('two layers are brighter than one', async ({ page }) => { /* scene with layers [L, L2]: meanLuma(sky) > one-layer meanLuma(sky) */ });
test('each aurora type renders something different', async ({ page }) => {
  // render all 5 types at 160x90; every pair has meanAbsDiff > 2
});
test('land type changes the horizon', async ({ page }) => { /* 'none' vs 'mountains': meanAbsDiff over rows 90–120 of 160x160 > 2 */ });
test('water off removes the reflection', async ({ page }) => { /* lower 20% meanLuma with water on > with water off */ });
test('moon brightens the sky near it', async ({ page }) => { /* moon at yaw 0, elevation 20: luma around its pixel rises */ });
test('bloom spreads light', async ({ page }) => { /* effects.bloom 1 vs 0: luma just above the curtain rises */ });
test('renders again after context loss', async ({ page }) => {
  const before = await renderPixels(page, defaultScene(), 30, 160, 90, 'export');
  await page.evaluate(() => window.harness.loseContext()); await page.evaluate(() => window.harness.restoreContext());
  const after = await renderPixels(page, defaultScene(), 30, 160, 90, 'export');
  expect(meanAbsDiff(before, after)).toBe(0);
});
```

Write each test body fully, using the helpers and the thresholds shown in the comments.

- [ ] **Step 2: Run them and confirm they fail.** Run `npm run e2e -- e2e/scene.spec.ts`.
- [ ] **Step 3: Implement the shader and renderer changes.**
- [ ] **Step 4: Run them and confirm they pass,** and re-run `e2e/render.spec.ts`.
- [ ] **Step 5: Commit.** `feat: layers, aurora types, land, moon, bloom, context restore`

---

### Task 7: Adaptive preview loop

**Files:**
- Create: `src/render/adaptive.ts`, `src/render/PreviewLoop.ts`
- Test: `src/render/adaptive.test.ts`, `src/render/PreviewLoop.test.ts`

**Interfaces:**
- Consumes: `Renderer` (Tasks 5–6)
- Produces:
  - `class AdaptiveScaler { constructor(o?: { min?: number; max?: number }); sample(frameMs: number): number }`.
    - Keep an EMA of frame time (α 0.2) and start the scale at 1.
    - When the EMA is above 1000/30, multiply by 0.85, down to a minimum of 0.35.
    - When the EMA is below 1000/50, multiply by 1.1, up to a maximum of 1.
  - `class PreviewLoop { constructor(r: Pick<Renderer,'render'>, getScene: () => Scene, opts: { now?: () => number; raf?: (cb: FrameRequestCallback) => number; caf?: (id: number) => void }); start(): void; stop(): void; setPlaying(p: boolean): void; setSpeed(x: number): void; get liveTime(): number; seek(t: number): void; invalidate(): void; setView(w: number, h: number): void }`.
    - While playing, `liveTime` advances by dt × speed and never goes through the store.
    - Each frame renders at `AdaptiveScaler` scale with quality `preview`.
    - When paused, or 250 ms after the last `invalidate()` with nothing playing, render once at scale 1 with quality `refine`.

- [ ] **Step 1: Write the failing tests**

```ts
test('scale drops under slow frames and recovers', () => {
  const s = new AdaptiveScaler(); let v = 1; for (let i = 0; i < 40; i++) v = s.sample(60);
  expect(v).toBeCloseTo(0.35, 2); for (let i = 0; i < 80; i++) v = s.sample(10); expect(v).toBe(1);
});
test('paused loop refines once after idle', () => {
  // fake raf/now; setPlaying(false); invalidate(); advance 300 ms; render called with quality 'refine' at scale 1 exactly once
});
test('playing advances liveTime by speed', () => { /* speed 2, 1000 ms of frames → liveTime += ~2 */ });
```

- [ ] **Step 2: Run them and confirm they fail.**
- [ ] **Step 3: Implement both classes.**
- [ ] **Step 4: Run them and confirm they pass.**
- [ ] **Step 5: Commit.** `feat: adaptive preview loop`

---

### Task 8: Studio store, history and randomize

**Files:**
- Create: `src/state/history.ts`, `src/state/store.ts`, `src/scene/random.ts`
- Test: `src/state/history.test.ts`, `src/state/store.test.ts`

**Interfaces:**
- Consumes: Task 1 model, `clampScene`
- Produces:
  - `history.ts`: `interface History { past: Scene[]; future: Scene[]; lastKey?: string; lastAt?: number }`, `record(h: History, prev: Scene, key: string | undefined, now: number): History`. Changes with the same key within 600 ms coalesce into one step. History is capped at 100.
  - `random.ts`: `randomSeed(rand = Math.random): number` returns 1–9999. `randomizeScene(s: Scene, rand?): Scene` gives every layer a new seed and a random non-custom palette, and gives the land a new seed and type. It keeps frame, camera, effects, sky and time.
  - `store.ts`: `createStudioStore(initial?: Scene)` (zustand vanilla) and the hook `useStudio`. State:
    - `scene`, `activeLayer`, `playing`, `speed`, `lang`, `presetId`, `dirty`, `exportSize: { w: number; h: number }`, `format: 'png'|'jpg'|'webp'`, `quality: number` (0–1)
    - actions `update(fn: (s: Scene) => void, key?: string)` (immer-style draft via `structuredClone`, then `clampScene`), `updateLayer(i, patch, key?)`, `addLayer()` (no-op at 4), `removeLayer(i)` (no-op at 1), `setActiveLayer(i)`, `randomizeAll()`, `applyPreset(p: Preset)` (keeps `scene.frame`), `loadScene(s: Scene)`, `undo()`, `redo()`, `setPlaying(b)`, `setTime(t)` (not recorded in history), `setLang(l)`.
    - `dirty` becomes true on any recorded change and resets on `applyPreset` and `loadScene`.

- [ ] **Step 1: Write the failing tests**

```ts
test('undo and redo', () => { const st = createStudioStore(); st.getState().update(s => { s.camera.yaw = 30 });
  st.getState().undo(); expect(st.getState().scene.camera.yaw).toBe(0); st.getState().redo(); expect(st.getState().scene.camera.yaw).toBe(30); });
test('slider drags coalesce into one step', () => { /* 10 updates with key 'camera.yaw' within 600 ms (fake now) → one undo returns to 0 */ });
test('layers stay between 1 and 4', () => { /* addLayer ×5 → 4; removeLayer ×5 → 1 */ });
test('presets never change frame aspect', () => { /* frame 9:16; applyPreset(PRESET with 16:9 scene) → frame still 9:16 */ });
test('randomizeAll keeps frame, camera and effects', () => { /* seeded rand; compare fields */ });
test('setTime is not an undo step', () => { /* setTime(5); undo() leaves time 5 */ });
```

`Preset` comes from Task 13. Until then, define a local fixture of the same shape (`{ id, name: { id, en }, type, scene: Omit<Scene,'frame'> }`).

- [ ] **Step 2: Run them and confirm they fail.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run them and confirm they pass.**
- [ ] **Step 5: Commit.** `feat: studio store with undo/redo`

---

### Task 9: i18n

**Files:**
- Create: `src/i18n/strings.ts`, `src/i18n/useT.ts`
- Test: `src/i18n/strings.test.ts`

**Interfaces:**
- Produces: `type Lang = 'id' | 'en'`, `STRINGS: Record<Lang, Record<StringKey, string>>`, `detectLang(langs: readonly string[]): Lang` (the first entry starting with `id` gives `'id'`, otherwise `'en'`), `t(lang, key, vars?: Record<string, string | number>): string` (replaces `{name}`), and `useT(): (key, vars?) => string` (reads `lang` from the store).
- Copy is friendly and short. Indonesian is the source language. Include every label used in Tasks 10–15, plus:
  - `hint.drag` = "Seret untuk memutar kamera" / "Drag to aim the camera"
  - `export.tooLarge` = "Terlalu besar untuk perangkat ini, coba di komputer" / "Too large for this device, try a computer"
  - `link.invalid` = "Link tidak valid, membuka adegan bawaan" / "That link didn't work, opening the default scene"
  - `storage.unavailable` = "Penyimpanan browser tidak tersedia" / "Browser storage isn't available"
  - `webgl.unsupported` = "Browser ini tidak mendukung WebGL2. Coba Chrome, Safari, Firefox, atau Edge terbaru." / "This browser doesn't support WebGL2. Try the latest Chrome, Safari, Firefox or Edge."

- [ ] **Step 1: Write the failing test**

```ts
test('both languages have the same keys', () => expect(Object.keys(STRINGS.en).sort()).toEqual(Object.keys(STRINGS.id).sort()));
test('no empty strings', () => { for (const l of ['id', 'en'] as const) for (const v of Object.values(STRINGS[l])) expect(v.trim()).not.toBe(''); });
test('detects language', () => { expect(detectLang(['id-ID', 'en'])).toBe('id'); expect(detectLang(['en-US'])).toBe('en'); expect(detectLang([])).toBe('en'); });
test('interpolates', () => expect(t('en', 'export.progress', { pct: 40 })).toContain('40'));
```

- [ ] **Step 2: Run it and confirm it fails.**
- [ ] **Step 3: Implement it.** Add keys as later tasks need them.
- [ ] **Step 4: Run it and confirm it passes.**
- [ ] **Step 5: Commit.** `feat: indonesian and english strings`

---

### Task 10: Studio shell, preview, play bar and top bar

**Files:**
- Create: `src/App.tsx` (replace the scaffold), `src/ui/styles.css`, `src/ui/{TopBar,Preview,PlayBar,Toast,Unsupported}.tsx`
- Test: `src/ui/Preview.test.tsx`, `src/ui/PlayBar.test.tsx`, `e2e/studio.spec.ts`

**Interfaces:**
- Consumes: store (Task 8), `PreviewLoop` (Task 7), `Renderer` (Task 5), camera math (Task 3), `useT` (Task 9)
- Produces:
  - `<Preview renderer?: Pick<Renderer,'render'|'onRestored'> />`. The prop is injectable for tests.
  - `toast(message: string)` from `Toast.tsx`.
  - CSS tokens in `:root`: `--bg`, `--panel`, `--panel-2`, `--line`, `--text`, `--text-dim`, `--accent`.
  - In dev builds only (`import.meta.env.DEV`), `window.__studio = store`, so the e2e tests in Tasks 10, 14 and 15 can read state.
- Layout (desktop): top bar 48 px; left column 260 px; right column 320 px; the centre holds the preview, letterboxed to `scene.frame`, with the play bar below it.
- `App` creates the WebGL2 check once. If the check fails, render `<Unsupported/>` instead of the studio.
- Preview behaviour:
  - Pointer drag calls `dragCamera` through `update(..., 'camera.drag')`.
  - The wheel calls `wheelLens`, with a non-passive listener on the preview only.
  - Two pointers call `pinchLens`.
  - The `hint.drag` pill shows until the first drag.
  - The canvas `aria-label` describes the scene type.
  - Re-render on `onRestored`.
- PlayBar:
  - play/pause button;
  - time slider from 0 to 600 s, which seeks the loop and calls `setTime` on release;
  - speed select with 0.25×, 0.5×, 1×, 2× and 4×;
  - starts paused when `matchMedia('(prefers-reduced-motion: reduce)')` matches;
  - on pause, writes `liveTime` into `scene.time` via `setTime`.
- TopBar:
  - name "Auroragen",
  - preset name plus a dirty dot,
  - undo/redo (also bound to ⌘/Ctrl+Z and ⇧⌘/Ctrl+Shift+Z),
  - 🎲 Acak semua,
  - zoom toggle (fit / 100%),
  - ID/EN toggle,
  - Bagikan,
  - Simpan,
  - Ekspor.
  - Share, Save and Export are wired up in Tasks 12–14; render them disabled until then.

- [ ] **Step 1: Write the failing tests**

```tsx
test('dragging the preview turns the camera', async () => { /* render <Preview renderer={fake}/> with a store; pointerdown→move +100px x→up; scene.camera.yaw < 0 */ });
test('starts paused with reduced motion', () => { /* mock matchMedia matches → play button shows play icon, store.playing false */ });
test('pausing writes the live time into the scene', () => { /* fake loop liveTime 12.5 → click pause → scene.time 12.5 */ });
```

```ts
// e2e/studio.spec.ts
test('studio opens with a rendered aurora', async ({ page }) => { /* goto '/', canvas visible, sample canvas pixels non-black */ });
test('undo shortcut reverts a camera drag', async ({ page }) => { /* drag preview, press Ctrl+Z, yaw back to 0 via store debug read */ });
```

- [ ] **Step 2: Run them and confirm they fail.**
- [ ] **Step 3: Implement it.**
- [ ] **Step 4: Run them and confirm they pass** (`npm test` and `npm run e2e -- e2e/studio.spec.ts`).
- [ ] **Step 5: Commit.** `feat: studio shell with draggable preview and play bar`

---

### Task 11: Inspector controls and sections

**Files:**
- Create: `src/ui/Inspector.tsx`, `src/ui/controls/{SliderRow,SeedRow,ColorRow,VisualPicker,Section,InfoTip,Toggle}.tsx`, `src/ui/sections/{FrameSection,AuroraSection,LayerEditor,SkySection,LandSection,CameraSection,EffectsSection}.tsx`
- Test: `src/ui/controls/controls.test.tsx`, `src/ui/sections/sections.test.tsx`

**Interfaces:**
- Consumes: store, `RANGES`, `PALETTES`, `randomSeed`, `useT`
- Produces:
  - `<SliderRow label path value onChange info? />`. One row: label left, value right, the whole row drags. Double-click lets you type the value. It takes min/max/step from `RANGES[path]` and calls `onChange` with the coalesce key `path`.
  - `<SeedRow label value onChange />`: a slider from 1 to 9999 plus a 🎲 button.
  - `<ColorRow label value onChange />`: hex field plus native colour input; rejects invalid hex.
  - `<VisualPicker options={[{ id, label, thumb }]} value onChange />`: a radiogroup.
  - `<Section title defaultOpen advanced?>`: collapsible; an "Opsi lanjutan" disclosure holds its `advanced` children.
  - `<InfoTip text />`.
- Sections, in order:
  - **Ukuran & format** (Task 12 fills it in).
  - **Aurora**: a layer list (add up to 4, remove, select), then the active layer's editor.
    - Type picker (5 thumbnails), Bentuk aurora `SeedRow`, palette picker (5 + custom).
    - Three `ColorRow`s; editing one switches the palette to `custom`.
    - Brightness, distance, azimuth.
    - Advanced: length, fold amount, fold density, base altitude, ray height, ray density, ray contrast, speed, fringe.
    - When the type is `korona`, show the inline button "Arahkan kamera ke atas", which sets pitch 80 and lens 14.
  - **Langit**: zenith and horizon colours, star density and brightness, aurora glow, moon toggle plus azimuth, elevation and brightness.
  - **Daratan**: land-type picker (4), Bentuk daratan `SeedRow`, height, roughness, silhouette colour, water toggle plus ripple and reflection.
  - **Kamera**: pitch, yaw, lens.
  - **Efek**: exposure, bloom, saturation, grain, vignette.
  - Then a **Reset** button that loads the current preset, or the default scene.
- Thumbnails for type and land pickers are static SVG icons drawn in-repo. Preset thumbnails come in Task 13.

- [ ] **Step 1: Write the failing tests**

```tsx
test('typed slider value is clamped', async () => { /* SliderRow path 'camera.pitch', type 200 → onChange(90) */ });
test('seed dice gives 1–9999', async () => { /* click 🎲 with mocked random 0.99999 → 9999; 0 → 1 */ });
test('invalid hex is rejected', async () => { /* type 'zz' → onChange not called */ });
test('add layer stops at 4', async () => { /* click add 5× → 4 rows, add button disabled */ });
test('editing a colour switches palette to custom', async () => { /* change body colour → layer.palette 'custom' */ });
test('korona offers camera preset', async () => { /* pick korona → button visible → click → camera {pitch 80, lens 14} */ });
test('aurora seed and land seed are separate controls', async () => { /* click land 🎲 → layers[0].seed unchanged */ });
```

- [ ] **Step 2: Run them and confirm they fail.**
- [ ] **Step 3: Implement it.**
- [ ] **Step 4: Run them and confirm they pass.**
- [ ] **Step 5: Commit.** `feat: inspector with full scene controls`

---

### Task 12: Export pipeline

**Files:**
- Create: `src/export/{sizes,tiles,encode,exportImage,naming}.ts`, `src/ui/ExportDialog.tsx`
- Modify: `src/ui/sections/FrameSection.tsx`, `src/ui/TopBar.tsx` (enable Ekspor)
- Test: `src/export/export.test.ts`, `src/ui/ExportDialog.test.tsx`, `e2e/export.spec.ts`

**Interfaces:**
- Consumes: `Renderer` incl. `renderBloomSource` (Task 6), store
- Produces:
  - `SIZE_PRESETS: { id: string; label: Record<Lang,string>; w: number; h: number }[]`, with the nine sizes from Global Constraints.
  - `reduceAspect(w, h): Frame` (divides by the gcd).
  - `maxExportPixels(env: { userAgent: string; platform: string; maxTouchPoints: number }): number`. It returns 16_777_216 on iOS/iPadOS (including iPad reporting as `MacIntel` with touch points > 1) and 7680 × 4320 otherwise.
  - `checkSize(w, h, maxPixels): { ok: true } | { ok: false; reason: 'tooLarge' | 'tooSmall' | 'longSide' }`.
  - `planTiles(w, h, tile = 512): { x: number; y: number; w: number; h: number }[]`.
  - `encodeCanvas(c: HTMLCanvasElement, format: 'png'|'jpg'|'webp', quality: number): Promise<Blob>`. If `toBlob` WebP yields a non-WebP type, lazy-import `@jsquash/webp`.
  - `exportImage(o: { scene: Scene; time: number; width: number; height: number; format; quality; signal?: AbortSignal; onProgress?: (p: number) => void }): Promise<Blob>`. It uses its own hidden canvas and `Renderer`, calls `renderBloomSource` once, renders tiles with quality `export`, then `putImageData` into a 2D canvas of full size and encodes.
  - `exportFilename(scene, w, h, format)` returns `aurora-${scene.layers[0].type}-${w}x${h}.${format === 'jpg' ? 'jpg' : format}`.
  - `cssSnippet(filename)` returns `background: #02040a url("<filename>") center / cover no-repeat;`.
- FrameSection:
  - size presets plus Custom (width/height inputs);
  - format and quality (quality is hidden for PNG);
  - picking a size sets `exportSize` and `scene.frame = reduceAspect(w, h)` through `update(…, 'frame')`;
  - sizes that fail `checkSize` are disabled, with `export.tooLarge` as the reason.
- ExportDialog: shows size and format, a progress bar and a Batal (cancel) button. On success it downloads the file through an `a[download]` link and offers "Salin CSS".

- [ ] **Step 1: Write the failing tests**

```ts
test('aspect reduces', () => expect(reduceAspect(1290, 2796)).toEqual({ aspectW: 215, aspectH: 466 }));
test('iPhone and iPad cap pixels', () => {
  expect(maxExportPixels({ userAgent: 'iPhone', platform: 'iPhone', maxTouchPoints: 5 })).toBe(16_777_216);
  expect(maxExportPixels({ userAgent: 'Mac', platform: 'MacIntel', maxTouchPoints: 5 })).toBe(16_777_216);
  expect(maxExportPixels({ userAgent: 'Mac', platform: 'MacIntel', maxTouchPoints: 0 })).toBe(7680 * 4320);
});
test('oversized export is refused with a reason', () => {
  expect(checkSize(7680, 4320, 16_777_216)).toEqual({ ok: false, reason: 'tooLarge' });
  expect(checkSize(9000, 1000, 1e9)).toEqual({ ok: false, reason: 'longSide' });
  expect(checkSize(5120, 2880, 16_777_216)).toEqual({ ok: true });
});
test('tiles cover the image exactly once', () => { /* planTiles(1300, 700): sum of areas = 1300*700; no overlaps; all inside */ });
test('file name and css', () => { expect(exportFilename(defaultScene(), 3840, 2160, 'png')).toBe('aurora-tirai-3840x2160.png');
  expect(cssSnippet('a.webp')).toBe('background: #02040a url("a.webp") center / cover no-repeat;'); });
```

```ts
// e2e/export.spec.ts
test('exports a PNG of the requested size', async ({ page }) => { /* harness.export(scene, t, 640, 360, 'png') → PNG signature, IHDR 640x360 */ });
test('export matches the preview at the same aspect', async ({ page }) => {
  // preview-quality render 160x90 vs export 320x180 downsample2x → meanAbsDiff < 8
});
test('portrait export matches preview framing', async ({ page }) => {
  // frame 9:16; preview-quality 90x160 vs export 180x320 downsample2x → meanAbsDiff < 8; and sky region still has aurora (g > r)
});
test('cancel stops the export', async ({ page }) => { /* abort after first progress → rejects with AbortError */ });
```

- [ ] **Step 2: Run them and confirm they fail.**
- [ ] **Step 3: Implement.** Expose `harness.export` for the e2e tests.
- [ ] **Step 4: Run them and confirm they pass.**
- [ ] **Step 5: Commit.** `feat: tiled image export`

---

### Task 13: Presets, library and saved scenes

**Files:**
- Create: `src/presets/{presets,thumbnails}.ts`, `src/state/saved.ts`, `src/ui/LibraryPanel.tsx`
- Test: `src/presets/presets.test.ts`, `src/state/saved.test.ts`, `src/ui/LibraryPanel.test.tsx`

**Interfaces:**
- Consumes: store (`applyPreset`, `loadScene`), `encodeScene`/`decodeScene`, `Renderer`
- Produces:
  - `interface Preset { id: string; name: Record<Lang,string>; type: AuroraType; scene: Omit<Scene,'frame'> }`.
  - `PRESETS: Preset[]`, with 16–24 entries. Names are original (Indonesian and English). The set covers all 5 types, all 5 palettes, all 4 land types, water on and off, a few `korona` presets pointing up (pitch ≥ 70), and at least two multi-layer presets. The first preset is the default scene (`defaultScene()` without frame).
  - `filterPresets(list, { query, type?: AuroraType, lang }): Preset[]`. Case-insensitive; matches the name in either language.
  - `thumbnails.ts`: `getThumbnail(scene: Scene): Promise<string>` returns an object URL. It renders 192×108 with quality `refine` on one shared hidden renderer, runs requests one at a time, and caches by `encodeScene`.
  - `saved.ts`: `type SavedScene = { id: string; name: string; createdAt: number; data: string }`. `listSaved(storage: Storage | null): SavedScene[] | 'unavailable'`, `addSaved(storage, name, scene): SavedScene[] | 'unavailable'` (keeps 50, newest first), `removeSaved(storage, id)`. The key is `auroragen.saved.v1`, every access is wrapped in try/catch, and unreadable entries are skipped.
- LibraryPanel: tabs Pustaka / Tersimpan; a search box; filter chips Semua + 5 types; thumbnail cards. Clicking a card calls `applyPreset` or `loadScene` (keeping the frame). Simpan in the top bar opens a name prompt and calls `addSaved`. When storage is unavailable, show `storage.unavailable`.

- [ ] **Step 1: Write the failing tests**

```ts
test('there are 16–24 presets with unique ids', () => { expect(PRESETS.length).toBeGreaterThanOrEqual(16); expect(PRESETS.length).toBeLessThanOrEqual(24);
  expect(new Set(PRESETS.map(p => p.id)).size).toBe(PRESETS.length); });
test('every preset is already valid', () => { for (const p of PRESETS) expect(clampScene({ ...p.scene, frame: { aspectW: 16, aspectH: 9 } })).toEqual({ ...p.scene, frame: { aspectW: 16, aspectH: 9 } }); });
test('presets cover every type, palette and land', () => { /* sets of layer types, palettes, land types are complete */ });
test('search matches either language', () => { /* a preset's EN name found while lang 'id' */ });
test('saved scenes survive a reload', () => { /* fake Storage: addSaved → listSaved returns it, decodes to equal scene */ });
test('blocked storage reports unavailable', () => { /* storage whose getItem throws → 'unavailable'; null → 'unavailable' */ });
test('corrupted saved entries are skipped', () => { /* one valid + one garbage entry → list length 1 */ });
```

- [ ] **Step 2: Run them and confirm they fail.**
- [ ] **Step 3: Implement.** Write the presets by rendering each one in the harness and tuning it until it looks good.
- [ ] **Step 4: Run them and confirm they pass.**
- [ ] **Step 5: Commit.** `feat: preset library and saved scenes`

---

### Task 14: Share link and URL sync

**Files:**
- Create: `src/state/urlSync.ts`
- Modify: `src/App.tsx`, `src/ui/TopBar.tsx` (enable Bagikan)
- Test: `src/state/urlSync.test.ts`, `e2e/share.spec.ts`

**Interfaces:**
- Consumes: `encodeScene`/`decodeScene`, store, `toast`, `SIZE_PRESETS`
- Produces:
  - `readSceneFromHash(hash: string): { scene: Scene } | { error: 'invalid' } | null`. It reads `#s=<encoded>`, and returns `null` when there is no `s`.
  - `writeSceneToHash(scene: Scene): void`. Uses `history.replaceState` and is debounced 400 ms.
  - `exportSizeForFrame(frame: Frame): { w: number; h: number }`. Returns the first `SIZE_PRESETS` entry with an equal reduced aspect, or else the frame scaled to a long side of 3840.
- On startup:
  - a valid hash loads the scene, sets `exportSize` from `exportSizeForFrame` and clears `dirty`;
  - an invalid hash loads the default scene and shows `toast(t('link.invalid'))`.
- Bagikan writes the hash immediately, copies `location.href` to the clipboard and shows a toast. If the clipboard is unavailable, it shows the link in a selectable field.

- [ ] **Step 1: Write the failing tests**

```ts
test('no hash means no scene', () => expect(readSceneFromHash('')).toBeNull());
test('invalid hash is reported', () => expect(readSceneFromHash('#s=zzz')).toEqual({ error: 'invalid' }));
test('portrait frame maps to a phone size', () => expect(exportSizeForFrame({ aspectW: 215, aspectH: 466 })).toEqual({ w: 1290, h: 2796 }));
test('unknown aspect gets long side 3840', () => expect(exportSizeForFrame({ aspectW: 5, aspectH: 4 })).toEqual({ w: 3840, h: 3072 }));
```

```ts
// e2e/share.spec.ts
test('link restores frame aspect and camera', async ({ browser }) => {
  // desktop page: set frame 16:9, drag camera, click Bagikan, read URL
  // new context with viewport 375x812: open URL → store scene equals the original (frame, camera, layers, land)
});
test('broken link opens the default scene with a notice', async ({ page }) => { /* goto '/#s=1.garbage' → toast visible, canvas renders */ });
```

- [ ] **Step 2: Run them and confirm they fail.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run them and confirm they pass.**
- [ ] **Step 5: Commit.** `feat: shareable scene links`

---

### Task 15: Mobile layout, accessibility and production build

**Files:**
- Create: `src/ui/MobileSheet.tsx`
- Modify: `src/App.tsx`, `src/ui/styles.css`
- Test: `e2e/mobile.spec.ts`, `e2e/a11y.spec.ts`

**Interfaces:**
- Consumes: every section and panel from Tasks 10–14
- Produces:
  - Below 768 px, `App` renders the compact top bar, a full-width preview with the play bar, and `<MobileSheet>`.
  - The sheet is a bottom panel with tabs Pustaka, Aurora, Langit, Daratan, Kamera, Efek, Ekspor. It collapses to a 56 px tab strip and expands to 60 % of the viewport height.
  - Accessibility: visible focus rings; every control has an accessible name from i18n; text contrast against `--panel` is at least 4.5:1.

- [ ] **Step 1: Write the failing tests**

```ts
test('phone layout has no horizontal scroll and a working sheet', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 }); await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  await page.getByRole('tab', { name: 'Kamera' }).click(); await expect(page.getByRole('slider', { name: /Sudut kamera/ })).toBeVisible();
});
test('keyboard can change a slider', async ({ page }) => { /* focus 'Lensa' slider, ArrowRight → value 18 */ });
test('reduced motion starts paused', async ({ page }) => { /* emulateMedia reducedMotion 'reduce' → play button labelled "Putar" */ });
test('unsupported browsers get a message', async ({ page }) => { /* addInitScript making getContext('webgl2') return null → message text visible */ });
```

- [ ] **Step 2: Run them and confirm they fail.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run the full suite:** `npm run typecheck && npm test && npm run build && npm run e2e`. Expected: everything passes and `dist/` builds with no harness entry.
- [ ] **Step 5: Commit.** `feat: mobile layout and accessibility`
