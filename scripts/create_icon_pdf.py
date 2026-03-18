"""
Create a PDF document showcasing the Mindful Words icon design
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, mm
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import ImageReader
from PIL import Image
import os

# Colors
PRIMARY_BLUE = HexColor('#3B82F6')
SECONDARY_GREEN = HexColor('#10B981')
ACCENT_ORANGE = HexColor('#F97316')
DARK_SLATE = HexColor('#1E293B')
LIGHT_GRAY = HexColor('#F1F5F9')

def create_icon_pdf():
    """Create a PDF showcasing the icon design"""
    
    # Create docs directory if needed
    os.makedirs('docs', exist_ok=True)
    
    # Create PDF
    c = canvas.Canvas("docs/mindful-words-icon-design.pdf", pagesize=A4)
    width, height = A4
    
    # Background
    c.setFillColor(HexColor('#FFFFFF'))
    c.rect(0, 0, width, height, fill=True)
    
    # Title
    c.setFont("Helvetica-Bold", 28)
    c.setFillColor(DARK_SLATE)
    c.drawCentredString(width/2, height - 50*mm, "Mindful Words")
    
    # Subtitle
    c.setFont("Helvetica", 14)
    c.setFillColor(HexColor('#64748B'))
    c.drawCentredString(width/2, height - 65*mm, "Icon Design Specification")
    
    # Draw main icon (large) - use 128px
    icon_path = "icons/icon128.png"
    if os.path.exists(icon_path):
        img = ImageReader(icon_path)
        icon_size = 100*mm
        c.drawImage(img, (width - icon_size)/2, height - 190*mm, 
                   width=icon_size, height=icon_size, mask='auto')
    
    # Color palette section
    y_pos = height - 210*mm
    c.setFont("Helvetica-Bold", 16)
    c.setFillColor(DARK_SLATE)
    c.drawString(30*mm, y_pos, "Color Palette")
    
    # Draw color swatches
    colors = [
        (PRIMARY_BLUE, "Primary Blue", "#3B82F6"),
        (SECONDARY_GREEN, "Secondary Green", "#10B981"),
        (ACCENT_ORANGE, "Accent Orange", "#F97316"),
        (DARK_SLATE, "Dark Slate", "#1E293B"),
    ]
    
    y_pos -= 15*mm
    for i, (color, name, hex_code) in enumerate(colors):
        x = 30*mm + i * 45*mm
        
        # Color swatch
        c.setFillColor(color)
        c.roundRect(x, y_pos, 35*mm, 20*mm, 3*mm, fill=True)
        
        # Color name
        c.setFont("Helvetica", 9)
        c.setFillColor(DARK_SLATE)
        c.drawString(x, y_pos - 10*mm, name)
        c.drawString(x, y_pos - 18*mm, hex_code)
    
    # Icon sizes section
    y_pos -= 50*mm
    c.setFont("Helvetica-Bold", 16)
    c.setFillColor(DARK_SLATE)
    c.drawString(30*mm, y_pos, "Icon Sizes")
    
    # Draw different icon sizes
    sizes = [16, 32, 48, 128]
    y_pos -= 20*mm
    
    for i, size in enumerate(sizes):
        x = 30*mm + i * 45*mm
        icon_file = f"icons/icon{size}.png"
        
        if os.path.exists(icon_file):
            img = ImageReader(icon_file)
            # Scale for display
            display_size = 30*mm
            c.drawImage(img, x, y_pos - display_size, 
                       width=display_size, height=display_size, mask='auto')
            
            # Label
            c.setFont("Helvetica", 9)
            c.setFillColor(DARK_SLATE)
            c.drawCentredString(x + display_size/2, y_pos - display_size - 8*mm, f"{size}x{size}")
    
    # Design principles section
    y_pos -= 70*mm
    c.setFont("Helvetica-Bold", 16)
    c.setFillColor(DARK_SLATE)
    c.drawString(30*mm, y_pos, "Design Principles")
    
    principles = [
        "Clean, minimalist aesthetic",
        "Circular shape for browser extension compatibility",
        "Open book symbolizing knowledge collection",
        "Blue color conveying trust and focus",
        "Orange accent highlighting saved content",
        "Scalable design for all icon sizes",
    ]
    
    y_pos -= 10*mm
    c.setFont("Helvetica", 11)
    c.setFillColor(HexColor('#475569'))
    
    for principle in principles:
        c.drawString(35*mm, y_pos, f"• {principle}")
        y_pos -= 6*mm
    
    # Footer
    c.setFont("Helvetica", 8)
    c.setFillColor(HexColor('#94A3B8'))
    c.drawCentredString(width/2, 15*mm, "Mindful Words - Chrome Extension for Language Learning")
    
    # Save PDF
    c.save()
    print("PDF created: docs/mindful-words-icon-design.pdf")

if __name__ == '__main__':
    create_icon_pdf()
