// app/transitos/transito2026.instructions.ts

export type BirthData = {
    name: string;
    date: string; // DD/MM/AAAA
    time: string; // HH:MM
    city: string;
    country: string;
  };
  
  export function buildTransitos2026Instructions(birthData: BirthData, year = 2026) {
    return `
  ESTRUTURA DO RELATÓRIO
  # SEU ANO ASTROLÓGICO ${year}
  ## ${birthData.name} - Mapa Natal: ${birthData.date}/${birthData.time}/${birthData.city}, ${birthData.country}
  
  ### INTRODUÇÃO PERSONALIZADA
  
  REGRAS GERAIS (CRÍTICO)
  - Português do Brasil. Direto, adulto, sem pieguice.
  - Narrativa fluida e contínua.
  - NÃO escrever colchetes/placeholders no texto final (ex.: “[SE HOUVER]”, “[Signo]”, “[X]”, “[Análise completa:]”).
  - NÃO inventar eventos. Se não existir no JSON, NÃO escreva.
  - NÃO inventar graus, casas, signos, aspectos ou “datas mágicas”.
  - Datas sempre em DD/MM/AAAA.
  
  ASPECTOS (CRÍTICO — É AQUI QUE ESTAVA ERRANDO)
  - Use APENAS os aspectos que vêm no JSON:
    - slow_planets[].aspects (para panorama anual)
    - months[].aspects (para o mês a mês)
  - Aspecto correto depende de GRAU/longitude. Então:
    - Se o aspecto não estiver nos dados, NÃO cite.
  - Quando você usar um aspecto, você DEVE considerar:
    - planeta em trânsito (tPlanet)
    - planeta natal ativado (nPlanet) e a casa natal dele (nHouse)
    - onde o trânsito está passando (tSign_peak / tDeg_peak / tHouse_peak)
    - período de influência (start e end)
  - NÃO usar a palavra “pico”.
  - NÃO listar aspectos em bullet. Um parágrafo por aspecto, com linha em branco entre eles.
  
  COMO ESCREVER ASPECTO (SEM TERMO TÉCNICO)
  Você NÃO pode escrever: “em trígono”, “em quadratura”, “em oposição”, “em conjunção”.
  Você DEVE escrever o efeito em linguagem natural, por exemplo:
  
  Quadratura:
  - “Marte ativa seu Sol de forma desafiadora, trazendo…”
  - “A energia de Marte encontra seu Sol em um momento de tensão…”
  
  Oposição:
  - “Marte puxa seu Sol para um contraste…”
  - “Há um cabo de guerra entre Marte e seu Sol…”
  
  Trígono:
  - “Marte facilita seu Sol, abrindo caminho para…”
  - “A energia de Marte flui com seu Sol…”
  
  Conjunção:
  - “Marte se aproxima e encosta no seu Sol, intensificando…”
  - “A presença de Marte se mistura à força do seu Sol…”
  
  Como inserir o período SEM ‘pico’:
  “Período de influência: DD/MM/AAAA a DD/MM/AAAA.”
  E depois o texto interpretativo.
  
  ============================================================
  1. PANORAMA ANUAL (Apenas no início do documento completo)
  
  **Os principais ciclos cósmicos que influenciarão sua jornada:**
  
  IMPORTANTE (CRÍTICO)
  - Os planetas lentos (Plutão, Netuno, Urano, Saturno, Júpiter) aparecem APENAS UMA VEZ aqui.
  - Na análise mensal, NÃO repetir a análise dos lentos.
  - No mês a mês, só referenciar quando necessário com 1 frase curta:
    “Como mencionado no panorama anual, [PLANETA] continua mexendo em [TEMA], e isso este mês se manifesta em [ÁREA] como…”
  
  PARA CADA PLANETA LENTO:
  - Dizer em que signo e casa ele transita ao longo do ano (usando segments).
  - Se houver retrogradação (retro_periods), mencionar em texto corrido com período (DD/MM/AAAA a DD/MM/AAAA).
  - Se houver aspectos (aspects), integrar no texto (sem termo técnico e sem lista).
  
  Modelo (não é pra deixar placeholders no final, é pra preencher com dados reais):
  🪐 **PLUTÃO em (signo real) transitando sua Casa (número real)**
  [Se houver mudanças no ano, narrar as mudanças de signo/casa.]
  
  Se houver aspectos nos dados, para CADA aspecto:
  - 1 parágrafo com:
    - “Período de influência: DD/MM/AAAA a DD/MM/AAAA.”
    - interpretação em linguagem natural
    - mencionar planeta natal ativado + casa natal
    - mencionar “por volta de X° de Signo, na Casa Y” (sem dizer “pico”)
  
  Repetir o mesmo padrão para NETUNO, URANO, SATURNO e JÚPITER.
  Para Júpiter, se ele mudar de casa/signo no ano, narrar em dois blocos (“primeiro semestre…”, “depois…”), sem listas.
  
  ============================================================
  2. ANÁLISE MENSAL (Janeiro a Dezembro)
  
  Para cada mês, usar exatamente esta estrutura:
  
  # 📅 [MÊS] ${year}
  
  ## 1. FOCO SOLAR DO MÊS
  - 2 a 3 parágrafos.
  - Dizer o foco do Sol por casa/signo (usando segments do Sol).
  - “Transição Solar” apenas se houver mudança de signo/casa dentro do mês (com base nos segments).
  - Se houver aspectos do Sol no JSON do mês, integrar na narrativa SEM termos técnicos e SEM lista.
  
  ### ❤️ 2. AMOR E RELACIONAMENTOS
  - 2 parágrafos.
  - Considerar Vênus natal (signo/casa) e Vênus em trânsito no mês (segments).
  - Se houver aspects de Vênus no JSON do mês, integrar (sem termos técnicos e sem lista).
  - Casas 5 e 7 só se fizer sentido pelo natal e/ou ativação do mês.
  - Se algum lento for relevante, só 1 frase (como mencionado no panorama anual…), sem reexplicar.
  
  ### 💰 3. DINHEIRO E CARREIRA
  - 2 parágrafos.
  - Considerar casas 2, 6 e 10, Vênus e Marte.
  - Se houver aspectos de Marte e/ou Vênus no JSON do mês, integrar sem termos técnicos e sem lista.
  - Se Júpiter/Saturno (ou outro lento) estiverem relevantes, só 1 frase de referência.
  
  ### 🔥 4. MOTIVAÇÃO E ENERGIA DISPONÍVEL
  - 1 a 2 parágrafos.
  - Análise por elemento: “signos de fogo / terra / ar / água” (NÃO listar nomes de signos).
  - Dizer qual elemento domina e como isso afeta motivação, foco, dispersão, emoções.
  - Se houver stellium (3+ planetas), casas angulares (1/4/7/10) ou concentração forte, mencionar.
  
  ============================================================
  LUNAÇÕES E EVENTOS ESPECIAIS (SÓ SE EXISTIREM NOS DADOS DO MÊS)
  
  REGRA (CRÍTICO)
  - Nunca escrever “[SE HOUVER]”.
  - Se o evento não existir no calendário/dados do mês, simplesmente não criar a seção.
  
  ## 🌑 LUA NOVA — (data real)
  - 2 a 3 parágrafos, texto corrido.
  - Sem inventar grau/minuto/casa se não houver nos dados.
  - Conjunções com planeta natal (orbe 8°): só se você tiver base real nos dados. Integrar no texto, sem listar.
  
  ### 🌱 INTENÇÕES E RITUAIS
  **Temas para trabalhar nesta Lua Nova:**
  1. ...
  2. ...
  3. ...
  
  **Ritual sugerido:**
  Texto simples e prático.
  
  **Afirmações poderosas:**
  - "..."
  - "..."
  - "..."
  
  ## 🌕 LUA CHEIA — (data real)
  - 2 a 3 parágrafos.
  - Sem inventar grau/minuto/casa se não houver.
  - Conjunções (orbe 8°) só com base real.
  
  ### 🌾 COLHEITA E LIBERAÇÃO
  Texto corrido, sem lista.
  
  ## 🌓 QUARTOS LUNARES
  - Só escrever se existir no calendário/dados.
  - 1 parágrafo por quarto + 1 ação recomendada.
  
  ## ⚡ EVENTOS ASTROLÓGICOS ESPECIAIS DO MÊS
  - Só incluir se existir no calendário/dados.
  - Mercúrio retrógrado: análise em texto corrido (sem “Período: … Signos: … Suas casas: …” em linha corrida modelo).
  - Eclipses: análise profunda, sem terror e sem checklist.
  `.trim();
  }
  