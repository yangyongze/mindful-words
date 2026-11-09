"""Render the icon design sheet to docs/mindful-words-icon-design.pdf."""

from pathlib import Path

from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

from palette import INK, PAPER

ROOT = Path(__file__).resolve().parent.parent
ICON_DIR = ROOT / 'icons'
OUTPUT = ROOT / 'docs' / 'mindful-words-icon-design.pdf'

INK_COLOR = HexColor(INK)
PAPER_COLOR = HexColor(PAPER)
HAIRLINE_COLOR = HexColor('#7A7875')     # 45% paper over ink
SUBTLE = HexColor('#64748B')
PRINCIPLE_COLOR = HexColor('#475569')
FOOTER_COLOR = HexColor('#94A3B8')

SWATCHES = [
    (INK_COLOR, 'Ink', INK),
    (PAPER_COLOR, 'Paper', PAPER),
    (HAIRLINE_COLOR, 'Hairline', '#7A7875'),
]

PRINCIPLES = [
    'A pair of opening quotes: one closed outline each, no welded joins',
    'C1b terminal: round head, narrowing tail, sharp hand-written finish',
    'Ink tile with paper glyph; no highlight dots, inner rings or gradients',
    'Hairline width derived from output size: 1 physical pixel at every size',
    '16/32px use a reinforced terminal; thin tails vanish at 16px',
    'Supersampled then LANCZOS-downsampled, never drawn at final size',
]


def create_icon_pdf():
    OUTPUT.parent.mkdir(exist_ok=True)
    sheet = canvas.Canvas(str(OUTPUT), pagesize=A4)
    width, height = A4

    sheet.setFillColor(HexColor('#FFFFFF'))
    sheet.rect(0, 0, width, height, fill=True)

    sheet.setFont('Helvetica-Bold', 28)
    sheet.setFillColor(INK_COLOR)
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
    sheet.setFillColor(INK_COLOR)
    sheet.drawString(30 * mm, y_pos, 'Color Palette')

    y_pos -= 15 * mm
    for index, (color, name, hex_code) in enumerate(SWATCHES):
        x = 30 * mm + index * 45 * mm
        sheet.setFillColor(color)
        sheet.roundRect(x, y_pos, 35 * mm, 20 * mm, 3 * mm, fill=True)
        sheet.setFont('Helvetica', 9)
        sheet.setFillColor(INK_COLOR)
        sheet.drawString(x, y_pos - 10 * mm, name)
        sheet.drawString(x, y_pos - 18 * mm, hex_code)

    y_pos -= 50 * mm
    sheet.setFont('Helvetica-Bold', 16)
    sheet.setFillColor(INK_COLOR)
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
        sheet.setFillColor(INK_COLOR)
        sheet.drawCentredString(x + display_size / 2, y_pos - display_size - 8 * mm, f'{size}x{size}')

    y_pos -= 70 * mm
    sheet.setFont('Helvetica-Bold', 16)
    sheet.setFillColor(INK_COLOR)
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
