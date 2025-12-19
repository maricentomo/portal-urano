'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';

type BirthData = {
  name: string;
  date: string; // DD/MM/AAAA
  time: string; // HH:MM
  city: string;
  country: string;
};

type GenerateReportResponse = {
  ok: boolean;
  year: number;
  report: string;
  debug?: any;
};

export default function TransitosPage() {
  const [step, setStep] = useState<'form' | 'report'>('form');

  const [birthData, setBirthData] = useState<BirthData>({
    name: '',
    date: '',
    time: '',
    city: '',
    country: 'Brazil',
  });

  const [reportText, setReportText] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const reportTopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (step === 'report') {
      reportTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [step]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBirthData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCopied(false);

    if (!birthData.name || !birthData.date || !birthData.time || !birthData.city || !birthData.country) {
      alert('Preencha nome, data, hora, cidade e país.');
      return;
    }

    setIsLoading(true);
    setStatusMessage('Gerando relatório…');

    try {
      const res = await fetch('/api/transitos/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ birthData }),
      });

      const txt = await res.text().catch(() => '');

      if (!res.ok) {
        try {
          const j = JSON.parse(txt);
          throw new Error(j?.error || j?.detail || `HTTP ${res.status}`);
        } catch {
          throw new Error(`HTTP ${res.status} ${txt}`);
        }
      }

      const json = JSON.parse(txt) as GenerateReportResponse;
      const report = json?.report ?? '';

      setReportText(report);
      setStep('report');
    } catch (err: any) {
      alert(err?.message ?? 'Erro ao gerar relatório');
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  };

  const handleBack = () => {
    setStep('form');
  };

  const handleNew = () => {
    setReportText('');
    setCopied(false);
    setStep('form');
  };

  async function handleCopy() {
    if (!reportText) return;
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      alert('Não consegui copiar automaticamente. Selecione o texto e copie manualmente.');
    }
  }

  const canShowReport = step === 'report' && reportText.length > 0;

  return (
    <div className="chat-page">
      <div className="texture-banner">
        <Image src="/textura.png" alt="Textura Mística" width={1920} height={90} style={{ objectFit: 'cover' }} />
      </div>

      <div className="chat-center" style={{ maxWidth: '100%', margin: 0, padding: 0, width: '100%' }}>
        {step === 'form' ? (
          <section className="mapa-hero">
            <div className="mapa-grid">
              <div className="mapa-left">
                <h1 className="home-title">TRÂNSITOS 2026</h1>

                <p className="home-subtitle">
                  Um relatório anual profundo, baseado no seu mapa natal.
                  <br />
                  Introdução com planetas lentos + análise mensal sem repetir os lentos.
                  <br />
                  Sem Nodos. Mês “dono” = mês do START do aspecto.
                </p>

                {/* Se você quiser colocar uma imagem igual ao div_mapa-astral, troca o src abaixo */}
                {/* <Image src="/div_transitos.png" alt="Mockup Trânsitos" width={800} height={800} style={{ width: '70%', height: 'auto', display: 'block', margin: '32px auto 0' }} /> */}
              </div>

              <div className="mapa-right">
                <div
                  className="form-container"
                  style={{
                    width: '100%',
                    maxWidth: '400px',
                    padding: '20px',
                    backgroundColor: '#1a1a1a',
                    borderRadius: '15px',
                    color: '#fff9eb',
                    fontSize: '0.95rem',
                    margin: '32px auto 0',
                  }}
                >
                  <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.7rem', color: '#fff9eb' }}>
                        Nome Completo
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={birthData.name}
                        onChange={handleInputChange}
                        className="chat-input"
                        style={{ width: '100%' }}
                        required
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.7rem', color: '#fff9eb' }}>
                          Data (DD/MM/AAAA)
                        </label>
                        <input
                          type="text"
                          name="date"
                          placeholder="Ex: 29/10/1981"
                          value={birthData.date}
                          onChange={handleInputChange}
                          className="chat-input"
                          style={{ width: '100%' }}
                          required
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.7rem', color: '#fff9eb' }}>
                          Hora (HH:MM)
                        </label>
                        <input
                          type="text"
                          name="time"
                          placeholder="Ex: 05:45"
                          value={birthData.time}
                          onChange={handleInputChange}
                          className="chat-input"
                          style={{ width: '100%' }}
                          required
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.7rem', color: '#fff9eb' }}>
                          Cidade
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={birthData.city}
                          onChange={handleInputChange}
                          className="chat-input"
                          style={{ width: '100%' }}
                          required
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.7rem', color: '#fff9eb' }}>
                          País
                        </label>
                        <input
                          type="text"
                          name="country"
                          value={birthData.country}
                          onChange={handleInputChange}
                          className="chat-input"
                          style={{ width: '100%' }}
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="chat-send-btn"
                      style={{
                        width: '100%',
                        marginTop: '20px',
                        padding: '15px',
                        borderRadius: '8px',
                        justifyContent: 'center',
                        color: '#fff9eb',
                        opacity: isLoading ? 0.75 : 1,
                      }}
                      disabled={isLoading}
                    >
                      {isLoading ? statusMessage || 'Gerando…' : 'Gerar Relatório 2026'}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            <style jsx>{`
              .mapa-hero {
                padding: 0px 40px 0 40px;
              }
              .mapa-grid {
                display: grid;
                grid-template-columns: 2fr 1fr;
                gap: 40px;
                align-items: flex-start;
                width: 100%;
              }
              .mapa-left {
                min-width: 0;
                max-width: 800px;
              }
              .mapa-hero .home-title {
                color: #000000;
              }
              .mapa-hero .home-subtitle {
                color: #444444;
                line-height: 1.4;
              }
              .mapa-right {
                min-width: 0;
                display: flex;
                flex-direction: column;
                align-items: flex-end;
                max-width: 400px;
                width: 100%;
              }
              @media (max-width: 900px) {
                .mapa-hero {
                  padding: 24px 16px 0 15px;
                }
                .mapa-grid {
                  grid-template-columns: 1fr;
                  gap: 24px;
                }
                .mapa-right {
                  align-items: flex-start;
                  max-width: 480px;
                }
              }
            `}</style>
          </section>
        ) : (
          <section className="mapa-report">
            <div className="report-page" ref={reportTopRef}>
              <div className="report-header">
                <div>
                  <h1 className="home-title">RELATÓRIO — TRÂNSITOS 2026</h1>
                  <p className="home-subtitle">
                    {birthData.name} · {birthData.date} · {birthData.time} · {birthData.city}/{birthData.country}
                  </p>
                </div>

                <div className="actions">
                  <button type="button" className="btn" onClick={handleBack}>
                    Voltar
                  </button>
                  <button type="button" className="btn" onClick={handleNew}>
                    Gerar novo
                  </button>
                </div>
              </div>

              <div className="month-card">
                <div className="month-title">RELATÓRIO (IA)</div>

                {canShowReport && (
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
                    <button type="button" className="btnPrimary" onClick={handleCopy}>
                      {copied ? 'Copiado ✅' : 'Copiar'}
                    </button>

                    <div style={{ color: '#111', opacity: 0.7, fontSize: '0.9rem' }}>
                      {reportText.length.toLocaleString('pt-BR')} caracteres
                    </div>
                  </div>
                )}

                <div className="report-content prose max-w-none">
                  <ReactMarkdown>{reportText || 'Sem relatório.'}</ReactMarkdown>
                </div>
              </div>
            </div>

            <style jsx>{`
              .mapa-report {
                padding: 40px 16px 80px;
                display: flex;
                justify-content: center;
              }
              .report-page {
                background: #fff9eb;
                max-width: 800px;
                width: 100%;
                min-height: 1120px;
                padding: 40px 48px;
                box-shadow: 0 0 40px rgba(0, 0, 0, 0.35);
                border-radius: 8px;
                box-sizing: border-box;
              }
              .report-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 16px;
                margin-bottom: 18px;
              }
              .actions {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
              }
              .home-title {
                color: #000;
                margin: 0;
              }
              .home-subtitle {
                color: #444;
                line-height: 1.4;
                margin-top: 8px;
              }

              .month-card {
                background: #fff9eb;
                border: 1px solid rgba(0, 0, 0, 0.08);
                border-radius: 12px;
                padding: 14px 14px;
              }
              .month-title {
                font-weight: 800;
                letter-spacing: 0.5px;
                margin-bottom: 10px;
                color: #111;
              }

              .btn {
                padding: 10px 12px;
                border-radius: 10px;
                border: 1px solid rgba(0, 0, 0, 0.14);
                background: rgba(255, 255, 255, 0.6);
                color: #111;
                cursor: pointer;
                font-weight: 700;
              }
              .btnPrimary {
                padding: 10px 14px;
                border-radius: 10px;
                border: none;
                background: #8a3f89;
                color: #fff9eb;
                cursor: pointer;
                font-weight: 800;
              }

              .report-content {
                color: #111;
                font-size: 0.95rem;
                line-height: 1.6;
              }

              @media (max-width: 900px) {
                .report-page {
                  padding: 24px 16px 40px;
                }
                .report-header {
                  flex-direction: column;
                }
              }
            `}</style>
          </section>
        )}
      </div>
    </div>
  );
}
