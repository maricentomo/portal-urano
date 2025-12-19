"use client";

type PlanetPosition = {
  planet: string;
  sign: string;
  degree: string;
  house: number;
};

type AnalysisSection = {
  id: string;
  title: string;
  paragrafos: string[];
};

// MOCKS só pra ver o layout funcionando
const fakePositions: PlanetPosition[] = [
  { planet: "Sol", sign: "Escorpião", degree: "05°21'", house: 1 },
  { planet: "Lua", sign: "Escorpião", degree: "10°02'", house: 1 },
  { planet: "Ascendente", sign: "Escorpião", degree: "01°15'", house: 1 },
];

const fakeSections: AnalysisSection[] = [
  {
    id: "visao-geral",
    title: "1. Visão Geral do Mapa",
    paragrafos: [
      "Parágrafo 1 da visão geral...",
      "Parágrafo 2...",
      "Parágrafo 3...",
      "Parágrafo 4...",
      "Parágrafo 5...",
    ],
  },
  {
    id: "identidade",
    title: "2. Identidade e Eixo Central",
    paragrafos: [
      "Parágrafo 1...",
      "Parágrafo 2...",
      "Parágrafo 3...",
      "Parágrafo 4...",
      "Parágrafo 5...",
    ],
  },
];

interface PageProps {
  params: { id: string };
}

export default function MapaAstralPage({ params }: PageProps) {
  const nomeCliente = "Nome da Pessoa Teste";
  const dadosNascimento = "29/10/1981 • 05:45 • São Paulo, Brasil";
  const signoSolar = "Escorpião";

  // depois você troca isso pelo SVG vindo da API
  const svgUrl = `/api/mapa-astral/${params.id}/svg`;

  const scrollToSection = (id: string) => {
    if (typeof document === "undefined") return;
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-[#f8f3d8] text-zinc-900">
      <div className="max-w-6xl mx-auto px-4 lg:px-0 py-10 space-y-8">
        {/* CABEÇALHO */}
        <header className="bg-[#141216] text-[#fcf5e1] rounded-3xl px-6 py-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between shadow-lg shadow-black/30">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-violet-300">
              Mapa Astral • Portal Urano
            </p>
            <h1 className="text-2xl md:text-3xl font-semibold mt-1">
              {nomeCliente}
            </h1>
            <p className="text-sm text-violet-100/80 mt-1">
              {dadosNascimento}
            </p>
            <p className="text-xs mt-1 text-violet-200/70">
              Sol em {signoSolar}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button className="px-4 py-2 rounded-full bg-violet-500 hover:bg-violet-600 text-sm font-medium flex items-center gap-2 transition">
              <span>⬇</span>
              Baixar PDF
            </button>
            <button className="px-4 py-2 rounded-full border border-violet-400/60 text-sm font-medium hover:bg-violet-900/40 transition">
              Gerar PDF novamente
            </button>
          </div>
        </header>

        {/* DUAS COLUNAS */}
        <main className="grid grid-cols-1 xl:grid-cols-[1.05fr,1.4fr] gap-8 items-start">
          {/* ESQUERDA: MAPA + TABELA */}
          <section className="space-y-6">
            <div className="bg-[#f3ebd4] rounded-3xl p-4 shadow-md shadow-black/10">
              <h2 className="text-sm font-semibold tracking-wide uppercase text-zinc-700 mb-3">
                Mandala do Mapa
              </h2>

              <div className="bg-[#111111] rounded-3xl p-4 flex items-center justify-center">
                <div className="w-full max-w-[430px] mx-auto aspect-square">
                  <img
                    src={svgUrl}
                    alt="Mapa astral"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>

            <div className="bg-[#f3ebd4] rounded-3xl p-4 shadow-md shadow-black/10">
              <h3 className="text-sm font-semibold tracking-wide uppercase text-zinc-700 mb-3">
                Posições principais
              </h3>
              <div className="max-h-80 overflow-auto pr-1">
                <table className="w-full text-xs border-separate border-spacing-y-1">
                  <thead>
                    <tr className="text-[11px] text-zinc-600">
                      <th className="text-left font-medium">Corpo</th>
                      <th className="text-left font-medium">Signo</th>
                      <th className="text-left font-medium">Grau</th>
                      <th className="text-left font-medium">Casa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fakePositions.map((p) => (
                      <tr
                        key={p.planet}
                        className="bg-[#f9f3df] hover:bg-[#f1e5c6] transition"
                      >
                        <td className="py-1.5 px-2 rounded-l-lg font-medium">
                          {p.planet}
                        </td>
                        <td className="py-1.5 px-2">{p.sign}</td>
                        <td className="py-1.5 px-2">{p.degree}</td>
                        <td className="py-1.5 px-2 rounded-r-lg">
                          {p.house}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* DIREITA: TEXTO DA ANÁLISE */}
          <section className="bg-[#f3ebd4] rounded-3xl p-6 shadow-md shadow-black/10 relative">
            <nav className="flex flex-wrap gap-x-4 gap-y-2 mb-5 text-[11px] uppercase tracking-[0.18em] text-zinc-700">
              {fakeSections.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => scrollToSection(sec.id)}
                  className="hover:text-violet-700 transition underline-offset-4 hover:underline"
                >
                  {sec.title.split(". ")[0]}
                </button>
              ))}
            </nav>

            <div className="max-h-[75vh] pr-3 overflow-y-auto space-y-8">
              {fakeSections.map((sec) => (
                <article key={sec.id} id={sec.id} className="space-y-3">
                  <h2 className="text-lg font-semibold text-zinc-900">
                    {sec.title}
                  </h2>
                  {sec.paragrafos.map((p, i) => (
                    <p
                      key={i}
                      className="text-sm leading-relaxed text-zinc-800"
                    >
                      {p}
                    </p>
                  ))}
                </article>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
