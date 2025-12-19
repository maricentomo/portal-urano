export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(
      process.cwd(),
      'app',
      'transitos',
      'data',
      'ephemeris_2026.json'
    );

    const raw = await fs.readFile(filePath, 'utf-8');

    // já devolve como JSON sem inventar moda
    return new NextResponse(raw, {
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  } catch (err: any) {
    return new NextResponse(
      JSON.stringify({
        error: 'Falha ao ler ephemeris_2026.json',
        detail: err?.message ?? String(err),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
