from pydantic import BaseModel
from typing import Optional

class CustomChartColors(BaseModel):
    # Define defaults for colors
    paper_0: str = "#1a1a1a"
    paper_1: str = "#2a2a2a"
    zodiac_bg: str = "#333333"
    zodiac_radix_ring_0: str = "#444444"
    zodiac_radix_ring_1: str = "#555555"
    zodiac_radix_ring_2: str = "#666666"
    zodiac_icon_0: str = "#ffffff"
    zodiac_icon_1: str = "#eeeeee"
    zodiac_icon_2: str = "#dddddd"
    planets_0: str = "#ffcc00"
    planets_1: str = "#ffaa00"
    aspects_0: str = "#00ccff"
    aspects_1: str = "#00aaff"
    aspects_2: str = "#0088ff"

def generate_chart_svg_from_birth_data(
    name: str,
    year: int,
    month: int,
    day: int,
    hour: int,
    minute: int,
    city: str,
    lat: float,
    lng: float,
    tz_str: str,
    chart_type: str = "Radix",
    colors: Optional[CustomChartColors] = None
) -> str:
    """
    Generates a placeholder SVG chart.
    Full kerykeion integration can be added later.
    """
    try:
        # Simple placeholder SVG to unblock deployment
        bg_color = colors.paper_0 if colors else '#1a1a1a'
        
        return f'''<svg width="500" height="500" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="{bg_color}" />
            <circle cx="250" cy="250" r="200" stroke="white" stroke-width="2" fill="none" />
            <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="20">
                Mapa Astral de {name}
            </text>
            <text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" fill="#ccc" font-size="14">
                {day}/{month}/{year} às {hour}:{minute:02d}
            </text>
            <text x="50%" y="70%" dominant-baseline="middle" text-anchor="middle" fill="#999" font-size="12">
                {city}
            </text>
        </svg>'''
    except Exception as e:
        return f'<svg><text>Error: {str(e)}</text></svg>'
