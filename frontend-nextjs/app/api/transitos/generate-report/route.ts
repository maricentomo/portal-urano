// app/api/transitos/generate-report/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

// >>> instruções fora do route (editável sem quebrar lógica)
// IMPORTANTE: como o seu route está em app/api/transitos/generate-report,
// o path correto sobe 4 níveis:
import { buildTransitos2026Instructions } from "../../../transitos/prompts/transitos2026";


// =====================
// BASE URL (igual seu projeto)
// =====================
const API_BASE_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:8000"
    : "https://api-mapa-astral-production.up.railway.app";

const CALCULATE_API_URL = `${API_BASE_URL}/calculate`;
const CHAT_API_URL = `${API_BASE_URL}/chat`;

// =====================
// TIPOS
// =====================
type BirthData = {
  name: string;
  date: string; // DD/MM/AAAA
  time: string; // HH:MM
  city: string;
  country: string;
};

type CalendarEvent = {
  month: string; // "JANEIRO"
  date: string; // "2026-01-01"
  time: string; // "10:32"
  text: string;
  kind: "aspect" | "ingress" | "lunation" | "retro" | "other";
};

type EphemBody = {
  lon: number; // 0..360
  sign: string;
  deg: number; // 0..30
  retro: boolean;
  speed: number;
};

type EphemDay = {
  date: string; // "2026-01-01"
  time_utc: string;
  bodies: Record<string, EphemBody>;
};

type EphemerisApiResponse = {
  year: number;
  timezone: string;
  days: EphemDay[];
};

type AspectType = "Conjunção" | "Oposição" | "Quadratura" | "Trígono";

type AspectInterval = {
  owner_month: string; // mês do START (ainda útil como metadado)
  tPlanet: string;
  nPlanet: string;
  aspect: AspectType;
  start: string; // ISO (YYYY-MM-DD)
  end: string; // ISO
  peak: string; // ISO (não usar no texto final)
  duration_days: number;

  tSign_peak: string;
  tDeg_peak: number;
  tHouse_peak: number;

  nSign: string;
  nDeg: number;
  nHouse: number;
};

type Segment = {
  start: string; // ISO
  end: string; // ISO
  sign: string;
  house: number;
};

// =====================
// CONSTANTES
// =====================
const MONTH_ORDER = [
  "JANEIRO",
  "FEVEREIRO",
  "MARÇO",
  "ABRIL",
  "MAIO",
  "JUNHO",
  "JULHO",
  "AGOSTO",
  "SETEMBRO",
  "OUTUBRO",
  "NOVEMBRO",
  "DEZEMBRO",
];

const SIGN_ORDER = [
  "Áries",
  "Touro",
  "Gêmeos",
  "Câncer",
  "Leão",
  "Virgem",
  "Libra",
  "Escorpião",
  "Sagitário",
  "Capricórnio",
  "Aquário",
  "Peixes",
];

const SIGN_INDEX: Record<string, number> = Object.fromEntries(
  SIGN_ORDER.map((s, i) => [s, i])
);

const SLOW_PLANETS = ["Júpiter", "Saturno", "Urano", "Netuno", "Plutão"] as const;
const FAST_FOR_MONTH = ["Sol", "Mercúrio", "Vênus", "Marte"] as const;

// não calcular aspectos com nodos (nem sul nem norte)
const NATAL_EXCLUDE = new Set(["NóduloSul", "NóduloNorte", "Nodo Sul", "Nodo Norte"]);

// Aspectos que você usa
const ASPECTS: AspectType[] = ["Conjunção", "Oposição", "Quadratura", "Trígono"];

// Orbes
// IMPORTANTÍSSIMO: agora tem Mercúrio também, senão ele nunca gera aspectos.
const ORBS: Record<string, Partial<Record<AspectType, number>>> = {
  Sol: { Conjunção: 5, Oposição: 4, Quadratura: 3, Trígono: 3 },
  Mercúrio: { Conjunção: 4, Oposição: 3, Quadratura: 2, Trígono: 2 },
  Vênus: { Conjunção: 3, Oposição: 3, Quadratura: 2, Trígono: 2 },
  Marte: { Conjunção: 4, Oposição: 3, Quadratura: 2, Trígono: 2 },

  Júpiter: { Conjunção: 3, Oposição: 3, Quadratura: 2, Trígono: 2 },
  Saturno: { Conjunção: 3, Oposição: 3, Quadratura: 2, Trígono: 2 },
  Urano: { Conjunção: 2, Oposição: 2, Quadratura: 2, Trígono: 2 },
  Netuno: { Conjunção: 2, Oposição: 2, Quadratura: 2, Trígono: 2 },
  Plutão: { Conjunção: 2, Oposição: 2, Quadratura: 2, Trígono: 2 },
};

// =====================
// HELPERS gerais
// =====================
function stripAccents(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function monthNameFromISO(iso: string) {
  const mm = iso.slice(5, 7);
  const idx = parseInt(mm, 10) - 1;
  return MONTH_ORDER[idx] ?? `MÊS_${mm}`;
}

function detectKind(text: string): CalendarEvent["kind"] {
  const t = text.toLowerCase();

  if (
    t.startsWith("conjunção") ||
    t.startsWith("quadratura") ||
    t.startsWith("oposição") ||
    t.startsWith("trígono")
  ) {
    return "aspect";
  }
  if (t.includes(" entra em ")) return "ingress";
  if (t.includes("lua nova") || t.includes("lua cheia") || t.includes("eclipse")) return "lunation";
  if (t.includes("retrógrado") || t.includes("retrógrada") || t.startsWith("fim de ")) return "retro";

  return "other";
}

const MONTHS: Record<string, string> = {
  JANEIRO: "01",
  FEVEREIRO: "02",
  MARCO: "03",
  "MARÇO": "03",
  ABRIL: "04",
  MAIO: "05",
  JUNHO: "06",
  JULHO: "07",
  AGOSTO: "08",
  SETEMBRO: "09",
  OUTUBRO: "10",
  NOVEMBRO: "11",
  DEZEMBRO: "12",
};

function parseCalendarTxt(raw: string): CalendarEvent[] {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let currentMonth = "";
  let currentMonthNum = "";

  const events: CalendarEvent[] = [];

  for (const line of lines) {
    if (line.toUpperCase().startsWith("CALENDÁRIO")) continue;

    const upper = line.toUpperCase();
    const normalized = stripAccents(upper);

    if (MONTHS[upper] || MONTHS[normalized]) {
      currentMonth = upper;
      currentMonthNum = MONTHS[upper] ?? MONTHS[normalized];
      continue;
    }

    const m = line.match(/^(\d{2})\/(\d{2}),\s*(\d{2}:\d{2}):\s*(.+)$/);
    if (!m) continue;

    const day = m[1];
    const monthFromLine = m[2];
    const time = m[3];
    const text = m[4].trim();

    const monthNum = currentMonthNum || monthFromLine;

    events.push({
      month: currentMonth || `MÊS_${monthNum}`,
      date: `2026-${monthNum}-${day}`,
      time,
      text,
      kind: detectKind(text),
    });
  }

  return events;
}

// bounds real do mês (último dia real, não "31" fake)
function monthBounds(year: number, monthIndex1: number) {
  const start = new Date(Date.UTC(year, monthIndex1 - 1, 1));
  const end = new Date(Date.UTC(year, monthIndex1, 0)); // último dia do mês
  const startISO = start.toISOString().slice(0, 10);
  const endISO = end.toISOString().slice(0, 10);
  return { startISO, endISO };
}

// overlap real: qualquer parte do aspecto dentro do mês entra
function overlapsISO(startA: string, endA: string, startB: string, endB: string) {
  return startA <= endB && endA >= startB;
}

// =====================
// Astrologia / matemática
// =====================
function absLonFromSignDeg(sign: string, deg: number) {
  const idx = SIGN_INDEX[sign];
  if (idx === undefined) return deg;
  return idx * 30 + deg;
}

function lonToSignDeg(lon: number) {
  const norm = ((lon % 360) + 360) % 360;
  const idx = Math.floor(norm / 30);
  const sign = SIGN_ORDER[idx] ?? "";
  const deg = norm - idx * 30;
  return { sign, deg };
}

function diffAngle(a: number, b: number) {
  const d = Math.abs(((a - b + 180) % 360) - 180);
  return d;
}

function aspectAngle(aspect: AspectType) {
  if (aspect === "Conjunção") return 0;
  if (aspect === "Oposição") return 180;
  if (aspect === "Quadratura") return 90;
  return 120;
}

function buildHouseCuspsUnwrapped(mapData: any): number[] {
  const houses = (mapData?.houses ?? []) as any[];
  if (!houses.length) return [];

  const cusps = houses
    .slice()
    .sort((a, b) => (a.house ?? 0) - (b.house ?? 0))
    .map((h) => absLonFromSignDeg(String(h.sign), Number(h.degree ?? 0)));

  const out: number[] = [];
  for (let i = 0; i < cusps.length; i++) {
    let v = cusps[i];
    if (i === 0) {
      out.push(v);
      continue;
    }
    while (v <= out[i - 1]) v += 360;
    out.push(v);
  }
  return out;
}

function houseOfLongitude(lon: number, cuspsUnwrapped: number[]) {
  if (!cuspsUnwrapped.length) return 0;

  const base = cuspsUnwrapped[0];
  let lonU = ((lon % 360) + 360) % 360;
  while (lonU < base) lonU += 360;

  const bounds = [...cuspsUnwrapped, cuspsUnwrapped[0] + 360];

  for (let i = 0; i < 12; i++) {
    if (lonU >= bounds[i] && lonU < bounds[i + 1]) return i + 1;
  }
  return 12;
}

function buildSegmentsForBody(days: EphemDay[], bodyName: string, cuspsUnwrapped: number[]): Segment[] {
  const segs: Segment[] = [];
  let cur: Segment | null = null;

  for (const d of days) {
    const b = d.bodies?.[bodyName];
    if (!b) continue;

    const house = houseOfLongitude(b.lon, cuspsUnwrapped);
    const sign = b.sign;

    if (!cur) {
      cur = { start: d.date, end: d.date, sign, house };
      continue;
    }

    if (cur.house === house && cur.sign === sign) {
      cur.end = d.date;
    } else {
      segs.push(cur);
      cur = { start: d.date, end: d.date, sign, house };
    }
  }

  if (cur) segs.push(cur);
  return segs;
}

function buildRetroPeriods(days: EphemDay[], bodyName: string) {
  const out: { start: string; end: string }[] = [];
  let open: { start: string; end: string } | null = null;

  for (const d of days) {
    const b = d.bodies?.[bodyName];
    if (!b) continue;

    if (b.retro) {
      if (!open) open = { start: d.date, end: d.date };
      else open.end = d.date;
    } else {
      if (open) {
        out.push(open);
        open = null;
      }
    }
  }
  if (open) out.push(open);
  return out;
}

function daysBetweenInclusive(startISO: string, endISO: string) {
  const a = new Date(startISO + "T00:00:00Z").getTime();
  const b = new Date(endISO + "T00:00:00Z").getTime();
  const d = Math.round((b - a) / (1000 * 60 * 60 * 24));
  return d + 1;
}

function buildAspectIntervalsForTransitPlanet(
  days: EphemDay[],
  mapData: any,
  cuspsUnwrapped: number[],
  tPlanet: string,
  allowedNatalPlanets: Set<string>
): AspectInterval[] {
  const natalPositions = (mapData?.positions ?? []) as any[];

  const natal = natalPositions
    .filter((p) => p?.planet && p?.sign != null && p?.degree != null)
    .map((p) => ({
      planet: String(p.planet),
      sign: String(p.sign),
      deg: Number(p.degree),
      lon: absLonFromSignDeg(String(p.sign), Number(p.degree)),
      house: Number(p.house ?? 0),
    }))
    .filter((p) => allowedNatalPlanets.has(p.planet));

  const orbs = ORBS[tPlanet];
  if (!orbs) return [];

  const intervals: AspectInterval[] = [];

  for (const n of natal) {
    for (const aspect of ASPECTS) {
      const orb = orbs[aspect];
      if (orb == null) continue;

      let open: any = null;

      for (const d of days) {
        const t = d.bodies?.[tPlanet];
        if (!t) continue;

        const A = aspectAngle(aspect);
        const delta = diffAngle(t.lon, n.lon);
        const dist = Math.abs(delta - A);
        const inside = dist <= orb;

        if (inside) {
          if (!open) {
            const tHouse = houseOfLongitude(t.lon, cuspsUnwrapped);
            const { sign: tSign, deg: tDeg } = lonToSignDeg(t.lon);

            open = {
              owner_month: monthNameFromISO(d.date),
              tPlanet,
              nPlanet: n.planet,
              aspect,
              start: d.date,
              end: d.date,
              peak: d.date,
              bestDist: dist,
              tSign_peak: tSign,
              tDeg_peak: tDeg,
              tHouse_peak: tHouse,
              nSign: n.sign,
              nDeg: n.deg,
              nHouse: n.house,
            };
          } else {
            open.end = d.date;
            if (dist < open.bestDist) {
              open.bestDist = dist;
              open.peak = d.date;
              open.tHouse_peak = houseOfLongitude(t.lon, cuspsUnwrapped);
              const { sign: tSign, deg: tDeg } = lonToSignDeg(t.lon);
              open.tSign_peak = tSign;
              open.tDeg_peak = tDeg;
            }
          }
        } else {
          if (open) {
            intervals.push({
              owner_month: open.owner_month,
              tPlanet: open.tPlanet,
              nPlanet: open.nPlanet,
              aspect: open.aspect,
              start: open.start,
              end: open.end,
              peak: open.peak,
              duration_days: daysBetweenInclusive(open.start, open.end),
              tSign_peak: open.tSign_peak,
              tDeg_peak: open.tDeg_peak,
              tHouse_peak: open.tHouse_peak,
              nSign: open.nSign,
              nDeg: open.nDeg,
              nHouse: open.nHouse,
            });
            open = null;
          }
        }
      }

      if (open) {
        intervals.push({
          owner_month: open.owner_month,
          tPlanet: open.tPlanet,
          nPlanet: open.nPlanet,
          aspect: open.aspect,
          start: open.start,
          end: open.end,
          peak: open.peak,
          duration_days: daysBetweenInclusive(open.start, open.end),
          tSign_peak: open.tSign_peak,
          tDeg_peak: open.tDeg_peak,
          tHouse_peak: open.tHouse_peak,
          nSign: open.nSign,
          nDeg: open.nDeg,
          nHouse: open.nHouse,
        });
      }
    }
  }

  intervals.sort((a, b) => `${a.start}`.localeCompare(`${b.start}`));
  return intervals;
}

// =====================
// ROUTE
// =====================
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const birthData: BirthData | undefined = body?.birthData;

    if (
      !birthData?.name ||
      !birthData?.date ||
      !birthData?.time ||
      !birthData?.city ||
      !birthData?.country
    ) {
      return new NextResponse(
        JSON.stringify({ error: "birthData inválido. Precisa: name,date,time,city,country" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 1) calcula mapa natal
    const calcRes = await fetch(CALCULATE_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(birthData),
    });

    if (!calcRes.ok) {
      const t = await calcRes.text().catch(() => "");
      throw new Error(`Erro ao calcular mapa: HTTP ${calcRes.status} ${t}`);
    }

    const mapData = await calcRes.json();
    const cuspsUnwrapped = buildHouseCuspsUnwrapped(mapData);

    // 2) lê arquivos locais
    const calendarPath = path.join(process.cwd(), "app", "transitos", "data", "calendar_2026.txt");
    const ephemPath = path.join(process.cwd(), "app", "transitos", "data", "ephemeris_2026.json");

    const [calendarRaw, ephemRaw] = await Promise.all([
      fs.readFile(calendarPath, "utf-8"),
      fs.readFile(ephemPath, "utf-8"),
    ]);

    const calendarEvents = parseCalendarTxt(calendarRaw);
    const ephem = JSON.parse(ephemRaw) as EphemerisApiResponse;

    if (!ephem?.days?.length) {
      throw new Error("ephemeris_2026.json inválido (sem days).");
    }

    // 3) planetas natais permitidos (sem nodos)
    const allowedNatalPlanets = new Set<string>();
    for (const p of (mapData?.positions ?? []) as any[]) {
      const name = String(p?.planet ?? "");
      if (!name) continue;
      if (NATAL_EXCLUDE.has(name)) continue;
      allowedNatalPlanets.add(name);
    }

    // 4) PANORAMA ANUAL (lentos: casa/signo + retro + aspectos)
    const slow = SLOW_PLANETS.map((pl) => {
      const segments = buildSegmentsForBody(ephem.days, pl, cuspsUnwrapped);
      const retro_periods = buildRetroPeriods(ephem.days, pl);

      const aspects = buildAspectIntervalsForTransitPlanet(
        ephem.days,
        mapData,
        cuspsUnwrapped,
        pl,
        allowedNatalPlanets
      );

      return { planet: pl, segments, retro_periods, aspects };
    });

    // 4.1) ASPECTOS RÁPIDOS DO ANO (calcula 1 vez; depois só filtra por mês)
    const fastYearAspects = {
      Sol: buildAspectIntervalsForTransitPlanet(ephem.days, mapData, cuspsUnwrapped, "Sol", allowedNatalPlanets),
      Mercúrio: buildAspectIntervalsForTransitPlanet(ephem.days, mapData, cuspsUnwrapped, "Mercúrio", allowedNatalPlanets),
      Vênus: buildAspectIntervalsForTransitPlanet(ephem.days, mapData, cuspsUnwrapped, "Vênus", allowedNatalPlanets),
      Marte: buildAspectIntervalsForTransitPlanet(ephem.days, mapData, cuspsUnwrapped, "Marte", allowedNatalPlanets),
    } as const;

    // 5) ANÁLISE MENSAL (filtro por overlap real)
    const monthBlocks = MONTH_ORDER.map((month) => {
      const lunations = calendarEvents.filter(
        (e) => e.kind === "lunation" && monthNameFromISO(e.date) === month
      );

      const placements = Object.fromEntries(
        FAST_FOR_MONTH.map((pl) => [pl, buildSegmentsForBody(ephem.days, pl, cuspsUnwrapped)])
      ) as Record<string, Segment[]>;

      const mIdx = MONTH_ORDER.indexOf(month) + 1;
      const { startISO: startBound, endISO: endBound } = monthBounds(2026, mIdx);

      function clipSeg(seg: Segment) {
        const start = seg.start < startBound ? startBound : seg.start;
        const end = seg.end > endBound ? endBound : seg.end;
        if (end < startBound || start > endBound) return null;
        return { ...seg, start, end };
      }

      const clippedPlacements: Record<string, Segment[]> = {};
      for (const pl of FAST_FOR_MONTH) {
        clippedPlacements[pl] = (placements[pl] ?? []).map(clipSeg).filter(Boolean) as Segment[];
      }

      // aspectos do mês: Sol / Mercúrio / Vênus / Marte (overlap real)
      const monthAspectsAll: AspectInterval[] = [
        ...fastYearAspects.Sol,
        ...fastYearAspects["Mercúrio"],
        ...fastYearAspects.Vênus,
        ...fastYearAspects.Marte,
      ]
        .filter((a) => overlapsISO(a.start, a.end, startBound, endBound))
        .sort((a, b) => a.start.localeCompare(b.start));

      return {
        month,
        lunations,
        placements: clippedPlacements,
        aspects: monthAspectsAll,
      };
    });

    // 6) instruções (do arquivo separado)
    const instructions = buildTransitos2026Instructions(birthData, 2026);

    const payloadForAI = {
      birthData,
      year: 2026,
      slow_planets: slow,
      months: monthBlocks,
      natal_snapshot: {
        asc: (mapData?.positions ?? []).find((p: any) => p.planet === "Ascendente") ?? null,
        mc: (mapData?.positions ?? []).find((p: any) => p.planet === "MeioCéu") ?? null,
        sun: (mapData?.positions ?? []).find((p: any) => p.planet === "Sol") ?? null,
        moon: (mapData?.positions ?? []).find((p: any) => p.planet === "Lua") ?? null,
      },
    };

    const message =
      `Gere o relatório completo seguindo as INSTRUÇÕES abaixo.\n\n` +
      `INSTRUÇÕES:\n${instructions}\n\n` +
      `DADOS (JSON):\n${JSON.stringify(payloadForAI)}`;

    // 7) chama sua IA via /chat (Railway) e devolve texto final
    const chatRes = await fetch(CHAT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        history: [],
        map_data: mapData,
        transit_data: payloadForAI,
      }),
    });

    if (!chatRes.ok) {
      const t = await chatRes.text().catch(() => "");
      throw new Error(`Erro na IA (/chat): HTTP ${chatRes.status} ${t}`);
    }

    const chatJson = await chatRes.json();
    const reportText = chatJson?.response ?? "";

    return NextResponse.json({
      ok: true,
      year: 2026,
      report: reportText,
      debug: {
        slow_planets_count: slow.length,
        months_count: monthBlocks.length,
        calendar_events: calendarEvents.length,
        ephem_days: ephem.days.length,
      },
    });
  } catch (err: any) {
    return new NextResponse(
      JSON.stringify({
        error: "Falha ao gerar relatório de trânsitos",
        detail: err?.message ?? String(err),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
