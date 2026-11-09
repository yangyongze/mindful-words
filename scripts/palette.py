"""Icon colours shared by the PNG generator and the design sheet."""

# Current icon system — C1b opening quotes, paper & ink.
INK = '#171A20'
PAPER = '#F2EBDC'

# Legacy palette from the original blue-circle / open-book icon.
# Kept so archived design sheets and older scripts still resolve their names.
PRIMARY_BLUE = '#3B82F6'
SECONDARY_GREEN = '#10B981'
ACCENT_ORANGE = '#F97316'
DARK_SLATE = '#1E293B'
WHITE = '#FFFFFF'


def rgb(hex_colour):
    value = hex_colour.lstrip('#')
    return tuple(int(value[index:index + 2], 16) for index in (0, 2, 4))
