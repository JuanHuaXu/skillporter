---
name: Image
slug: image
version: 1.0.4
homepage: https://clawic.com/skills/image
description: "Create, inspect, process, and optimize image files and visual assets when format choice, resizing, compression, color profile, metadata, transparency, accessibility, or destination-specific export rules matter."
metadata: {"clawdbot":{"emoji":"🖼️","os":["linux","darwin","win32"]}}
---

# Image

Use this skill when the main artifact is an image file or visual asset. Keep the main workflow light; load a reference file only when its destination actually applies.

## Dispatch

| Situation | Load |
|-----------|------|
| Web optimization, responsive images, lazy loading, SVG | `web.md` |
| Color profiles, metadata, RAW, print, non-destructive workflows | `photography.md` |
| Social dimensions, safe zones, banners, previews | `social.md` |
| Product photos, marketplace standards, catalog consistency | `ecommerce.md` |
| Logos, favicons, app icons, icon sets | `branding.md` |
| UI screenshots, docs captures, redaction, annotations | `screenshots.md` |
| Alt text, charts, decorative vs informative images | `accessibility.md` |
| Concrete ImageMagick or Pillow commands | `commands.md` |

Do not load multiple references unless the task crosses destinations.

## Fast Workflow

1. Identify asset type: photo, screenshot, logo, diagram, social card, product image, or print source.
2. Identify destination: web, social, marketplace, print, archive, or editing pipeline.
3. Inspect dimensions, aspect ratio, transparency, color profile, metadata, orientation, and compression damage before editing.
4. Preserve a clean original or master when future edits are likely.
5. Choose format by content and destination, not habit.
6. Crop first, resize second, compress last.
7. Validate the exported result in the actual destination context.

## Core Defaults

| Asset | Default | Watch |
|-------|---------|-------|
| Photo | WebP/AVIF for web, JPEG fallback | Color shift, overcompression |
| Screenshot/UI | PNG or lossless WebP | Blurry text, privacy leaks |
| Logo/icon | SVG master when supported | Small-size legibility |
| Product photo | JPEG/WebP delivery plus clean master | White background, zoom detail |
| Social/OG | PNG or high-quality JPEG | Unsafe crops, tiny text |
| Print | TIFF or high-quality JPEG with correct profile | Physical size, bleed |

## Guardrails

- Do not upscale unless explicitly requested or justified.
- Do not flatten SVG, layered, or RAW sources earlier than necessary.
- Do not save transparency as JPEG.
- Strip GPS/public metadata unless rights/provenance/orientation requires keeping it.
- Validate embedded text at the smallest realistic display size.
- Redact secrets, personal data, and unstable timestamps from screenshots.
- Add or preserve alt text strategy when the image carries meaning.
