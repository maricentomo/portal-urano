import streamlit as st
import requests
import json
import google.generativeai as genai

# Configurar API key de forma segura
import os
try:
    # Tenta pegar dos secrets do Streamlit (local)
    API_KEY = st.secrets["GOOGLE_API_KEY"]
except Exception as e:
    # Se falhar, tenta pegar das variáveis de ambiente (Railway/Deploy)
    API_KEY = os.environ.get("GOOGLE_API_KEY")
    if not API_KEY:
        st.error(f"⚠️ Chave de API não configurada. Erro ao ler secrets: {e}")
        st.stop()

genai.configure(api_key=API_KEY)

# --- IMPORTANTE: SUAS INSTRUÇÕES (A PERSONALIDADE DO ROBÔ) ---
INSTRUCOES_SISTEMA = """
IDENTIDADE E OBJETIVO
Você é o Astro IA, um GPT especializado em análise astrológica profunda e técnica. Seu objetivo é interpretar mapas natais com precisão psicológica, revelando padrões energéticos, potenciais e desafios evolutivos. Sua abordagem é direta, profunda e analítica, evitando sentimentalismos excessivos ou linguagem piegas.

TOM E ESTILO DAS RESPOSTAS
Linguagem técnica porém acessível: Use terminologia astrológica adequada com explicações claras
Profundidade psicológica: Analise motivações inconscientes, padrões comportamentais e dinâmicas internas
Objetividade analítica: Seja direto ao ponto, evitando rodeios ou dramatizações
Luz e Sombra: Para cada posicionamento, SEMPRE apresente tanto os potenciais (luz) quanto os desafios/bloqueios (sombra)
Respostas longas e detalhadas, ricas em informações práticas
Contextualize cada elemento dentro da totalidade do mapa

ESTRUTURA DA ANÁLISE
INTERATIVIDADE
A cada seção concluída, pergunte: "Esta análise faz sentido para você? Podemos avançar?"
Cada tópico abaixo deve ser uma resposta separada. Para cada posicionamento, sempre inclua: 
✓ Contexto dentro do mapa como um todo 
✓ Aspectos relevantes (conjunções, quadraturas, trígonos, sextis, oposições) 
✓ LUZ: Potenciais, dons, facilidades 
✓ SOMBRA: Desafios, bloqueios, tendências disfuncionais 
✓ Orientações práticas para integração

1. VISÃO GERAL DO MAPA
Elemento Predominante e Escassez. Identifique excessos e faltas.
LUZ: Como a predominância pode ser usada como força
SOMBRA: Desequilíbrios e compensações problemáticas
Orientações práticas para equilibrar elementos escassos
Modalidade Predominante. Como a modalidade molda o estilo de ação.
LUZ: Qualidades naturais da modalidade
SOMBRA: Rigidez ou dispersão excessiva
Se houver concentração de planetas em casas ou hemisférios específicos, analise aqui.

2. TRÍADE PRINCIPAL: SOL, LUA E ASCENDENTE
Explique brevemente o significado de cada luminária antes de analisar:
Sol: Identidade essencial, propósito vital
Lua: Mundo emocional, necessidades, segurança
Ascendente: Máscara social, abordagem da vida
Para cada um (Sol, Lua, Ascendente), analise:
Signo + Casa + Aspectos principais
LUZ: Dons e potenciais desta posição
SOMBRA: Desafios e bloqueios típicos
Como se integra ao restante do mapa

3. PLANETAS PESSOAIS
Mercúrio, Vênus e Marte (signo + casa + aspectos)
Para cada planeta:
Explique brevemente sua função psicológica
Analise posicionamento sempre no contexto do mapa
LUZ: Como esta energia pode fluir de forma construtiva
SOMBRA: Bloqueios, compensações, expressões disfuncionais
Orientações práticas para integração

4. PLANETAS SOCIAIS: JÚPITER E SATURNO
Júpiter (signo + casa + aspectos)
LUZ: Onde há expansão, sorte, crescimento natural
SOMBRA: Exagero, arrogância, falta de limites
Saturno (signo + casa + aspectos)
LUZ: Estrutura, disciplina, maturidade conquistada
SOMBRA: Medo, rigidez, autossabotagem, bloqueios
Como Júpiter e Saturno dialogam no mapa? Onde se complementam ou entram em conflito?

5. MEIO DO CÉU: VOCAÇÃO E PROPÓSITO PÚBLICO
Signo do MC + aspectos
Regente do MC (posição e aspectos)
LUZ: Dons vocacionais, forma ideal de contribuir socialmente
SOMBRA: Conflitos entre vocação e expectativas externas, bloqueios profissionais
Conexões com Casas 2, 6 e 10
Orientações práticas para alinhamento vocacional

6. CASAS ASTROLÓGICAS: ANÁLISE POR TRÍADES
IMPORTANTE: Organize a análise em QUATRO TRÍADES, não casa por casa sequencial.
TRÍADE DE FOGO (Casas 1, 5, 9) — IDENTIDADE E AUTOEXPRESSÃO
TRÍADE DE TERRA (Casas 2, 6, 10) — MUNDO MATERIAL E PRODUTIVIDADE
TRÍADE DE AR (Casas 3, 7, 11) — RELACIONAMENTOS E COMUNICAÇÃO
TRÍADE DE ÁGUA (Casas 4, 8, 12) — PROFUNDEZAS E TRANSFORMAÇÃO

7. PRINCIPAIS ASPECTOS
Stelliums (quando houver 3+ planetas no mesmo signo/casa)
LUZ: Concentração de energia, talentos específicos
SOMBRA: Obsessão, desequilíbrio, falta de perspectiva
Para Ascendente, MC e todos os planetas, analise:
Conjunções (0°): Fusão de energias
Trígonos (120°): Fluidez natural
Quadraturas (90°): Tensão produtiva ou bloqueio
Sextis (60°): Oportunidades que exigem ação
Oposições (180°): Polarização, necessidade de integração

8. PONTOS KÁRMICOS: EIXO EVOLUTIVO
Nodos Lunares (Nodo Sul e Nodo Norte por signo e casa)
Nodo Sul: Padrões do passado, zona de conforto, talentos inatos
Nodo Norte: Direção evolutiva, desafio de crescimento
LUZ/SOMBRA de cada nodo
Como fazer a transição do Sul para o Norte
Quíron (signo + casa + aspectos)
Ferida Primordial: Qual é a dor essencial deste posicionamento
Caminho de Cura: Como transformar ferida em sabedoria
Lilith (signo + casa + aspectos)
Repressão: O que foi negado, rejeitado, selvagem
LUZ: Poder autêntico, sexualidade integrada, autonomia
SOMBRA: Raiva reprimida, autodestrutividade, manipulação

9. PERGUNTAS FINAIS E DIRECIONAMENTO
"Qual área você gostaria de aprofundar? Tem alguma questão específica sobre:
Carreira: Casas 2, 6, 10 + Saturno + MC
Relacionamentos: Casas 5, 7 + Vênus + Lua
Propósito: Nodos + Casa 9 + Júpiter
Transformação pessoal: Casa 8 + Plutão + Quíron"

IMPORTANTE: Use títulos destacados em cada seção e mantenha um tom didático e técnico, evitando informalidades excessivas.
"""

def render():
    # --- HEADER CUSTOMIZADO ---
    st.markdown("""
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 20px; background-color: #110f1e; border-bottom: 1px solid #333; margin-bottom: 20px; border-radius: 10px;">
        <div style="display: flex; align-items: center; gap: 15px;">
            <div style="background-color: #9a64ce; padding: 8px; border-radius: 8px;">
                <span style="font-size: 20px;">🗺️</span>
            </div>
            <div>
                <div style="color: white; font-weight: bold; font-size: 16px;">Mapa Astral</div>
                <div style="color: #888; font-size: 12px;">Análise profunda da sua personalidade cósmica</div>
            </div>
        </div>
        <div>
            <button style="background: none; border: none; color: #666; cursor: pointer; font-size: 18px;">🗑️</button>
        </div>
    </div>
    """, unsafe_allow_html=True)

    # Inicialização de estados da sessão
    if "messages" not in st.session_state:
        st.session_state.messages = []

    if "dados_mapa" not in st.session_state:
        st.session_state.dados_mapa = None

    if "etapa" not in st.session_state:
        st.session_state.etapa = "inicial"

    # Se ainda não tiver calculado o mapa, mostrar formulário
    if st.session_state.etapa == "inicial":
        st.markdown("<h2 style='text-align: center; color: #9a64ce;'>Inicie sua Jornada Cósmica</h2>", unsafe_allow_html=True)
        with st.form("meu_formulario"):
            col1, col2, col3 = st.columns(3)
            with col1:
                nome = st.text_input("Nome Completo")
                cidade = st.text_input("Cidade de Nascimento")
            with col2:
                data_nasc = st.text_input("Data (DD/MM/AAAA)", placeholder="Ex: 29/10/1981")
                pais = st.text_input("País", value="Brazil")
            with col3:
                hora_nasc = st.text_input("Hora (HH:MM)", placeholder="Ex: 05:45")

            submit = st.form_submit_button("✨ Iniciar Consulta", use_container_width=True)

        # LÓGICA: CLICOU NO BOTÃO
        if submit:
            if not data_nasc or not hora_nasc or not cidade or not nome:
                st.warning("Preencha todos os dados!")
                st.stop()

            # 1. MOSTRAR QUE ESTÁ PENSANDO
            status = st.status("Consultando os astros...", expanded=True)

            try:
                # 2. CHAMAR O MOTOR DE CÁLCULO (RAILWAY)
                status.write("📐 Calculando posições matemáticas...")
                payload = {
                    "date": data_nasc,
                    "time": hora_nasc,
                    "city": cidade,
                    "country": pais
                }
                # URL da API no Railway
                response = requests.post("https://api-mapa-astral-production.up.railway.app/calculate", json=payload)

                if response.status_code == 200:
                    dados_json = response.json()
                    status.write("✅ Mapa calculado! Iniciando consulta...")

                    # Armazenar os dados do mapa
                    st.session_state.dados_mapa = dados_json
                    st.session_state.etapa = "chatbot_ativo"

                    # Adicionar mensagem de boas-vindas ao histórico
                    mensagem_inicial = f"""
                    # INÍCIO DA CONSULTA ASTROLÓGICA

                    Dados recebidos e mapa calculado com sucesso. Vamos iniciar a análise do seu mapa natal.

                    ## Tabela 1: Posições Planetárias
                    """

                    # Criar tabela de posições planetárias a partir dos dados JSON
                    tabela_posicoes = "| Ponto | Signo | Grau | Casa | Retrógrado |\n| --- | --- | --- | --- | --- |\n"
                    for planeta, dados in dados_json.get("planets", {}).items():
                        signo = dados.get("sign", "")
                        grau = dados.get("degree", "")
                        casa = dados.get("house", "")
                        retrogrado = "Sim" if dados.get("retrograde", False) else "Não"
                        tabela_posicoes += f"| {planeta} | {signo} | {grau}° | {casa} | {retrogrado} |\n"

                    mensagem_inicial += tabela_posicoes
                    mensagem_inicial += """

                    Vamos analisar seu mapa natal seguindo uma estrutura técnica e didática. A cada seção, farei uma pausa para verificar se a análise está fazendo sentido para você.

                    Podemos começar com a Visão Geral do Mapa?
                    """

                    st.session_state.messages.append({"role": "assistant", "content": mensagem_inicial})

                    status.update(label="Mapa Calculado!", state="complete", expanded=False)
                    st.rerun()

                else:
                    status.update(label="Erro no Cálculo", state="error")
                    st.error(f"Ocorreu um erro na API Local: {response.text}")

            except Exception as e:
                status.update(label="Erro Crítico", state="error")
                st.error(f"Erro de conexão: {e}")
                st.info("Verifique se o terminal 'python main.py' está rodando!")

    # Se já tiver calculado o mapa, mostrar chat
    else:
        # --- EMPTY STATE (Se não houver mensagens ou apenas a inicial) ---
        # Na verdade, sempre teremos a mensagem inicial se o mapa foi calculado.
        # Mas vamos simular o layout da imagem para quando o usuário ainda não interagiu muito ou quer sugestões.
        
        # Se só tiver a mensagem inicial do sistema, mostramos o "Empty State" visual acima do chat
        if len(st.session_state.messages) <= 1:
            st.markdown("""
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; margin-top: 50px; margin-bottom: 50px;">
                <div style="background-color: #1a1a1a; padding: 20px; border-radius: 20px; margin-bottom: 20px; border: 1px solid #333;">
                    <span style="font-size: 40px;">🤖</span>
                </div>
                <h1 style="color: #e0e0e0; font-family: 'Cinzel', serif; margin-bottom: 10px;">MAPA ASTRAL</h1>
                <p style="color: #888; text-align: center; max-width: 500px; margin-bottom: 30px;">
                    Os números revelam o código oculto do seu destino. Vamos decifrar sua matriz juntos.
                </p>
            </div>
            """, unsafe_allow_html=True)
            
            # Suggestion Chips
            col_s1, col_s2, col_s3 = st.columns(3)
            with col_s1:
                if st.button("O que diz meu momento atual?", use_container_width=True):
                    st.session_state.suggestion_input = "O que diz meu momento atual?"
            with col_s2:
                if st.button("Qual meu propósito?", use_container_width=True):
                    st.session_state.suggestion_input = "Qual meu propósito?"
            with col_s3:
                if st.button("Compatibilidade amorosa", use_container_width=True):
                    st.session_state.suggestion_input = "Fale sobre minha compatibilidade amorosa"

        # Exibir histórico de mensagens
        for message in st.session_state.messages:
            avatar = "logo_olho_final.jpg" if message["role"] == "assistant" else None
            with st.chat_message(message["role"], avatar=avatar):
                st.markdown(message["content"])

        # Lógica para input (Sugestão ou Digitação)
        if "suggestion_input" in st.session_state:
            user_input = st.session_state.suggestion_input
            del st.session_state.suggestion_input
        else:
            user_input = st.chat_input("Envie sua pergunta ao universo...")

        # Se o usuário enviar uma mensagem
        if user_input:
            # Adicionar mensagem do usuário ao histórico
            st.session_state.messages.append({"role": "user", "content": user_input})

            # Exibir mensagem do usuário (se não for rerun imediato)
            # with st.chat_message("user"):
            #    st.markdown(user_input)

            # Preparar o contexto para o modelo

            # Criar histórico de conversa para o modelo
            mensagens = []
            mensagens.append({"role": "system", "content": INSTRUCOES_SISTEMA})

            # Adicionar contexto dos dados do mapa
            contexto = f"""
            Aqui estão os DADOS TÉCNICOS do mapa natal:
            {json.dumps(st.session_state.dados_mapa, ensure_ascii=False)}

            Use títulos em formato Markdown (# para títulos principais, ## para subtítulos) para cada seção da análise.
            Destaque claramente as seções LUZ e SOMBRA em cada análise.
            Mantenha um tom técnico e didático, evitando linguagem informal ou excessivamente emocional.
            """

            mensagens.append({"role": "system", "content": contexto})

            # Adicionar histórico de conversa (últimas 10 mensagens)
            for msg in st.session_state.messages[-10:]:
                mensagens.append({"role": msg["role"], "content": msg["content"]})

            # Chamar o modelo
            # Usar st.spinner ou placeholder para streaming
            with st.chat_message("assistant", avatar="logo_olho_final.jpg"):
                message_placeholder = st.empty()

                try:
                    # Criar o modelo
                    model = genai.GenerativeModel('gemini-2.5-flash')

                    # Corrigir os papéis para compatibilidade com o modelo Gemini
                    chat_history = []
                    for m in mensagens:
                        role = "model" if m["role"] in ["assistant", "system"] else "user"
                        chat_history.append({"role": role, "parts": [m["content"]]})

                    # Gerar resposta com streaming
                    chat = model.start_chat(history=chat_history)
                    response = chat.send_message(user_input, stream=True)

                    # Exibir resposta com streaming
                    full_response = ""
                    for chunk in response:
                        if hasattr(chunk, 'text'):
                            full_response += chunk.text
                            message_placeholder.markdown(full_response + "▌")

                    message_placeholder.markdown(full_response)

                    # Adicionar resposta ao histórico
                    st.session_state.messages.append({"role": "assistant", "content": full_response})
                    
                    # Rerun para atualizar a interface e remover o estado de sugestão se houver
                    st.rerun()

                except Exception as e:
                    st.error(f"Erro ao gerar resposta: {e}")

