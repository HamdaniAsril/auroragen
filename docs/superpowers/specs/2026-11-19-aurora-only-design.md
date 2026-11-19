# Aurora only (transparent background): short design

**Why:** people want the aurora by itself as a PNG with a transparent background, to place over their own designs.

**Goal:** a "Background: Scene / Aurora only" switch in the Size & format section. In aurora-only mode the preview and the export draw only the aurora (with its glow) on a transparent background.

**Non-goals:** a separate "background colour" picker; transparency for JPG.

**Approaches**
- Chosen: a scene setting (`frame.auroraOnly`), shown live in the preview over a checkerboard and kept in share links and saved scenes, like the frame size. What you see is what you download.
- Not chosen: a checkbox only in the export dialog. The preview would show the full scene while the file looked different.

**Decided with the user**
- Removed: sky gradient, stars, moon, land, lake, grain, vignette.
- Kept: aurora shape, colours, glow (bloom), camera, exposure, saturation.
- PNG and WebP keep transparency. JPG is disabled while the mode is on, with a short note.

**Builder's calls**
- Alpha comes from brightness: `a = max(r, g, b)` of the finished colour, and the colour is divided by `a`. Over black the result matches the in-app look exactly.
- Field lives in `Frame` so presets and randomize keep it, just as they keep the aspect. Scenes without it load as `false`, so no version bump.
- Turning the mode on while JPG is selected switches the format to PNG.
