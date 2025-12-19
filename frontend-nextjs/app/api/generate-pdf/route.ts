export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import puppeteer from 'puppeteer';
import { PDFDocument } from 'pdf-lib';

async function fileToDataUrl(filePath: string) {
  const buf = await fs.readFile(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mime =
    ext === '.png'
      ? 'image/png'
      : ext === '.jpg' || ext === '.jpeg'
        ? 'image/jpeg'
        : ext === '.svg'
          ? 'image/svg+xml'
          : ext === '.woff2'
            ? 'font/woff2'
            : 'application/octet-stream';
  return `data:${mime};base64,${buf.toString('base64')}`;
}

async function getOptionalDataUrl(...pathsToTry: string[]) {
  for (const p of pathsToTry) {
    try {
      await fs.access(p);
      return await fileToDataUrl(p);
    } catch {}
  }
  return '';
}

async function getSignoImageUrl(signo: string): Promise<string> {
  if (!signo) return '';
  const signoSlug = signo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const signoPath = path.join(process.cwd(), 'public', 'pdf', 'signos', `${signoSlug}.png`);
  try {
    await fs.access(signoPath);
    return await fileToDataUrl(signoPath);
  } catch {
    return '';
  }
}

function safeFileSlug(name: string) {
  return (name || 'cliente')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function escapeHtml(input: any) {
  return String(input ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatDegree(deg: number) {
  if (typeof deg !== 'number' || Number.isNaN(deg)) return '';
  const d = Math.floor(deg);
  const m = Math.round((deg - d) * 60);
  return `${d}°${m.toString().padStart(2, '0')}'`;
}

// inline: **negrito** -> <strong>
function inlineMarkdownToHtml(raw: string) {
  const re = /\*\*(.+?)\*\*/g;
  let out = '';
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(raw)) !== null) {
    out += escapeHtml(raw.slice(last, m.index));
    out += `<strong>${escapeHtml(m[1])}</strong>`;
    last = m.index + m[0].length;
  }

  out += escapeHtml(raw.slice(last));
  return out;
}

// markdown simples -> HTML:
// - ### titulo  => H3
// - **titulo** (linha inteira) => H3 (remove **)
// - parágrafos com **negrito** => <strong>
function analysisMarkdownToHtml(analysisText: string) {
  const lines = (analysisText || '').split('\n');
  let html = '';
  let firstTitle = true;

  for (const raw of lines) {
    const trimmed = (raw ?? '').trim();

    if (!trimmed) {
      html += `<div class="spacer"></div>\n`;
      continue;
    }

    if (trimmed.startsWith('###')) {
      const titulo = trimmed.replace(/^###\s*/, '').trim();
      const cls = firstTitle ? 'titulo-buster first' : 'titulo-buster';
      firstTitle = false;
      html += `<h3 class="${cls}">${escapeHtml(titulo)}</h3>\n`;
      continue;
    }

    if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
      const titulo = trimmed.replace(/^#+\s*/, '').trim();
      const cls = firstTitle ? 'titulo-buster first' : 'titulo-buster';
      firstTitle = false;
      html += `<h3 class="${cls}">${escapeHtml(titulo)}</h3>\n`;
      continue;
    }

    const boldTitle = trimmed.match(/^\*\*(.+)\*\*$/);
    if (boldTitle) {
      const titulo = (boldTitle[1] || '').trim();
      const cls = firstTitle ? 'titulo-buster first' : 'titulo-buster';
      firstTitle = false;
      html += `<h3 class="${cls}">${escapeHtml(titulo)}</h3>\n`;
      continue;
    }

    html += `<p>${inlineMarkdownToHtml(trimmed)}</p>\n`;
  }

  return html;
}

async function renderPdfBuffer(
  browser: puppeteer.Browser,
  html: string,
  opts: {
    withHeaderFooter: boolean;
    margin: { top: string; right: string; bottom: string; left: string };
    headerTemplate?: string;
    footerTemplate?: string;
  },
) {
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0', timeout: 90000 });

  const buf = await page.pdf({
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: opts.withHeaderFooter,
    headerTemplate: opts.withHeaderFooter ? opts.headerTemplate : undefined,
    footerTemplate: opts.withHeaderFooter ? opts.footerTemplate : undefined,
    margin: opts.margin,
  });

  await page.close();
  return Buffer.from(buf);
}

async function mergePdfs(buffers: Buffer[]) {
  const merged = await PDFDocument.create();

  for (const b of buffers) {
    const doc = await PDFDocument.load(b);
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    for (const p of pages) merged.addPage(p);
  }

  const mergedBytes = await merged.save();
  return Buffer.from(mergedBytes);
}

export async function POST(req: Request) {
  let browser: puppeteer.Browser | null = null;

  try {
    const body = await req.json();

    const birthData = body?.birthData ?? {};
    const sunSign = body?.sunSign ?? '';
    const chartSvg = body?.chartSvg ?? '';
    const analysisText = body?.analysisText ?? '';
    const mapData = body?.mapData ?? {};

    const capaPath = path.join(process.cwd(), 'public', 'pdf', 'capa.png');
    const headerPath = path.join(process.cwd(), 'public', 'pdf', 'header.png');
    const encerramentoPath = path.join(process.cwd(), 'public', 'pdf', 'encerramento.png');
    const fontPath = path.join(process.cwd(), 'public', 'TANBUSTER-Bold.woff2');

    await fs.access(capaPath);
    await fs.access(headerPath);
    await fs.access(encerramentoPath);
    await fs.access(fontPath);

    const capaDataUrl = await fileToDataUrl(capaPath);
    const headerDataUrl = await fileToDataUrl(headerPath);
    const encerramentoDataUrl = await fileToDataUrl(encerramentoPath);
    const fontDataUrl = await fileToDataUrl(fontPath);
    const signoImageUrl = await getSignoImageUrl(sunSign);

    const sparkleDataUrl = await getOptionalDataUrl(
      path.join(process.cwd(), 'public', 'pdf', 'sparkle.png'),
      path.join(process.cwd(), 'public', 'pdf', 'sparkle-preto.png'),
      path.join(process.cwd(), 'public', 'pdf', 'sparkle_black.png'),
      path.join(process.cwd(), 'public', 'pdf', 'estrela.png'),
    );

    const positions = mapData?.positions ?? [];
    const houses = mapData?.houses ?? [];
    const elements = mapData?.elements ?? {};
    const quadruplicities = mapData?.quadruplicities ?? {};

    const planetasHtml = positions
      .map(
        (p: any) => `
          <tr>
            <td>${escapeHtml(p.planet)}</td>
            <td>${escapeHtml(p.sign)} ${escapeHtml(formatDegree(Number(p.degree)))}</td>
            <td style="text-align:center">${escapeHtml(p.house)}</td>
            <td style="text-align:center">${p.retrograde ? 'R' : ''}</td>
          </tr>
        `,
      )
      .join('');

    const casasHtml = houses
      .map(
        (h: any) => `
          <tr>
            <td style="text-align:center">${escapeHtml(h.house)}</td>
            <td>${escapeHtml(h.sign)} ${escapeHtml(formatDegree(Number(h.degree)))}</td>
          </tr>
        `,
      )
      .join('');

    const elementosHtml = Object.entries(elements)
      .map(
        ([elem, total]) => `
          <tr>
            <td>${escapeHtml(elem)}</td>
            <td style="text-align:center">${escapeHtml(total)}</td>
          </tr>
        `,
      )
      .join('');

    const modalidadesHtml = Object.entries(quadruplicities)
      .map(
        ([mode, total]) => `
          <tr>
            <td>${escapeHtml(mode)}</td>
            <td style="text-align:center">${escapeHtml(total)}</td>
          </tr>
        `,
      )
      .join('');

    const analysisHtml = analysisMarkdownToHtml(analysisText);

    // ===== Header/Footer (Puppeteer) - CORRIGIDO
    // A altura do header agora está ajustada para colar no topo
    const HEADER_H_MM = 28;
    const FOOTER_H_MM = 10;

    const headerTemplate = `
      <style>
        * { margin:0 !important; padding:0 !important; }
        html, body { 
          margin:0 !important; 
          padding:0 !important; 
          width:100%;
          height:100%;
        }
        .wrap { 
          width:100%; 
          height:${HEADER_H_MM}mm; 
          overflow:hidden;
          margin:0 !important;
          padding:0 !important;
          display:block;
          position:relative;
        }
        img { 
          width:100%; 
          height:100%; 
          display:block; 
          object-fit:cover;
          margin:0 !important;
          padding:0 !important;
          position:absolute;
          top:0;
          left:0;
        }
      </style>
      <div class="wrap"><img src="${headerDataUrl}" /></div>
    `;

    const footerTemplate = `
      <style>
        * { margin:0 !important; padding:0 !important; }
        html, body { 
          margin:0 !important; 
          padding:0 !important; 
        }
        .footer {
          width:100%;
          height:${FOOTER_H_MM}mm;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:10px;
          font-family: Georgia, serif;
          font-size: 10.5pt;
          color:#000;
        }
        .sparkle { width:14px; height:14px; object-fit:contain; }
        .label { white-space:nowrap; }
      </style>
      <div class="footer">
        ${sparkleDataUrl ? `<img class="sparkle" src="${sparkleDataUrl}" />` : ''}
        <span class="label">app.portalurano.com.br</span>
        ${sparkleDataUrl ? `<img class="sparkle" src="${sparkleDataUrl}" />` : ''}
      </div>
    `;

    // Margens ajustadas - o top agora considera exatamente a altura do header
    const MARGINS_MAP = { top: `${HEADER_H_MM}mm`, right: '0mm', bottom: `${FOOTER_H_MM}mm`, left: '0mm' };
    const MARGINS_ANALYSIS = { top: `${HEADER_H_MM}mm`, right: '0mm', bottom: `${FOOTER_H_MM}mm`, left: '0mm' };
    const MARGINS_FULLBLEED = { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' };

    // =========================
    // 1) CAPA (full-bleed)
    // =========================
    const htmlCover = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            * { margin:0; padding:0; box-sizing:border-box; }
            @page { size:A4; margin:0; }
            body { width:210mm; height:297mm; }
            .page {
              width:210mm; height:297mm;
              background-image:url('${capaDataUrl}');
              background-size:cover;
              background-position:center;
              display:flex;
              align-items:flex-end;
              justify-content:center;
              padding-bottom: 34mm;
            }
            .nome {
              font-family: Georgia, serif;
              font-size: 12pt;
              color:#000;
              text-align:center;
            }
          </style>
        </head>
        <body>
          <div class="page"><div class="nome">${escapeHtml(birthData?.name || 'Mapa Astral')}</div></div>
        </body>
      </html>
    `;

    // =========================
    // 2) MAPA + TABELAS (com header/footer)
    // =========================
    const htmlMap = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            * { margin:0; padding:0; box-sizing:border-box; }
            @page { size:A4; }

            body {
              background:#ffffff;
              font-family: Georgia, serif;
              color:#111;
            }

            .page {
              padding: 6mm 14mm 0;
            }

            .top {
              display:grid;
              grid-template-columns: 1.6fr 1fr;
              gap: 8mm;
              align-items:start;
              margin-bottom: 7mm;
            }

            .svgwrap { width:100%; text-align:center; }
            .svgwrap svg {
              width:100%;
              height:auto;
              display:block;
              transform: scale(1.28);
              transform-origin: center;
            }

            .middle {
              display:grid;
              grid-template-columns: 1.05fr 0.95fr;
              gap: 8mm;
              align-items:start;
            }

            .stats { display:flex; flex-direction:column; gap: 6mm; }

            table { width:100%; border-collapse:collapse; font-size: 9pt; }
            th {
              background:#893f89;
              color:#fff;
              padding: 1.8mm 2.0mm;
              text-align:left;
              font-weight:600;
              white-space:nowrap;
            }
            td {
              padding: 1.2mm 2.0mm;
              border-bottom: 0.6px solid rgba(0,0,0,0.14);
              white-space:nowrap;
              line-height: 1.05;
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="top">
              <div class="svgwrap">
                ${chartSvg || '<div style="padding:10mm; text-align:center;">Mapa não disponível</div>'}
              </div>

              <div>
                <table>
                  <thead>
                    <tr>
                      <th>Planeta</th>
                      <th>Signo</th>
                      <th style="text-align:center">Casa</th>
                      <th style="text-align:center">Rx</th>
                    </tr>
                  </thead>
                  <tbody>${planetasHtml}</tbody>
                </table>
              </div>
            </div>

            <div class="middle">
              <div>
                <table>
                  <thead><tr><th style="text-align:center">Casa</th><th>Signo</th></tr></thead>
                  <tbody>${casasHtml}</tbody>
                </table>
              </div>

              <div class="stats">
                <table>
                  <thead><tr><th>Elemento</th><th style="text-align:center">Total</th></tr></thead>
                  <tbody>${elementosHtml}</tbody>
                </table>

                <table>
                  <thead><tr><th>Modalidade</th><th style="text-align:center">Total</th></tr></thead>
                  <tbody>${modalidadesHtml}</tbody>
                </table>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // =========================
    // 3) SIGNO (full-bleed)
    // =========================
    const htmlSign = signoImageUrl
      ? `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            * { margin:0; padding:0; box-sizing:border-box; }
            @page { size:A4; margin:0; }
            body { width:210mm; height:297mm; }
            .page {
              width:210mm; height:297mm;
              background-image:url('${signoImageUrl}');
              background-size:cover;
              background-position:center;
            }
          </style>
        </head>
        <body><div class="page"></div></body>
      </html>
    `
      : '';

    // =========================
    // 4) ANÁLISE (com header/footer + margens reais)
    // =========================
    const htmlAnalysis = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            @page { size:A4; }

            @font-face {
              font-family: 'buster';
              src: url('${fontDataUrl}') format('woff2');
              font-weight: 700;
              font-style: normal;
            }

            body {
              background:#ffffff;
              font-family: Georgia, serif;
              color:#2d2d2d;
              font-size: 14.6pt;
              line-height: 1.85;
              margin:0;
              padding:0;
            }

            .content{
              padding: 24mm 18mm 0;
            }

            .analysis {
              max-width: 170mm;
              margin: 0 auto;
            }

            .analysis .titulo-buster {
              font-family: 'buster', Georgia, serif;
              font-size: 19pt;
              font-weight: 700;
              color: #000;
              margin: 24pt 0 12pt;
              break-before: page;
              page-break-before: always;
              break-after: avoid;
              page-break-after: avoid;
            }
            .analysis .titulo-buster.first {
              break-before: auto;
              page-break-before: auto;
              margin-top: 0;
            }

            .analysis p {
              margin: 0 0 12pt;
              text-align: justify;
            }

            .analysis strong { font-weight: 700; }

            .spacer { height: 6pt; }
          </style>
        </head>
        <body>
          <div class="content">
            <div class="analysis">
              ${analysisHtml}
            </div>
          </div>
        </body>
      </html>
    `;

    // =========================
    // 5) ENCERRAMENTO (full-bleed)
    // =========================
    const htmlEnd = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            * { margin:0; padding:0; box-sizing:border-box; }
            @page { size:A4; margin:0; }
            body { width:210mm; height:297mm; }
            .page {
              width:210mm; height:297mm;
              background-image:url('${encerramentoDataUrl}');
              background-size:cover;
              background-position:center;
            }
          </style>
        </head>
        <body><div class="page"></div></body>
      </html>
    `;

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const parts: Buffer[] = [];

    // CAPA
    parts.push(
      await renderPdfBuffer(browser, htmlCover, {
        withHeaderFooter: false,
        margin: MARGINS_FULLBLEED,
      }),
    );

    // MAPA
    parts.push(
      await renderPdfBuffer(browser, htmlMap, {
        withHeaderFooter: true,
        margin: MARGINS_MAP,
        headerTemplate,
        footerTemplate,
      }),
    );

    // SIGNO
    if (htmlSign) {
      parts.push(
        await renderPdfBuffer(browser, htmlSign, {
          withHeaderFooter: false,
          margin: MARGINS_FULLBLEED,
        }),
      );
    }

    // ANÁLISE
    parts.push(
      await renderPdfBuffer(browser, htmlAnalysis, {
        withHeaderFooter: true,
        margin: MARGINS_ANALYSIS,
        headerTemplate,
        footerTemplate,
      }),
    );

    // ENCERRAMENTO
    parts.push(
      await renderPdfBuffer(browser, htmlEnd, {
        withHeaderFooter: false,
        margin: MARGINS_FULLBLEED,
      }),
    );

    const finalPdf = await mergePdfs(parts);

    const fileName = `mapa-astral-${safeFileSlug(String(birthData?.name || 'cliente'))}.pdf`;
    return new NextResponse(finalPdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (err: any) {
    console.error('Erro ao gerar PDF:', err);
    return NextResponse.json({ ok: false, error: err?.message ?? 'Erro desconhecido' }, { status: 500 });
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch {}
    }
  }
}