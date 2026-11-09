"""Render the icon design sheet to docs/mindful-words-icon-design.pdf."""

from pathlib import Path

from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

from palette import ACCENT_ORANGE, DARK_SLATE, PRIMARY_BLUE, SECONDARY_GREEN, WHITE

ROOT = Path(__file__).resolve().parent.parent
ICON_DIR = ROOT / 'icons'
OUTPUT = ROOT / 'docs' / 'mindful-words-icon-design.pdf'

BLUE = HexColor(PRIMARY_BLUE)
GREEN = HexColor(SECONDARY_GREEN)
ORANGE = HexColor(ACCENT_ORANGE)
SLATE = HexColor(DARK_SLATE)
WHITE_COLOR = HexColor(WHITE)
SUBTLE = HexColor('#64748B')
PRINCIPLE_COLOR = HexColor('#475569')
FOOTER_COLOR = HexColor('#94A3B8')

SWATCHES = [
    (BLUE, 'Primary Blue', PRIMARY_BLUE),
    (GREEN, 'Secondary Green', SECONDARY_GREEN),
    (ORANGE, 'Accent Orange', ACCENT_ORANGE),
    (SLATE, 'Dark Slate', DARK_SLATE),
]

PRINCIPLES = [
    'Clean, minimalist aesthetic',
    'Circular shape for browser extension compatibility',
    'Open book symbolizing knowledge collection',
    'Blue color conveying trust and focus',
    'Orange accent highlighting saved content',
    'Scalable design for all icon sizes',
]


def create_icon_pdf():
    OUTPUT.parent.mkdir(exist_ok=True)
    sheet = canvas.Canvas(str(OUTPUT), pagesize=A4)
    width, height = A4

    sheet.setFillColor(WHITE_COLOR)
    sheet.rect(0, 0, width, height, fill=True)

    sheet.setFont('Helvetica-Bold', 28)
    sheet.setFillColor(SLATE)
    sheet.drawCentredString(width / 2, height - 50 * mm, 'Mindful Words')

    sheet.setFont('Helvetica', 14)
    sheet.setFillColor(SUBTLE)
    sheet.drawCentredString(width / 2, height - 65 * mm, 'Icon Design Specification')

    main_icon = ICON_DIR / 'icon128.png'
    if main_icon.exists():
        icon_size = 100 * mm
        sheet.drawImage(
            ImageReader(str(main_icon)),
            (width - icon_size) / 2, height - 190 * mm,
            width=icon_size, height=icon_size, mask='auto'
        )

    y_pos = height - 210 * mm
    sheet.setFont('Helvetica-Bold', 16)
    sheet.setFillColor(SLATE)
    sheet.drawString(30 * mm, y_pos, 'Color Palette')

    y_pos -= 15 * mm
    for index, (color, name, hex_code) in enumerate(SWATCHES):
        x = 30 * mm + index * 45 * mm
        sheet.setFillColor(color)
        sheet.roundRect(x, y_pos, 35 * mm, 20 * mm, 3 * mm, fill=True)
        sheet.setFont('Helvetica', 9)
        sheet.setFillColor(SLATE)
        sheet.drawString(x, y_pos - 10 * mm, name)
        sheet.drawString(x, y_pos - 18 * mm, hex_code)

    y_pos -= 50 * mm
    sheet.setFont('Helvetica-Bold', 16)
    sheet.setFillColor(SLATE)
    sheet.drawString(30 * mm, y_pos, 'Icon Sizes')

    y_pos -= 20 * mm
    for index, size in enumerate([16, 32, 48, 128]):
        x = 30 * mm + index * 45 * mm
        icon_file = ICON_DIR / f'icon{size}.png'
        if not icon_file.exists():
            continue
        display_size = 30 * mm
        sheet.drawImage(
            ImageReader(str(icon_file)),
            x, y_pos - display_size,
            width=display_size, height=display_size, mask='auto'
        )
        sheet.setFont('Helvetica', 9)
        sheet.setFillColor(SLATE)
        sheet.drawCentredString(x + display_size / 2, y_pos - display_size - 8 * mm, f'{size}x{size}')

    y_pos -= 70 * mm
    sheet.setFont('Helvetica-Bold', 16)
    sheet.setFillColor(SLATE)
    sheet.drawString(30 * mm, y_pos, 'Design Principles')

    y_pos -= 10 * mm
    sheet.setFont('Helvetica', 11)
    sheet.setFillColor(PRINCIPLE_COLOR)
    for principle in PRINCIPLES:
        sheet.drawString(35 * mm, y_pos, f'• {principle}')
        y_pos -= 6 * mm

    sheet.setFont('Helvetica', 8)
    sheet.setFillColor(FOOTER_COLOR)
    sheet.drawCentredString(width / 2, 15 * mm, 'Mindful Words - Chrome Extension for Language Learning')

    sheet.save()
    print(f'PDF created: {OUTPUT}')


if __name__ == '__main__':
    create_icon_pdf()
