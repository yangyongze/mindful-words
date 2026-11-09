"""Icon colours shared by the PNG generator and the design sheet."""

PRIMARY_BLUE = '#3B82F6'
SECONDARY_GREEN = '#10B981'
ACCENT_ORANGE = '#F97316'
DARK_SLATE = '#1E293B'
WHITE = '#FFFFFF'


def rgb(hex_colour):
    value = hex_colour.lstrip('#')
    return tuple(int(value[index:index + 2], 16) for index in (0, 2, 4))
