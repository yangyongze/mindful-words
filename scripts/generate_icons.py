"""
Mindful Words Icon Generator
Creates clean, modern icons for the Chrome extension
"""

from PIL import Image, ImageDraw, ImageFont
import os

# Color palette
COLORS = {
    'primary': (59, 130, 246),      # Blue #3B82F6
    'secondary': (16, 185, 129),    # Green #10B981
    'accent': (249, 115, 22),       # Orange #F97316
    'white': (255, 255, 255),
    'dark': (30, 41, 59),           # Slate #1E293B
}

def create_icon(size):
    """Create a single icon at the specified size"""
    # Create transparent image
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Calculate dimensions
    padding = size * 0.1
    center = size / 2
    
    # Draw circular background with gradient effect
    # Outer circle (primary blue)
    outer_radius = (size - padding) / 2
    draw.ellipse(
        [padding, padding, size - padding, size - padding],
        fill=COLORS['primary']
    )
    
    # Inner highlight circle (slightly lighter)
    inner_padding = padding + size * 0.08
    inner_radius = (size - inner_padding * 2) / 2
    highlight_color = (99, 179, 237)  # Lighter blue
    draw.ellipse(
        [inner_padding, inner_padding, size - inner_padding, size - inner_padding],
        fill=highlight_color
    )
    
    # Draw book icon
    book_width = size * 0.5
    book_height = size * 0.35
    book_x = center - book_width / 2
    book_y = center - book_height / 2 + size * 0.05
    
    # Book spine (center line)
    spine_width = size * 0.03
    draw.rectangle(
        [center - spine_width/2, book_y, center + spine_width/2, book_y + book_height],
        fill=COLORS['dark']
    )
    
    # Left page (M)
    left_page_margin = size * 0.02
    draw.rectangle(
        [book_x + left_page_margin, book_y + left_page_margin, 
         center - spine_width/2 - left_page_margin, book_y + book_height - left_page_margin],
        fill=COLORS['white']
    )
    
    # Right page (W)
    draw.rectangle(
        [center + spine_width/2 + left_page_margin, book_y + left_page_margin,
         book_x + book_width - left_page_margin, book_y + book_height - left_page_margin],
        fill=COLORS['white']
    )
    
    # Draw "M" on left page
    m_size = size * 0.12
    m_x = book_x + book_width * 0.15
    m_y = book_y + book_height * 0.25
    draw.text((m_x, m_y), "M", fill=COLORS['primary'], font=None)
    
    # Draw "W" on right page
    w_x = center + book_width * 0.15
    draw.text((w_x, m_y), "W", fill=COLORS['secondary'], font=None)
    
    # Add small accent dots (representing words/phrases)
    dot_radius = size * 0.02
    dot_positions = [
        (center - size * 0.25, center - size * 0.2),
        (center + size * 0.25, center - size * 0.2),
        (center - size * 0.3, center + size * 0.15),
        (center + size * 0.3, center + size * 0.15),
    ]
    
    for i, (x, y) in enumerate(dot_positions):
        color = COLORS['accent'] if i % 2 == 0 else COLORS['secondary']
        draw.ellipse(
            [x - dot_radius, y - dot_radius, x + dot_radius, y + dot_radius],
            fill=color
        )
    
    return img

def create_simple_icon(size):
    """Create a simpler, cleaner icon"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    center = size / 2
    padding = size * 0.08
    
    # Main circle (gradient blue)
    outer_radius = (size - padding * 2) / 2
    
    # Draw main circle
    draw.ellipse(
        [padding, padding, size - padding, size - padding],
        fill=COLORS['primary']
    )
    
    # Draw open book shape
    book_width = size * 0.55
    book_height = size * 0.4
    book_x = center - book_width / 2
    book_y = center - book_height / 2
    
    # Book pages (white)
    page_margin = size * 0.02
    
    # Left page
    left_page = [
        (center - size * 0.02, book_y),  # Top right
        (book_x, book_y + size * 0.05),  # Top left (curved)
        (book_x, book_y + book_height - size * 0.05),  # Bottom left
        (center - size * 0.02, book_y + book_height),  # Bottom right
    ]
    draw.polygon(left_page, fill=COLORS['white'])
    
    # Right page
    right_page = [
        (center + size * 0.02, book_y),  # Top left
        (book_x + book_width, book_y + size * 0.05),  # Top right (curved)
        (book_x + book_width, book_y + book_height - size * 0.05),  # Bottom right
        (center + size * 0.02, book_y + book_height),  # Bottom left
    ]
    draw.polygon(right_page, fill=COLORS['white'])
    
    # Book spine
    spine_width = size * 0.025
    draw.rectangle(
        [center - spine_width/2, book_y - size * 0.02, 
         center + spine_width/2, book_y + book_height + size * 0.02],
        fill=COLORS['dark']
    )
    
    # Draw lines on pages (representing text)
    line_color = (200, 200, 200)
    line_height = size * 0.03
    line_spacing = size * 0.05
    
    for i in range(3):
        y = book_y + size * 0.12 + i * line_spacing
        # Left page lines
        draw.line(
            [(book_x + size * 0.06, y), (center - size * 0.05, y)],
            fill=line_color, width=max(1, int(size * 0.015))
        )
        # Right page lines
        draw.line(
            [(center + size * 0.05, y), (book_x + book_width - size * 0.06, y)],
            fill=line_color, width=max(1, int(size * 0.015))
        )
    
    # Add accent dot (representing a saved word)
    dot_x = center + size * 0.15
    dot_y = book_y + size * 0.25
    dot_radius = size * 0.04
    draw.ellipse(
        [dot_x - dot_radius, dot_y - dot_radius, 
         dot_x + dot_radius, dot_y + dot_radius],
        fill=COLORS['accent']
    )
    
    return img

def main():
    """Generate all icon sizes"""
    sizes = [16, 32, 48, 128]
    
    # Create icons directory if it doesn't exist
    os.makedirs('icons', exist_ok=True)
    
    for size in sizes:
        print(f"Creating {size}x{size} icon...")
        
        # Use simple icon for smaller sizes, detailed for larger
        if size <= 32:
            img = create_simple_icon(size)
        else:
            img = create_simple_icon(size)
        
        # Save as PNG
        img.save(f'icons/icon{size}.png', 'PNG')
        print(f"  Saved icons/icon{size}.png")
    
    # Also create a 512x512 for the PDF document
    print("Creating 512x512 icon for PDF...")
    img_512 = create_simple_icon(512)
    img_512.save('icons/icon512.png', 'PNG')
    
    print("\nAll icons created successfully!")

if __name__ == '__main__':
    main()
