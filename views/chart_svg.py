import math
import base64
from pathlib import Path
from typing import Dict, Any, Optional, List


class CustomChartColors:
    def __init__(self):
        # Fundo transparente
        self.background_color = "none"

        # Cores dos signos (cinturão zodiacal)
        self.fire_air_color = "#5b9494"
        self.earth_water_color = "#854984"

        # Linhas das casas (usado só como base; cores específicas são definidas na função)
        self.house_line_color = "#000000"

        # Aspectos
        self.aspect_soft_color = "#4d6ea5"
        self.aspect_hard_color = "#bc4747"

        # Círculos internos
        self.chart_outline_color = "#000000"
        self.chart_inner_circle_color = "#000000"

        # Texto genérico (nome da pessoa etc.)
        self.text_color = "#111111"


ZODIAC_SIGNS = [
    "Áries", "Touro", "Gêmeos", "Câncer", "Leão", "Virgem",
    "Libra", "Escorpião", "Sagitário", "Capricórnio", "Aquário", "Peixes"
]

ELEMENT_MAP = {
    "Áries": "Fogo", "Leão": "Fogo", "Sagitário": "Fogo",
    "Touro": "Terra", "Virgem": "Terra", "Capricórnio": "Terra",
    "Gêmeos": "Ar", "Libra": "Ar", "Aquário": "Ar",
    "Câncer": "Água", "Escorpião": "Água", "Peixes": "Água",
}

PLANET_SYMBOLS = {
    "Sol": "☉", "Lua": "☽", "Mercúrio": "☿", "Vênus": "♀", "Marte": "♂",
    "Júpiter": "♃", "Saturno": "♄", "Urano": "♅", "Netuno": "♆",
    "Plutão": "♇", "Quíron": "⚷", "Lilith": "⚸",
    "NóduloNorte": "☊", "NóduloSul": "☋",
}

# Nomes possíveis para ASC e MC na lista de posições/aspectos
ASC_NAMES = {
    "ASC", "Asc", "Ascendente", "ASCENDENTE", "Ascendant"
}
MC_NAMES = {
    "MC", "Meio do Céu", "MeioCéu", "MeioDoCeu", "Meio-do-Céu", "Medium Coeli"
}

# Nodo Sul – não desenhar
NODE_SOUTH_NAMES = {
    "NóduloSul", "NodoSul", "Nodo Sul", "Nódulo Sul", "South Node"
}

# Planetas/pontos que NÃO devem ter aspectos (Nodo Norte + Nodo Sul)
EXCLUDED_PLANETS_FROM_ASPECTS = {
    "NóduloNorte", "NodoNorte", "Nodo Norte", "Nódulo Norte", "North Node",
    *NODE_SOUTH_NAMES,
}


# ------------------------------------------------------------------
#   CARREGA OS SVG DOS SIGNOS DA PASTA views/signos
# ------------------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent
SIGNOS_DIR = BASE_DIR / "signos"

SIGN_SVG_FILES = {
    "Áries": "aries.svg",
    "Touro": "touro.svg",
    "Gêmeos": "gemeos.svg",
    "Câncer": "cancer.svg",
    "Leão": "leao.svg",
    "Virgem": "virgem.svg",
    "Libra": "libra.svg",
    "Escorpião": "escorpiao.svg",
    "Sagitário": "sagitario.svg",
    "Capricórnio": "capricornio.svg",
    "Aquário": "aquario.svg",
    "Peixes": "peixes.svg",
}


def _load_sign_svg_data() -> Dict[str, str]:
    """
    Lê cada arquivo .svg em views/signos e devolve um
    data:image/svg+xml;base64,... pra usar no <image>.
    """
    data: Dict[str, str] = {}
    for sign, filename in SIGN_SVG_FILES.items():
        path = SIGNOS_DIR / filename
        try:
            raw = path.read_bytes()
        except FileNotFoundError:
            # se faltar algum arquivo, simplesmente não desenha o ícone dele
            continue
        b64 = base64.b64encode(raw).decode("ascii")
        data[sign] = f"data:image/svg+xml;base64,{b64}"
    return data


SIGN_SVG_DATA = _load_sign_svg_data()


# ------------------------------------------------------------------
#   FUNÇÕES AUXILIARES
# ------------------------------------------------------------------


def _is_asc(name: str) -> bool:
    return name in ASC_NAMES


def _is_mc(name: str) -> bool:
    return name in MC_NAMES


def _is_node_south(name: str) -> bool:
    return name in NODE_SOUTH_NAMES


def _sign_to_index(sign: str) -> int:
    try:
        return ZODIAC_SIGNS.index(sign)
    except ValueError:
        return 0


def _longitude_from_sign_degree(sign: str, degree: float) -> float:
    idx = _sign_to_index(sign)
    return idx * 30.0 + degree


def _polar_to_cartesian(cx, cy, r, longitude_deg, asc_longitude):
    """
    ASC na ESQUERDA: rotação de +180° em relação ao ASC.
    """
    angle_deg = (longitude_deg - asc_longitude + 180.0) % 360.0

    theta = math.radians(angle_deg)
    x = cx + r * math.cos(theta)
    y = cy - r * math.sin(theta)
    return x, y


def _ring_sector_path(cx, cy, inner_r, outer_r, start_deg, end_deg, asc_longitude):
    x1o, y1o = _polar_to_cartesian(cx, cy, outer_r, start_deg, asc_longitude)
    x2o, y2o = _polar_to_cartesian(cx, cy, outer_r, end_deg, asc_longitude)

    x1i, y1i = _polar_to_cartesian(cx, cy, inner_r, start_deg, asc_longitude)
    x2i, y2i = _polar_to_cartesian(cx, cy, inner_r, end_deg, asc_longitude)

    large = 1 if (end_deg - start_deg) % 360 > 180 else 0

    return (
        f"M {x1o:.2f} {y1o:.2f} "
        f"A {outer_r:.2f} {outer_r:.2f} 0 {large} 0 {x2o:.2f} {y2o:.2f} "
        f"L {x2i:.2f} {y2i:.2f} "
        f"A {inner_r:.2f} {inner_r:.2f} 0 {large} 1 {x1i:.2f} {y1i:.2f} Z"
    )


def _build_zodiac_ring(cx, cy, inner_r, outer_r, colors, asc_longitude):
    parts = []

    for i, sign in enumerate(ZODIAC_SIGNS):
        sdeg = i * 30
        edeg = sdeg + 30

        elem = ELEMENT_MAP[sign]
        fill = colors.fire_air_color if elem in ("Fogo", "Ar") else colors.earth_water_color

        path = _ring_sector_path(cx, cy, inner_r, outer_r, sdeg, edeg, asc_longitude)

        # Cinturão colorido, sem borda
        parts.append(
            f'<path d="{path}" fill="{fill}" stroke="none"/>'
        )

        # Posição do símbolo do signo
        mid = (sdeg + edeg) / 2
        sym_radius = (inner_r + outer_r) / 2.0
        tx, ty = _polar_to_cartesian(cx, cy, sym_radius, mid, asc_longitude)

        href = SIGN_SVG_DATA.get(sign)

        if href:
            # desenha o teu SVG como image embutida
            size = 24  # tamanho em px do ícone
            parts.append(
                f'<image href="{href}" '
                f'x="{tx - size/2:.2f}" y="{ty - size/2:.2f}" '
                f'width="{size}" height="{size}"/>'
            )
        else:
            # fallback: se faltar arquivo, usa texto mesmo
            parts.append(
                f'<text x="{tx:.2f}" y="{ty:.2f}" fill="#000000" '
                f'font-size="18" text-anchor="middle" '
                f'dominant-baseline="middle">{sign}</text>'
            )

    return "\n".join(parts)


def _build_house_circles_and_lines(cx, cy, inner_r, outer_r, houses, colors, asc_longitude):
    parts = []

    # círculos das casas (mesmos raios do cinturão zodiacal)
    parts.append(
        f'<circle cx="{cx}" cy="{cy}" r="{outer_r}" fill="none" '
        f'stroke="{colors.chart_outline_color}" stroke-width="1.0"/>'
    )
    parts.append(
        f'<circle cx="{cx}" cy="{cy}" r="{inner_r}" fill="none" '
        f'stroke="{colors.chart_inner_circle_color}" stroke-width="0.8"/>'
    )

    # linhas radiais das casas
    arrow_r = outer_r + 15  # extensão bem curta para fora

    for idx, h in enumerate(houses):
        sign = h["sign"]
        deg = float(h.get("degree", h.get("cusp_degree", 0)))
        lon = _longitude_from_sign_degree(sign, deg)

        line_r = outer_r
        marker = ""
        # padrão: linhas finas e cinza escuro
        stroke_width = 0.7
        stroke_color = "#3f3f3e"

        # casas 1, 7, 4 e 10 => eixos principais mais grossos e pretos
        if idx in (0, 6, 3, 9):
            stroke_width = 1.1
            stroke_color = "#000000"

        # casa 1 (ASC) e casa 10 (MC) com seta estendida
        if idx == 0 or idx == 9:
            line_r = arrow_r
            marker = ' marker-end="url(#arrowhead)"'

        x2, y2 = _polar_to_cartesian(cx, cy, line_r, lon, asc_longitude)
        parts.append(
            f'<line x1="{cx}" y1="{cy}" x2="{x2:.2f}" y2="{y2:.2f}" '
            f'stroke="{stroke_color}" stroke-width="{stroke_width}"{marker}/>'
        )

    return "\n".join(parts)


def _build_aspects(cx, cy, radius, positions, aspects, colors, asc_longitude):
    parts = []

    planet_lon = {}
    for p in positions:
        planet_name = p["planet"]
        lon = _longitude_from_sign_degree(p["sign"], float(p["degree"]))
        planet_lon[planet_name] = lon

    for asp in aspects:
        p1 = asp["planet1"]
        p2 = asp["planet2"]

        # ignora aspectos de Nodo Norte / Nodo Sul
        if p1 in EXCLUDED_PLANETS_FROM_ASPECTS or p2 in EXCLUDED_PLANETS_FROM_ASPECTS:
            continue

        if p1 not in planet_lon or p2 not in planet_lon:
            continue

        lon1 = planet_lon[p1]
        lon2 = planet_lon[p2]

        atype = asp["aspect_type"].lower()
        if "trígono" in atype or "sextil" in atype:
            col = colors.aspect_soft_color
        elif "quadratura" in atype or "oposição" in atype:
            col = colors.aspect_hard_color
        else:
            continue

        x1, y1 = _polar_to_cartesian(cx, cy, radius, lon1, asc_longitude)
        x2, y2 = _polar_to_cartesian(cx, cy, radius, lon2, asc_longitude)

        parts.append(
            f'<line x1="{x1:.2f}" y1="{y1:.2f}" x2="{x2:.2f}" y2="{y2:.2f}" '
            f'stroke="{col}" stroke-width="1.2" stroke-opacity="0.9"/>'
        )

    return "\n".join(parts)


def _build_planets(cx, cy, radius, positions, colors, asc_longitude):
    parts = []

    for p in positions:
        planet_name = p["planet"]

        # tira Nodo Sul do desenho
        if _is_node_south(planet_name):
            continue

        lon = _longitude_from_sign_degree(p["sign"], float(p["degree"]))
        x, y = _polar_to_cartesian(cx, cy, radius, lon, asc_longitude)

        # símbolo e cor especiais para ASC e MC
        if _is_asc(planet_name):
            symbol = "ASC"
            fill_color = "#00ac95"
            font_size = 11  # menor para ASC
        elif _is_mc(planet_name):
            symbol = "MC"
            fill_color = "#00ac95"
            font_size = 11  # menor para MC
        else:
            symbol = PLANET_SYMBOLS.get(planet_name, "?")
            fill_color = "#000000"  # fundo preto pros planetas
            font_size = 13

        # círculo SEM borda
        parts.append(
            f'<circle cx="{x:.2f}" cy="{y:.2f}" r="10" fill="{fill_color}" '
            f'stroke="none"/>'
        )
        # símbolo em #fcf5e1
        parts.append(
            f'<text x="{x:.2f}" y="{y:.2f}" fill="#fcf5e1" '
            f'font-size="{font_size}" text-anchor="middle" '
            f'dominant-baseline="middle">{symbol}</text>'
        )

    return "\n".join(parts)


def generate_chart_svg(name, map_data, colors=None):
    if colors is None:
        colors = CustomChartColors()

    positions = map_data["positions"]
    houses = map_data["houses"]
    aspects = map_data["aspects"]

    width = 800
    height = 800
    cx = width / 2
    cy = height / 2

    # raios – cinturão zodiacal e casas com o MESMO tamanho
    house_outer_r = 250
    house_inner_r = 210

    zodiac_outer_r = house_outer_r
    zodiac_inner_r = house_inner_r

    planets_r = 190
    aspects_r = 190

    # ASC = Casa 1
    asc_sign = houses[0]["sign"]
    asc_deg = float(houses[0].get("degree", houses[0].get("cusp_degree", 0)))
    asc_longitude = _longitude_from_sign_degree(asc_sign, asc_deg)

    svg = []

    svg.append(
        f'<svg xmlns="http://www.w3.org/2000/svg" '
        f'width="{width}" height="{height}" viewBox="0 0 {width} {height}">'
    )

    # Fundo
    svg.append(
        f'<rect x="0" y="0" width="{width}" height="{height}" '
        f'fill="{colors.background_color}"/>'
    )

    # Definição da seta para ASC e MC (em preto)
    svg.append(
        '''<defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="7"
        refX="0" refY="3.5" orient="auto" markerUnits="strokeWidth">
        <polygon points="0 0, 10 3.5, 0 7"
            fill="#000000" />
    </marker>
</defs>'''
    )

    # Cinturão zodiacal (mesmos raios das casas)
    svg.append(
        _build_zodiac_ring(
            cx, cy, zodiac_inner_r, zodiac_outer_r, colors, asc_longitude
        )
    )

    # Casas (linhas + círculos)
    svg.append(
        _build_house_circles_and_lines(
            cx, cy, house_inner_r, house_outer_r, houses, colors, asc_longitude
        )
    )

    # Aspectos
    svg.append(
        _build_aspects(
            cx, cy, aspects_r, positions, aspects, colors, asc_longitude
        )
    )

    # Planetas (incluindo ASC e MC com cor especial)
    svg.append(
        _build_planets(
            cx, cy, planets_r, positions, colors, asc_longitude
        )
    )

  

    return "\n".join(svg)
