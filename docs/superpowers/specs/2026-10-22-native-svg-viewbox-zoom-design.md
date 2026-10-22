# Design Spec: Native SVG ViewBox Zoom & Pan

## Problem
In the previous implementation, the Thailand interactive map relied on CSS `transform: translate3d(...) scale(...)` on the wrapping `<div>` element containing the `<svg>`. When users zoomed in, the browser scaled the previously rasterized bitmap texture instead of re-rendering vector curves at native screen resolution, causing noticeable pixelation, blurriness, and fuzzy text/icons.

## Solution Architecture
Migrate pan and zoom calculations directly into the native SVG `viewBox` attributes:
1. **Dynamic ViewBox Computation**:
   - Base SVG coordinate plane: `600 x 900`.
   - Manage state as center coordinate `(cx, cy)` and zoom multiplier `zoom` (range 0.6x to 6x).
   - Calculated viewBox:
     - `w = 600 / zoom`
     - `h = 900 / zoom`
     - `minX = cx - w / 2`
     - `minY = cy - h / 2`
     - `viewBox="${minX} ${minY} ${w} ${h}"`
2. **Infinite Sharpness & Vector Precision**:
   - Add `shape-rendering="geometricPrecision"` to the `<svg>` root element.
   - Set `vector-effect="non-scaling-stroke"` on all province `<path>` elements, guaranteeing constant, ultra-crisp line weights regardless of magnification.
   - Adjust font sizes and landmark badge circles so they remain balanced and legible at any zoom level.
3. **Responsive Interaction**:
   - Mouse wheel zoom smoothly scales toward the mouse focal point.
   - Click-and-drag pan maps screen pixel deltas to SVG coordinate deltas via `(screenDelta / containerDimension) * viewBoxDimension`.
   - Prevent accidental province selection while dragging.
   - Maintain floating HUD and bottom controls outside the SVG viewport.
