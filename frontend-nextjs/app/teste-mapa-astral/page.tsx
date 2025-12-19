// app/teste-mapa-astral/page.tsx  (ou o nome que você deu)

import Link from "next/link";

export default function SalesPage() {
  return (
    <div className="bg-neutral-900 text-cream-50 min-h-screen p-8 md:p-12 font-sans">
      {/* HERO SECTION */}
      <div className="max-w-4xl mx-auto text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-serif text-purple-300 mb-6 tracking-tight">
          O Manual da sua Vida <br /> escrito pelas Estrelas.
        </h1>
        <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Esqueça os resumos. Receba uma análise profissional de{" "}
          <strong>+50 páginas</strong> sobre sua missão, amor e destino.
        </p>
        <button className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 px-8 rounded-full shadow-[0_0_20px_rgba(147,51,234,0.5)] transition-all transform hover:scale-105">
          QUERO MEU MAPA COMPLETO
        </button>
      </div>

      {/* MOCKUP SECTION (As imagens do PDF) */}
      <div className="relative w-full max-w-5xl mx-auto mb-20 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="order-2 md:order-1 space-y-6">
          <h2 className="text-3xl font-serif text-purple-200">Design Editorial Único</h2>
          <p className="text-gray-400">
            Unimos a precisão dos cálculos astronômicos com a beleza da arte clássica.
            Seu mapa não é apenas um texto, é um item de colecionador digital.
          </p>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-center gap-2">✨ Gráficos personalizados</li>
            <li className="flex items-center gap-2">✨ Diagramação estilo livro</li>
            <li className="flex items-center gap-2">✨ Interpretação profunda</li>
          </ul>
        </div>

        <div className="order-1 md:order-2 relative h-96 w-full">
          <div className="absolute top-0 right-10 w-64 h-auto transform rotate-6 border-4 border-neutral-800 shadow-2xl z-10">
            <img src="/path-to-image-escorpiao.jpg" alt="Página do Signo" className="rounded-sm" />
          </div>
          <div className="absolute top-10 right-32 w-64 h-auto transform -rotate-3 border-4 border-neutral-800 shadow-2xl z-0 opacity-80">
            <img src="/path-to-image-mapa-roda.jpg" alt="Mandala Astrológica" className="rounded-sm" />
          </div>
        </div>
      </div>

      {/* CTA FINAL */}
      <div className="max-w-3xl mx-auto bg-gradient-to-r from-purple-900/40 to-black border border-purple-500/30 rounded-2xl p-8 text-center mt-12">
        <h3 className="text-2xl font-bold mb-4">Pronto para iniciar sua jornada?</h3>
        <p className="text-gray-400 mb-6">
          Ao clicar abaixo, você será direcionado para inserir seus dados de nascimento.
        </p>
        <button className="w-full md:w-auto bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold py-3 px-10 rounded-lg shadow-lg hover:shadow-purple-500/50 transition-all">
          GERAR MEU MAPA AGORA
        </button>
      </div>
    </div>
  );
}
