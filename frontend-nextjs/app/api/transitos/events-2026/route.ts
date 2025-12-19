export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

type CalendarEvent = {
  month: string;      // "JANEIRO"
  date: string;       // "2026-01-01"
  time: string;       // "10:32"
  text: string;       // "Quadratura Mercúrio-Netuno"
  kind: 'aspect' | 'ingress' | 'lunation' | 'retro' | 'other';
};

const MONTHS: Record<string, string> = {
  JANEIRO: '01',
  FEVEREIRO: '02',
  MARCO: '03',
  'MARÇO': '03',
  ABRIL: '04',
  MAIO: '05',
  JUNHO: '06',
  JULHO: '07',
  AGOSTO: '08',
  SETEMBRO: '09',
  OUTUBRO: '10',
  NOVEMBRO: '11',
  DEZEMBRO: '12',
};

function stripAccents(s: string) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function detectKind(text: string): CalendarEvent['kind'] {
  const t = text.toLowerCase();

  if (t.startsWith('conjunção') || t.startsWith('quadratura') || t.startsWith('oposição') || t.startsWith('trígono')) {
    return 'aspect';
  }
  if (t.includes(' entra em ')) return 'ingress';
  if (t.includes('lua nova') || t.includes('lua cheia') || t.includes('eclipse')) return 'lunation';
  if (t.includes('retrógrado') || t.includes('retrógrada') || t.startsWith('fim de ')) return 'retro';

  return 'other';
}

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'app', 'transitos', 'data', 'calendar_2026.txt');
    const raw = await fs.readFile(filePath, 'utf-8');

    const lines = raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    let currentMonth = '';
    let currentMonthNum = '';

    const events: CalendarEvent[] = [];

    for (const line of lines) {
      // ignora cabeçalho
      if (line.toUpperCase().startsWith('CALENDÁRIO')) continue;

      // mês (JANEIRO, FEVEREIRO...)
      const upper = line.toUpperCase();
      const normalized = stripAccents(upper);

      if (MONTHS[upper] || MONTHS[normalized]) {
        currentMonth = upper;
        currentMonthNum = MONTHS[upper] ?? MONTHS[normalized];
        continue;
      }

      // evento: 01/01, 10:32: Texto...
      const m = line.match(/^(\d{2})\/(\d{2}),\s*(\d{2}:\d{2}):\s*(.+)$/);
      if (!m) continue;

      const day = m[1];
      const monthFromLine = m[2]; // vem no próprio texto, mas a gente usa o do "mês" atual
      const time = m[3];
      const text = m[4].trim();

      // se o arquivo tiver o mês no header, usamos ele. Se não, caímos no mês do próprio evento.
      const monthNum = currentMonthNum || monthFromLine;

      events.push({
        month: currentMonth || `MÊS_${monthNum}`,
        date: `2026-${monthNum}-${day}`,
        time,
        text,
        kind: detectKind(text),
      });
    }

    return NextResponse.json({ year: 2026, events });
  } catch (err: any) {
    return new NextResponse(
      JSON.stringify({ error: 'Falha ao ler calendar_2026.txt', detail: err?.message ?? String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
