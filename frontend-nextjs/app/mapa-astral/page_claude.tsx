'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';

const API_BASE_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:8000'
    : 'https://api-mapa-astral-production.up.railway.app';

const CHAT_API_URL = `${API_BASE_URL}/chat`;
const CALCULATE_API_URL = `${API_BASE_URL}/calculate`;
const CHART_SVG_URL = `${API_BASE_URL}/generate-chart-svg`;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface BirthData {
  name: string;
  date: string;
  time: string;
  city: string;
  country: string;
}

// =============================
// DEFINIÇÃO DOS CHUNKS (PEDAÇOS) - NOVO
// =============================
const ANALYSIS_CHUNKS = [
  {
    id: 1,
    sections: ['VISÃO GERAL DO MAPA', '1. ESSÊNCIA CENTRAL', '2. PROPÓSITO E IDENTIDADE', '3. AMOR & RELACIONAMENTOS'],
  },
  {
    id: 2,
    sections: ['4. CARREIRA', '5. DINHEIRO & RECURSOS', '6. AMIZADES & COMUNIDADE', '7. FAMÍLIA & RAÍZES'],
  },
  {
    id: 3,
    sections: ['8. ESPIRITUALIDADE', '9. CRIATIVIDADE & EXPRESSÃO', '10. SAÚDE & ROTINA', '11. PADRÕES KÁRMICOS'],
  },
  {
    id: 4,
    sections: ['12. POTENCIAIS & DESAFIOS', 'ENCERRAMENTO'],
  },
];

// =============================
// SÍMBOLOS E HELPERS DO RELATÓRIO
// =============================
const PLANET_GLYPHS: Record<string, string> = {
  Sol: '☉',
  Lua: '☽',
  Mercúrio: '☿',
  Vênus: '♀',
  Marte: '♂',
  Júpiter: '♃',
  Saturno: '♄',
  Urano: '♅',
  Netuno: '♆',
  Plutão: '♇',
  Quíron: '⚷',
  Lilith: '⚸',
  NóduloNorte: '☊',
  NóduloSul: '☋',
  Ascendente: '',
  MeioCéu: '',
};

const PLANET_NAMES: Record<string, string> = {
  Sol: ' Sol',
  Lua: ' Lua',
  Mercúrio: ' Mercúrio',
  Vênus: ' Vênus',
  Marte: ' Marte',
  Júpiter: ' Júpiter',
  Saturno: ' Saturno',
  Urano: ' Urano',
  Netuno: ' Netuno',
  Plutão: ' Plutão',
  Quíron: ' Quíron',
  Lilith: ' Lilith',
  NóduloNorte: ' N. Norte',
  NóduloSul: ' N. Sul',
  Ascendente: 'Ascendente',
  MeioCéu: 'Meio do Céu',
};

const SIGN_ICONS: Record<string, string> = {
  Áries: '/signos/aries.svg',
  Touro: '/signos/touro.svg',
  Gêmeos: '/signos/gemeos.svg',
  Câncer: '/signos/cancer.svg',
  Leão: '/signos/leao.svg',
  Virgem: '/signos/virgem.svg',
  Libra: '/signos/libra.svg',
  Escorpião: '/signos/escorpiao.svg',
  Sagitário: '/signos/sagitario.svg',
  Capricórnio: '/signos/capricornio.svg',
  Aquário: '/signos/aquario.svg',
  Peixes: '/signos/peixes.svg',
};

const PLANET_ORDER = [
  'Ascendente',
  'MeioCéu',
  'Sol',
  'Lua',
  'Mercúrio',
  'Vênus',
  'Marte',
  'Júpiter',
  'Saturno',
  'Urano',
  'Netuno',
  'Plutão',
  'Quíron',
  'Lilith',
  'NóduloNorte',
  'NóduloSul',
];

const formatDegree = (degree: number) => {
  const d = Math.floor(degree);
  const m = Math.round((degree - d) * 60);
  return `${d}°${m.toString().padStart(2, '0')}'`;
};

const sortPositions = (positions: any[] = []) => {
  return [...positions].sort((a, b) => {
    const ai = PLANET_ORDER.indexOf(a.planet);
    const bi = PLANET_ORDER.indexOf(b.planet);
    const ia = ai === -1 ? 999 : ai;
    const ib = bi === -1 ? 999 : bi;
    return ia - ib;
  });
};

export default function MapaAstralPage() {
  const [step, setStep] = useState<'form' | 'chat'>('form');

  const [birthData, setBirthData] = useState<BirthData>({
    name: '',
    date: '',
    time: '',
    city: '',
    country: 'Brazil',
  });

  const [mapData, setMapData] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const [chartSvg, setChartSvg] = useState<string>('');
  const [analysisText, setAnalysisText] = useState<string>('');
  const [sunSign, setSunSign] = useState<string>('');

  // ======= STATES PARA CHUNKS - NOVO =======
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [isGeneratingChunks, setIsGeneratingChunks] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBirthData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBigCtaClick = () => {
    const form = document.getElementById('mapa-astral-form');
    if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const fetchChartSVG = async (birth: BirthData): Promise<string> => {
    try {
      const response = await fetch(CHART_SVG_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'image/svg+xml',
        },
        body: JSON.stringify({
          name: birth.name,
          date: birth.date,
          time: birth.time,
          city: birth.city,
          country: birth.country,
          custom_colors: true,
        }),
      });

      if (!response.ok) {
        console.error('Erro ao gerar SVG:', response.status);
        return '';
      }

      const svgText = await response.text();
      setChartSvg(svgText);

      const container = document.getElementById('chart-container');
      if (container) container.innerHTML = svgText;

      return svgText;
    } catch (error) {
      console.error('Erro ao buscar SVG:', error);
      return '';
    }
  };

  const handleGeneratePdf = async () => {
    try {
      const res = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birthData,
          sunSign,
          chartSvg,
          mapData,
          analysisText,
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        alert(`Erro ao gerar PDF (HTTP ${res.status}).\n${errText}`);
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `mapa-astral-${(birthData.name || 'cliente')
        .toLowerCase()
        .replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(err);
      alert(`Erro ao gerar PDF: ${err?.message ?? 'erro desconhecido'}`);
    }
  };

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!birthData.name || !birthData.date || !birthData.time || !birthData.city) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setMapData(null);
    setMessages([]);
    setChartSvg('');
    setAnalysisText('');
    setSunSign('');
    setConversationHistory([]);
    setCurrentChunkIndex(0);

    setIsLoading(true);
    setStatusMessage('Consultando os astros...');

    try {
      setStatusMessage('📐 Calculando posições matemáticas...');

      const response = await fetch(CALCULATE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(birthData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Erro ao calcular o mapa');
      }

      const data = await response.json();

      setMapData(data);
      setStep('chat');
      setStatusMessage('');

      const sol = (data?.positions ?? []).find((p: any) => p.planet === 'Sol');
      setSunSign(sol?.sign ?? '');

      await fetchChartSVG(birthData);

      setMessages([
        {
          role: 'assistant',
          content: 'Aguarde enquanto calculo e analiso seu mapa astral completo...',
        },
      ]);

      // INICIA GERAÇÃO EM CHUNKS - NOVO
      await startChunkedAnalysis(data);
    } catch (error: any) {
      console.error('Erro:', error);
      alert(`Erro: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // SISTEMA DE CHUNKS - NOVO
  // ==========================================
  const startChunkedAnalysis = async (currentMapData: any) => {
    setIsGeneratingChunks(true);
    let fullText = '';
    let history: any[] = [];

    for (let i = 0; i < ANALYSIS_CHUNKS.length; i++) {
      setCurrentChunkIndex(i);
      const chunkText = await generateChunk(i, currentMapData, history);
      
      if (chunkText) {
        fullText += (fullText ? '\n\n' : '') + chunkText;
        
        // Adiciona ao histórico para manter contexto
        history.push(
          { role: 'user', content: `Continue a análise - Parte ${i + 1}` },
          { role: 'assistant', content: chunkText }
        );
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setAnalysisText(fullText);
    setConversationHistory(history);
    setIsGeneratingChunks(false);
  };

  const generateChunk = async (chunkIndex: number, currentMapData: any, history: any[]) => {
    setIsLoading(true);

    try {
      const isFirstChunk = chunkIndex === 0;
      const chunk = ANALYSIS_CHUNKS[chunkIndex];

      let message = '';

      if (isFirstChunk) {
        message = `Use APENAS os títulos abaixo, exatamente como estão (mesma grafia e com ###).
Não invente título extra, não rebatize nada, não crie prefácio, não crie "linguagem silenciosa" ou qualquer frase poética.
Não use símbolos decorativos (✦ ✨ etc.).
Escreva no MASCULINO (ex: "em você", "você percebe", "você tende").

TÍTULOS OBRIGATÓRIOS (use exatamente estes):
### VISÃO GERAL DO MAPA
### 1. ESSÊNCIA CENTRAL — QUEM VOCÊ É
### 2. PROPÓSITO E IDENTIDADE
### 3. AMOR & RELACIONAMENTOS ÍNTIMOS
### 4. CARREIRA & REALIZAÇÃO PROFISSIONAL
### 5. DINHEIRO & RECURSOS
### 6. AMIZADES & COMUNIDADE
### 7. FAMÍLIA & RAÍZES EMOCIONAIS
### 8. ESPIRITUALIDADE & BUSCA DE SENTIDO
### 9. CRIATIVIDADE & EXPRESSÃO
### 10. SAÚDE & ROTINA
### 11. PADRÕES KÁRMICOS & TRANSFORMAÇÃO
### 12. POTENCIAIS & DESAFIOS DE INTEGRAÇÃO
### ENCERRAMENTO

IMPORTANTE: Esta é a Parte ${chunk.id} de ${ANALYSIS_CHUNKS.length}. 
Escreva SOMENTE as seções: ${chunk.sections.join(', ')}.
Não termine com encerramento, pois haverá continuação.

Agora gere a análise com base no JSON enviado em map_data.`;
      } else {
        message = `Continue a análise do mapa astral onde parou.

Esta é a Parte ${chunk.id} de ${ANALYSIS_CHUNKS.length}.
Escreva SOMENTE as seções: ${chunk.sections.join(', ')}.
${chunkIndex < ANALYSIS_CHUNKS.length - 1 ? 'Não termine com encerramento, pois haverá continuação.' : 'Esta é a parte final, finalize adequadamente.'}`;
      }

      const response = await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history: history.slice(-4), // Mantém contexto das últimas 2 interações
          map_data: currentMapData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Erro ao conectar com a IA');
      }

      const data = await response.json();

      // Atualiza mensagens na tela
      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.role === 'assistant') {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...lastMsg,
            content: lastMsg.content + '\n\n' + data.response,
          };
          return updated;
        } else {
          return [...prev, { role: 'assistant', content: data.response }];
        }
      });

      return data.response;
    } catch (error: any) {
      console.error('Erro no chunk', chunkIndex, ':', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `❌ Erro na Parte ${chunkIndex + 1}: ${error.message}` },
      ]);
      return '';
    } finally {
      setIsLoading(false);
    }
  };

  const canGeneratePdf =
    !!mapData &&
    typeof analysisText === 'string' &&
    analysisText.length > 50 &&
    typeof chartSvg === 'string' &&
    chartSvg.length > 50 &&
    !isGeneratingChunks;

  // ===========================
  // RENDER
  // ===========================
  return (
    <div className="chat-page">
      <div className="texture-banner">
        <Image
          src="/textura.png"
          alt="Textura Mística"
          width={1920}
          height={90}
          style={{ objectFit: 'cover' }}
        />
      </div>

      <div
        className="chat-center"
        style={{ maxWidth: '100%', margin: 0, padding: 0, width: '100%' }}
      >
        {step === 'form' ? (
          <>
            <section className="mapa-hero">
              <div className="mapa-grid">
                <div className="mapa-left">
                  <h1 className="home-title">
                    INICIE A SUA JORNADA
                    <br />
                    DA ALMA...
                  </h1>

                  <p className="home-subtitle">
                    Uma leitura profunda do seu mapa natal, mostrando como você funciona na vida afetiva,
                    na carreira, na família e nas escolhas do dia a dia – sem frases prontas, só um relatório
                    claro pra você entender seus padrões e possibilidades com mais consciência.
                  </p>

                  <div className="mapa-image">
                    <Image
                      src="/div_mapa-astral-v4.png"
                      alt="Mockup do Mapa Astral"
                      width={800}
                      height={800}
                      style={{
                        width: '70%',
                        height: 'auto',
                        display: 'block',
                        margin: '32px auto 0',
                      }}
                    />
                  </div>
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
                    <form
                      id="mapa-astral-form"
                      onSubmit={handleCalculate}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                      }}
                    >
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px' }}>
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
                          <label style={{ display: 'block', marginBottom: '8px' }}>
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
                          <label style={{ display: 'block', marginBottom: '8px' }}>
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
                          <label style={{ display: 'block', marginBottom: '8px' }}>
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
                          <label style={{ display: 'block', marginBottom: '8px' }}>
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
                        }}
                        disabled={isLoading}
                      >
                        {isLoading ? statusMessage : 'Iniciar Consulta'}
                      </button>

                      <p className="mapa-price">POR APENAS R$ 49,00, VOCÊ RECEBE:</p>

                      <ul className="mapa-features">
                        <li>PDF em torno de 50 páginas</li>
                        <li>IA de última geração treinada por Astrólogos</li>
                        <li>Leitura completa do seu mapa natal</li>
                        <li>Entrega imediata</li>
                      </ul>
                    </form>
                  </div>

                  <button
                    type="button"
                    onClick={handleBigCtaClick}
                    className="chat-send-btn"
                    style={{
                      width: '100%',
                      marginTop: '16px',
                      padding: '15px',
                      borderRadius: '8px',
                      justifyContent: 'center',
                      color: '#fff9eb',
                    }}
                  >
                    Acessar meu Mapa Astral
                  </button>
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
                }
                .mapa-image {
                  margin-top: 32px;
                  max-width: 700px;
                }
                .mapa-right {
                  min-width: 0;
                  display: flex;
                  flex-direction: column;
                  align-items: flex-end;
                  max-width: 400px;
                  width: 100%;
                }
                .mapa-right label {
                  font-size: 0.7rem;
                  color: #fff9eb;
                }
                .mapa-price {
                  margin-top: 4px;
                  margin-bottom: 0px;
                  text-align: left;
                  font-size: 1.1rem;
                  font-weight: 100;
                  color: #fff9eb;
                }
                .mapa-features {
                  margin-top: 0px;
                  margin-bottom: 5px;
                  margin-left: 8px;
                  padding-left: 32px;
                  color: #fff9eb;
                  font-size: 0.8rem;
                  line-height: 1.5;
                }
                .mapa-features li::marker {
                  color: #d57bcc;
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
          </>
        ) : (
          <section className="mapa-report">
            <div className="report-page">
              <div className="report-top">
                <div className="report-chart">
                  <div id="chart-container" className="report-chart-inner" />
                </div>
              </div>

              <div className="report-row report-row-1">
                <div className="report-planets">
                  <table>
                    <thead>
                      <tr>
                        <th className="col-planet">Planeta</th>
                        <th className="col-sign">Signo</th>
                        <th className="col-house">Casa</th>
                        <th className="col-rx">Rx</th>
                      </tr>
                    </thead>

                    <tbody>
                      {sortPositions(mapData?.positions).map((p: any) => (
                        <tr key={p.planet}>
                          <td className="cell-planet col-planet">
                            <span className="planet-symbol">{PLANET_GLYPHS[p.planet] ?? ''}</span>
                            {PLANET_NAMES[p.planet] && (
                              <span className="planet-name">{PLANET_NAMES[p.planet]}</span>
                            )}
                          </td>

                          <td className="cell-sign-degree col-sign">
                            {SIGN_ICONS[p.sign] && (
                              <Image
                                src={SIGN_ICONS[p.sign]}
                                alt={p.sign}
                                width={14}
                                height={14}
                                className="sign-icon"
                              />
                            )}
                            <span className="sign-name">{p.sign}</span>
                            <span className="degree-text">{formatDegree(p.degree)}</span>
                          </td>

                          <td className="col-house">{p.house}</td>
                          <td className="col-rx">{p.retrograde ? 'R' : ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="report-houses">
                  <table>
                    <thead>
                      <tr>
                        <th className="col-house-num">Casa</th>
                        <th className="col-house-sign">Signo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mapData?.houses?.map((h: any) => (
                        <tr key={h.house}>
                          <td className="col-house-num">{h.house}</td>
                          <td className="cell-sign-degree col-house-sign">
                            {SIGN_ICONS[h.sign] && (
                              <Image
                                src={SIGN_ICONS[h.sign]}
                                alt={h.sign}
                                width={14}
                                height={14}
                                className="sign-icon"
                              />
                            )}
                            <span className="sign-name">{h.sign}</span>
                            <span className="degree-text">{formatDegree(h.degree)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="report-row report-row-2">
                <div className="report-elements">
                  <table>
                    <thead>
                      <tr>
                        <th className="col-element">Elemento</th>
                        <th className="col-element-total">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mapData?.elements &&
                        Object.entries(mapData.elements).map(([elem, total]: any) => (
                          <tr key={elem}>
                            <td className="col-element">{elem}</td>
                            <td className="col-element-total">{total}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                <div className="report-modalities">
                  <table>
                    <thead>
                      <tr>
                        <th className="col-modality">Modalidade</th>
                        <th className="col-modality-total">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mapData?.quadruplicities &&
                        Object.entries(mapData.quadruplicities).map(([mode, total]: any) => (
                          <tr key={mode}>
                            <td className="col-modality">{mode}</td>
                            <td className="col-modality-total">{total}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* BARRA DE PROGRESSO - NOVO */}
              {isGeneratingChunks && (
                <div className="progress-container">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${((currentChunkIndex + 1) / ANALYSIS_CHUNKS.length) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="progress-text">
                    Gerando análise... Parte {currentChunkIndex + 1} de {ANALYSIS_CHUNKS.length}
                  </p>
                </div>
              )}

              <div className="report-history">
                <div className="chat-history">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`message ${msg.role}`}>
                      <div
                        className={`message-content ${
                          msg.role === 'user' ? 'user-message' : 'ai-message'
                        }`}
                      >
                        {msg.role === 'assistant' ? (
                          <div className="report-content prose max-w-none">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          msg.content
                        )}
                      </div>
                    </div>
                  ))}

                  {isLoading && !isGeneratingChunks && (
                    <div className="message assistant typing-indicator">
                      <div className="message-content ai-message">
                        <div className="typing-dots">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              <button
                type="button"
                className="chat-send-btn"
                style={{
                  width: '100%',
                  marginTop: '24px',
                  padding: '15px',
                  borderRadius: '8px',
                  justifyContent: 'center',
                  color: '#fff9eb',
                  opacity: canGeneratePdf ? 1 : 0.5,
                  cursor: canGeneratePdf ? 'pointer' : 'not-allowed',
                }}
                disabled={!canGeneratePdf}
                onClick={handleGeneratePdf}
              >
                {isGeneratingChunks
                  ? `Gerando... ${currentChunkIndex + 1}/${ANALYSIS_CHUNKS.length}`
                  : 'GERAR PDF'}
              </button>
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

              .report-top {
                display: flex;
                justify-content: center;
                margin-bottom: 24px;
              }
              .report-chart {
                display: flex;
                justify-content: center;
                width: 100%;
              }
              .report-chart-inner {
                margin: 0 auto;
                text-align: center;
                width: 100%;
                max-width: 620px;
              }
              .report-chart-inner :global(svg) {
                width: 100%;
                height: auto;
                display: block;
                transform: scale(1.08);
                transform-origin: center center;
              }

              .report-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 24px;
                align-items: flex-start;
                margin-bottom: 24px;
              }

              .report-planets table,
              .report-houses table,
              .report-elements table,
              .report-modalities table {
                width: 100%;
                border-collapse: collapse;
                font-size: 0.78rem;
                color: #111111;
              }

              .report-planets thead th,
              .report-houses thead th,
              .report-elements thead th,
              .report-modalities thead th {
                background: #893f89;
                color: #fff9eb;
                font-weight: 600;
                padding: 2px 4px;
                vertical-align: middle;
                white-space: nowrap;
              }

              .report-planets tbody tr,
              .report-houses tbody tr,
              .report-elements tbody tr,
              .report-modalities tbody tr {
                border-bottom: 1px solid rgba(0, 0, 0, 0.08);
              }

              .report-planets td,
              .report-houses td,
              .report-elements td,
              .report-modalities td {
                padding: 2px 4px;
                line-height: 1.1;
                vertical-align: middle;
                white-space: nowrap;
                color: #111111;
              }

              .col-planet {
                text-align: left;
              }
              .col-sign {
                text-align: left;
              }
              .col-house {
                text-align: center;
              }
              .col-rx {
                text-align: center;
              }
              .col-house-num {
                text-align: center;
              }
              .col-house-sign {
                text-align: left;
              }
              .col-element {
                text-align: left;
              }
              .col-element-total {
                text-align: center;
              }
              .col-modality {
                text-align: left;
              }
              .col-modality-total {
                text-align: center;
              }

              .planet-symbol {
                font-size: 0.78rem;
              }
              .planet-name {
                font-size: 0.68rem;
              }

              .cell-sign-degree {
                display: inline-flex;
                align-items: center;
                gap: 4px;
              }
              .sign-icon {
                display: inline-block;
                max-width: 14px;
                max-height: 14px;
              }
              .sign-name {
                font-size: 0.68rem;
              }
              .degree-text {
                font-size: 0.78rem;
                margin-left: 2px;
              }

              /* BARRA DE PROGRESSO - NOVO */
              .progress-container {
                margin: 24px 0;
                padding: 16px;
                background: rgba(137, 63, 137, 0.05);
                border-radius: 8px;
              }
              .progress-bar {
                width: 100%;
                height: 6px;
                background: rgba(137, 63, 137, 0.2);
                border-radius: 3px;
                overflow: hidden;
              }
              .progress-fill {
                height: 100%;
                background: #893f89;
                transition: width 0.3s ease;
              }
              .progress-text {
                margin-top: 8px;
                text-align: center;
                font-size: 0.85rem;
                color: #893f89;
                font-weight: 500;
              }

              .report-history .chat-history {
                margin-top: 8px;
              }
              .report-history .message {
                background: transparent;
                box-shadow: none;
                padding: 0;
                margin-bottom: 16px;
              }
              .report-history .message-content {
                background: transparent;
                padding: 0;
                border-radius: 0;
                color: #111;
              }
              .report-history .ai-message {
                background: transparent;
              }
              .report-history .user-message {
                font-weight: 600;
              }

              @media (max-width: 900px) {
                .report-page {
                  padding: 24px 16px 40px;
                }
                .report-row {
                  grid-template-columns: 1fr;
                }
                .report-chart-inner {
                  max-width: 600px;
                }
              }
            `}</style>
          </section>
        )}
      </div>
    </div>
  );
}
