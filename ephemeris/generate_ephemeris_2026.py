import json
from datetime import datetime, timedelta, timezone

import os
import swisseph as swe

EPHE_PATH = os.path.dirname(__file__)  # mesma pasta onde estão seus .se1
swe.set_ephe_path(EPHE_PATH)


SIGNS_PT = [
    "Áries", "Touro", "Gêmeos", "Câncer", "Leão", "Virgem",
    "Libra", "Escorpião", "Sagitário", "Capricórnio", "Aquário", "Peixes"
]

def lon_to_sign(lon: float):
    lon = lon % 360.0
    sign_index = int(lon // 30)
    deg_in_sign = lon - (sign_index * 30)
    return SIGNS_PT[sign_index], deg_in_sign

# Planetas principais + Nodo + Lilith + Quíron (pra você usar depois se quiser)
BODIES = {
    "Sol": swe.SUN,
    "Lua": swe.MOON,
    "Mercúrio": swe.MERCURY,
    "Vênus": swe.VENUS,
    "Marte": swe.MARS,
    "Júpiter": swe.JUPITER,
    "Saturno": swe.SATURN,
    "Urano": swe.URANUS,
    "Netuno": swe.NEPTUNE,
    "Plutão": swe.PLUTO,
    "NóduloNorte": swe.MEAN_NODE,   # ou swe.TRUE_NODE se preferir
    "Lilith": swe.MEAN_APOG,
    "Quíron": swe.CHIRON,
}

FLAGS = swe.FLG_SWIEPH | swe.FLG_SPEED

def calc_body(jd_ut: float, body_id: int):
    (lon, lat, dist, speed_lon, speed_lat, speed_dist), _ = swe.calc_ut(jd_ut, body_id, FLAGS)
    sign, deg = lon_to_sign(lon)
    return {
        "lon": float(lon % 360.0),
        "sign": sign,
        "deg": float(deg),
        "retro": bool(speed_lon < 0),
        "speed": float(speed_lon),
    }

def main():
    year = 2026

    # vamos fixar TODO dia às 12:00 UTC (não depende da hora que o usuário gera o relatório)
    start = datetime(year, 1, 1, 12, 0, tzinfo=timezone.utc)
    end = datetime(year, 12, 31, 12, 0, tzinfo=timezone.utc)

    days = []
    cur = start
    while cur <= end:
        jd = swe.julday(cur.year, cur.month, cur.day, cur.hour + cur.minute / 60.0)

        bodies = {}
        for name, bid in BODIES.items():
            bodies[name] = calc_body(jd, bid)

        days.append({
            "date": cur.strftime("%Y-%m-%d"),
            "time_utc": "12:00",
            "bodies": bodies
        })

        cur += timedelta(days=1)

    out = {
        "year": year,
        "timezone": "UTC",
        "days": days
    }

    # ajuste o caminho aqui pra salvar direto na pasta do Next
    output_path = "../frontend-nextjs/app/transitos/data/ephemeris_2026.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

    print("OK:", output_path, "dias:", len(days))

if __name__ == "__main__":
    main()
