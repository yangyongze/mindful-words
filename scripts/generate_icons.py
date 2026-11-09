"""Generate the PNG icons referenced by manifest.json."""

from pathlib import Path

from PIL import Image, ImageDraw

from palette import ACCENT_ORANGE, DARK_SLATE, PRIMARY_BLUE, WHITE, rgb

COLORS = {
    'primary': rgb(PRIMARY_BLUE),
    'white': rgb(WHITE),
    'dark': rgb(DARK_SLATE),
    'accent': rgb(ACCENT_ORANGE),
}
LINE_COLOR = (200, 200, 200)
OUTPUT_DIR = Path(__file__).resolve().parent.parent / 'icons'


def create_icon(size):
    image = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    center = size / 2
    padding = size * 0.08
    draw.ellipse(
        [padding, padding, size - padding, size - padding],
        fill=COLORS['primary']
    )

    book_width = size * 0.55
    book_height = size * 0.4
    book_x = center - book_width / 2
    book_y = center - book_height / 2

    left_page = [
        (center - size * 0.02, book_y),
        (book_x, book_y + size * 0.05),
        (book_x, book_y + book_height - size * 0.05),
        (center - size * 0.02, book_y + book_height),
    ]
    draw.polygon(left_page, fill=COLORS['white'])

    right_page = [
        (center + size * 0.02, book_y),
        (book_x + book_width, book_y + size * 0.05),
        (book_x + book_width, book_y + book_height - size * 0.05),
        (center + size * 0.02, book_y + book_height),
    ]
    draw.polygon(right_page, fill=COLORS['white'])

    spine_width = size * 0.025
    draw.rectangle(
        [center - spine_width / 2, book_y - size * 0.02,
         center + spine_width / 2, book_y + book_height + size * 0.02],
        fill=COLORS['dark']
    )

    line_spacing = size * 0.05
    line_width = max(1, int(size * 0.015))
    for index in range(3):
        y = book_y + size * 0.12 + index * line_spacing
        draw.line(
            [(book_x + size * 0.06, y), (center - size * 0.05, y)],
            fill=LINE_COLOR, width=line_width
        )
        draw.line(
            [(center + size * 0.05, y), (book_x + book_width - size * 0.06, y)],
            fill=LINE_COLOR, width=line_width
        )

    dot_x = center + size * 0.15
    dot_y = book_y + size * 0.25
    dot_radius = size * 0.04
    draw.ellipse(
        [dot_x - dot_radius, dot_y - dot_radius,
         dot_x + dot_radius, dot_y + dot_radius],
        fill=COLORS['accent']
    )

    return image


def main():
    OUTPUT_DIR.mkdir(exist_ok=True)
    for size in [16, 32, 48, 128, 512]:
        create_icon(size).save(OUTPUT_DIR / f'icon{size}.png', 'PNG')
        print(f'Saved icon{size}.png')


if __name__ == '__main__':
    main()
