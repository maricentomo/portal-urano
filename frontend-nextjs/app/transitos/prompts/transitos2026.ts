// app/transitos/prompts/transitos2026.ts

export type BirthData = {
    name: string;
    date: string; // DD/MM/AAAA
    time: string; // HH:MM
    city: string;
    country: string;
  };
  
  export function buildTransitos2026Instructions(
    birthData?: Partial<BirthData>,
    year: number = 2026
  ) {
    const clientName = (birthData?.name ?? "[Nome do Cliente]").trim() || "[Nome do Cliente]";
    const clientDate = (birthData?.date ?? "[Data]").trim() || "[Data]";
    const clientTime = (birthData?.time ?? "[Hora]").trim() || "[Hora]";
    const clientCity = (birthData?.city ?? "[Local]").trim() || "[Local]";
    const clientCountry = (birthData?.country ?? "[País]").trim() || "[País]";
  
    return `
  VOCÊ VAI GERAR UM RELATÓRIO COMPLETO (PT-BR) USANDO EXCLUSIVAMENTE OS DADOS DO JSON (map_data + transit_data) ENVIADOS JUNTO COM ESTA MENSAGEM.
  
  REGRAS DE DADOS (CRÍTICAS)
  - NÃO invente aspectos “pelo signo” ou “pela casa”.
  - Aspectos SÓ existem se estiverem listados no JSON em:
    - transit_data.slow_planets[].aspects
    - transit_data.months[].aspects
  - Graus e orbes JÁ foram considerados no cálculo: se não estiver no JSON, não existe.
  - Se um planeta em trânsito NÃO tiver aspecto no JSON, NÃO crie interpretação “como se tivesse”.
  - Mercúrio aqui é SEMPRE Mercúrio EM TRÂNSITO (comparado com mapa natal).
  
  PROIBIÇÕES
  - NÃO usar a palavra “pico”.
  - NÃO imprimir placeholders ou marcadores tipo: “[SE HOUVER]”, “[Análise completa:]”, “[IMPORTANTE]”, colchetes vazios etc.
  - NÃO imprimir termos técnicos de aspecto no texto final (“em trígono”, “em quadratura”, “em oposição”, “em conjunção”).
    Você pode usar o tipo do aspecto internamente só para escolher a linguagem, mas não pode expor o termo.
  
  COMO ESCREVER ASPECTOS (SEM TERMO TÉCNICO)
  Quando um planeta em trânsito tocar um planeta/ponto natal, descreva em texto corrido (sem lista só de aspectos), variando a linguagem:
  - “Marte ativa seu Sol de forma desafiadora, trazendo…”
  - “A energia de Marte encontra seu Sol num ponto de tensão…”
  - “Marte desafia seu Sol a…”
  - “Marte pressiona seu Sol a…”
  - “Vênus facilita seu [planeta natal], abrindo espaço para…”
  - “O movimento de Mercúrio tensiona sua mente/comunicação ao tocar seu [planeta natal]…”
  - “Saturno cobra maturidade do seu [planeta natal], pedindo…”
  - “Urano mexe no seu [planeta natal], quebrando padrões e…”
  - “Netuno envolve seu [planeta natal] em sensibilidade e…”
  - “Plutão aprofunda seu [planeta natal], puxando para transformação…”
  
  TEMPO (SEM “PICO”)
  - Para aspectos (do JSON): integre no parágrafo: “Período de influência: DD/MM a DD/MM”.
  - Para lunações/eclipses/quartos: a data exata pode aparecer normalmente.
  - Não encher o texto de datas no restante.
  
  ANTI-REPETIÇÃO (OBRIGATÓRIO)
  - Não repetir a mesma frase/estrutura em sequência.
  - Se você já usou “base sólida / lidar com estresse / paciência e perseverança”, NÃO use de novo igual.
  - Cada aspecto deve ter interpretação específica: planeta em trânsito + planeta natal + casas envolvidas + sensação prática.
    Não reciclar o mesmo parágrafo mudando só o nome do planeta.
  
  LINGUAGEM E TOM
  - Narrativa fluida e contínua, com sensação de movimento do céu.
  - Acessível, sem jargão.
  - Empoderador e esperançoso, sem fatalismo.
  
  ======================================================================
  ESTRUTURA DO RELATÓRIO (isso é o que aparece no texto final)
  ======================================================================
  
  # SEU ANO ASTROLÓGICO ${year}
  ## ${clientName} - Mapa Natal: ${clientDate} ${clientTime} - ${clientCity}/${clientCountry}
  
  ### INTRODUÇÃO PERSONALIZADA
  
  ## 1. PANORAMA ANUAL (apenas uma vez no início)
  
  **Os principais ciclos cósmicos que influenciarão sua jornada:**
  
  🪐 PLUTÃO em [Signo] transitando sua Casa [X]
  Texto profundo e específico sobre o tema da Casa [X].
  Integre (em texto corrido) os contatos de Plutão com pontos natais (se existirem no JSON), mencionando também:
  - planeta natal tocado + casa natal dele
  - casa onde Plutão transita
  - período de influência (DD/MM a DD/MM) se existir
  
  ---
  
  ♆ NETUNO em [Signo] transitando sua Casa [X]
  Texto sobre sensibilidade/dissolução com aterramento (alertas e oportunidades).
  Integre contatos com pontos natais conforme JSON (texto corrido, sem termos técnicos).
  
  ---
  
  ⚡ URANO em [Signo] transitando sua Casa [X]
  Texto sobre mudanças/libertação com exemplos concretos.
  Integre contatos com pontos natais conforme JSON (texto corrido, sem termos técnicos).
  
  ---
  
  ⏳ SATURNO em [Signo] transitando sua Casa [X]
  Texto sobre responsabilidade/maturação/estrutura.
  Se existir retrogradação nos dados, trate como revisão.
  Integre contatos com pontos natais conforme JSON (texto corrido, sem termos técnicos).
  
  ---
  
  🎯 JÚPITER em [Signo(s)] transitando suas Casas [X] e [Y]
  Texto sobre expansão e oportunidades.
  Se houver duas fases no ano, dividir em 2 parágrafos (Jan–Jun / Jun–Dez).
  
  IMPORTANTE: (seguir sem escrever literal)
  - Planetas lentos aparecem só aqui no panorama anual.
  - Na análise mensal, só referenciar quando necessário, sem repetir a análise anual.
  
  ======================================================================
  
  ## 2. ANÁLISE MENSAL
  
  Para cada mês, use exatamente esta estrutura e escreva em texto fluido:
  
  # 📅 [MÊS] ${year}
  
  ## 1. FOCO SOLAR DO MÊS
  2–3 parágrafos sobre o que o Sol ilumina (casa do Sol em trânsito, dia a dia, oportunidades).
  Se houver aspectos do Sol no JSON do mês, integrar na narrativa sem termos técnicos.
  
  ---
  
  ### ❤️ 2. AMOR E RELACIONAMENTOS
  2 parágrafos narrativos conectando Vênus em trânsito e dinâmica relacional.
  Se houver aspectos de Vênus no JSON do mês, integrar sem termos técnicos.
  Se um lento (do panorama anual) estiver por trás do tema, referenciar em 1 frase curta.
  
  ---
  
  ### 💰 3. DINHEIRO E CARREIRA
  2 parágrafos sobre trabalho/rotina/carreira/finanças (casas 2/6/10 quando fizer sentido).
  Integrar Marte (ação) + Vênus (valores) + Mercúrio (decisões/comunicação/negociações) quando aparecerem nos dados do mês.
  Se houver aspectos (Marte/Vênus/Mercúrio/Sol) no JSON, integrar na narrativa sem termos técnicos.
  Se Júpiter/Saturno (do panorama anual) estiverem claramente ativando o tema, 1 frase curta sem repetir análise anual.
  
  ---
  
  ### 🔥 4. MOTIVAÇÃO E ENERGIA DISPONÍVEL
  1–2 parágrafos sobre o “clima motivacional” do mês por elemento:
  - FOGO: impulso/coragem
  - TERRA: consistência/resultados
  - AR: mente/trocas (e risco de dispersão)
  - ÁGUA: emoção/intuição/profundidade
  Fechar com uma sugestão prática simples.
  
  ---
  
  ## 🌑 LUA NOVA (se existir no calendário do mês)
  Texto 2–3 parágrafos + intenções/ritual/afirmações.
  Se fizer conjunção com planeta natal (orbe 8° conforme dados), integrar na narrativa sem listar.
  
  ---
  
  ## 🌕 LUA CHEIA (se existir no calendário do mês)
  Texto 2–3 parágrafos + colheita/liberação/ritual/perguntas.
  Se fizer conjunção com planeta natal (orbe 8° conforme dados), integrar na narrativa sem listar.
  
  ---
  
  ## 🌓 QUARTOS LUNARES (se existirem no calendário do mês)
  Texto curto de 1 parágrafo para cada quarto + ação recomendada.
  Conjunção com planeta natal (orbe 6°) integrada na narrativa.
  
  ---
  
  ## ⚡ EVENTOS ASTROLÓGICOS ESPECIAIS DO MÊS
  Só criar se existirem nos dados. Nunca escrever “[SE HOUVER]”.
  Mercúrio retrógrado / Eclipses / Ingressos / Estações: tudo em texto corrido.
  
  REGRAS (seguir sem imprimir)
  - ORBES lunações: 8° (Nova/Cheia), 6° (Quartos). Só conjunção.
  - PROIBIDO repetir análise dos lentos nos meses.
  - PROIBIDO lista técnica de aspectos.
    `.trim();
  }
  
  // opcional: export fixo (se você quiser importar constante em algum lugar)
  export const TRANSITOS_2026_INSTRUCTIONS = buildTransitos2026Instructions(
    { name: "[Nome do Cliente]", date: "[Data]", time: "[Hora]", city: "[Local]", country: "[País]" },
    2026
  );
  