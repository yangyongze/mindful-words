"""Generate the PNG icons referenced by manifest.json.

Icon system: a pair of opening quotes (C1b, long tapering terminal).

Design rules, all deliberate:
  * Each quote is ONE closed cubic-Bezier outline. No circle-plus-tail
    compositing, no welded joins, no highlight dots or inner rings.
  * Ink #171A20 tile, paper #F2EBDC glyph. A single quiet hairline is the
    only extra: it keeps the tile visible on a dark Chrome toolbar.
  * The hairline width is computed backwards from the OUTPUT size, so every
    size gets 1 physical pixel. Scaling one master stroke was the root cause
    of the previous icon collapsing into a blue blob at 16px.
  * Shape itself is graded too: 16/32 use a reinforced terminal because a
    hair-thin tail disappears under antialiasing at 16px (measured on the
    design board). 48/128/512 keep the full C1b proportions.
  * Everything is drawn on a supersampled canvas and downsampled with
    LANCZOS, so the small assets have real antialiasing.
"""

from __future__ import annotations

import re
from pathlib import Path

from PIL import Image, ImageDraw

from palette import INK, PAPER, rgb

OUTPUT_DIR = Path(__file__).resolve().parent.parent / 'icons'
SIZES = (16, 32, 48, 128, 512)

MASTER = 64.0                    # design grid, same as the board's viewBox
TILE_BOX = (2.0, 2.0, 62.0, 62.0)
TILE_RADIUS = 14.0
HAIRLINE_OPACITY = 0.45          # paper over ink
REINFORCED_SIZES = (16, 32)
QUOTE_OFFSET = 24.0              # second quote = first translated by 24u

INK_RGB = rgb(INK)
PAPER_RGB = rgb(PAPER)

# One closed outline per quote, in master-grid units.
# The second quote is produced by translating the first, so both are
# guaranteed to be a single unbroken contour with identical proportions.
QUOTE_FULL = (
    'M23 13C29 13 33 18 33 24C33 29 30 33 26 36'
    'C21 40 16 45 12 47C12 43 15 38 18 33'
    'C20 30 21 28 20 26C18 24 15 22 15 19'
    'C15 15 18 13 23 13Z'
)
# Same gesture, wider wedge in the terminal: at 16px the original tail is
# barely 1px and vanishes. Round head is very slightly enlarged as well.
QUOTE_REINFORCED = (
    'M23 12C30 12 34 18 34 24C34 30 31 34 27 37'
    'C22 41 16 46 11 48C9 43 12 37 17 32'
    'C19 29 20 27 19 25C17 23 14 21 14 18'
    'C14 14 18 12 23 12Z'
)

_TOKEN = re.compile(r'[MCZ]|-?\d+(?:\.\d+)?')
_STEPS = 96                      # Bezier samples per curve segment


def _mix(a, b, t):
    """Opaque equivalent of drawing `b` over `a` at opacity `t`."""
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


HAIRLINE_RGB = _mix(INK_RGB, PAPER_RGB, HAIRLINE_OPACITY)


def _cubic(p0, p1, p2, p3, t):
    u = 1.0 - t
    return (
        u**3 * p0[0] + 3 * u * u * t * p1[0]
        + 3 * u * t * t * p2[0] + t**3 * p3[0],
        u**3 * p0[1] + 3 * u * u * t * p1[1]
        + 3 * u * t * t * p2[1] + t**3 * p3[1],
    )


def _outline(path, dx=0.0):
    """Flatten a closed M/C/Z path into polygon points, shifted by `dx`."""
    tokens = _TOKEN.findall(path)
    points = []
    current = None
    index = 0
    while index < len(tokens):
        token = tokens[index]
        if token == 'M':
            current = (float(tokens[index + 1]) + dx, float(tokens[index + 2]))
            points = [current]
            index += 3
        elif token == 'C':
            c1 = (float(tokens[index + 1]) + dx, float(tokens[index + 2]))
            c2 = (float(tokens[index + 3]) + dx, float(tokens[index + 4]))
            end = (float(tokens[index + 5]) + dx, float(tokens[index + 6]))
            for step in range(1, _STEPS + 1):
                points.append(_cubic(current, c1, c2, end, step / _STEPS))
            current = end
            index += 7
        elif token == 'Z':
            if points and points[-1] != points[0]:
                points.append(points[0])
            index += 1
        else:
            raise ValueError(f'Unexpected path token: {token!r}')
    return points


def _supersample(size):
    """Keep the working canvas at most 1024px, with >=2x per output pixel."""
    return max(2, min(8, 1024 // size))


def create_icon(size):
    ss = _supersample(size)
    canvas = size * ss
    scale = canvas / MASTER

    # Transparent corners carry the ink RGB too, so LANCZOS downsampling
    # never bleeds black into the anti-aliased edge.
    image = Image.new('RGBA', (canvas, canvas), INK_RGB + (0,))
    draw = ImageDraw.Draw(image)

    box = tuple(value * scale for value in TILE_BOX)
    draw.rounded_rectangle(
        box,
        radius=TILE_RADIUS * scale,
        fill=INK_RGB + (255,),
        outline=HAIRLINE_RGB + (255,),
        width=ss,                # exactly 1px after downsampling
    )

    path = QUOTE_REINFORCED if size in REINFORCED_SIZES else QUOTE_FULL
    for dx in (0.0, QUOTE_OFFSET):
        polygon = [(x * scale, y * scale) for x, y in _outline(path, dx)]
        draw.polygon(polygon, fill=PAPER_RGB + (255,))

    return image.resize((size, size), Image.LANCZOS)


def main():
    OUTPUT_DIR.mkdir(exist_ok=True)
    for size in SIZES:
        target = OUTPUT_DIR / f'icon{size}.png'
        create_icon(size).save(target, 'PNG')
        print(f'Saved {target.name} ({size}x{size})')


if __name__ == '__main__':
    main()
