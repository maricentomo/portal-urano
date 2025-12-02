import streamlit as st

def render():
    # CSS para background de estrelas em tela cheia
    st.markdown("""
        <style>
        /* Background de estrelas cobrindo toda a página */
        .stApp {
            background-image: url('stars_background.png');
            background-size: cover;
            background-position: center;
            background-attachment: fixed;
            background-repeat: no-repeat;
        }
        
        /* Overlay escuro semi-transparente para melhorar legibilidade */
        .stApp::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(180deg, rgba(14, 11, 22, 0.7), rgba(14, 11, 22, 0.85));
            z-index: -1;
        }
        
        /* Container principal centralizado */
        .home-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 70vh;
            padding: 40px 20px;
        }
        
        /* Card glassmórfico para conteúdo */
        .glass-card {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border-radius: 30px;
            border: 1px solid rgba(199, 167, 235, 0.2);
            padding: 50px 60px;
            max-width: 900px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        
        /* Título principal */
        .main-title {
            font-size: 4rem;
            font-weight: 700;
            text-align: center;
            margin-bottom: 20px;
            background: linear-gradient(135deg, #ffffff, #c7a7eb);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-family: 'Cinzel', serif;
        }
        
        /* Subtítulo */
        .subtitle {
            font-size: 1.3rem;
            line-height: 1.8;
            color: rgba(255, 255, 255, 0.8);
            text-align: center;
            margin-bottom: 40px;
            max-width: 700px;
        }
        
        /* Botões de ação */
        .action-buttons {
            display: flex;
            gap: 15px;
            justify-content: center;
            flex-wrap: wrap;
            margin-top: 30px;
        }
        
        .action-btn-stars {
            background: rgba(199, 167, 235, 0.15);
            border: 1.5px solid rgba(199, 167, 235, 0.4);
            color: #ffffff;
            padding: 12px 24px;
            border-radius: 25px;
            font-size: 0.95rem;
            font-weight: 500;
            transition: all 0.3s ease;
            cursor: pointer;
        }
        
        .action-btn-stars:hover {
            background: rgba(199, 167, 235, 0.25);
            border-color: #c7a7eb;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(199, 167, 235, 0.3);
        }
        </style>
    """, unsafe_allow_html=True)
    
    # Container centralizado
    st.markdown('<div class="home-container">', unsafe_allow_html=True)
    
    # Card glassmórfico
    st.markdown('<div class="glass-card">', unsafe_allow_html=True)
    
    # Título principal
    st.markdown("""
        <h1 class="main-title">
            Portal Urano
        </h1>
    """, unsafe_allow_html=True)
    
    # Subtítulo
    st.markdown("""
        <p class="subtitle">
            Seu assistente de astrologia está pronto.<br>
            Explore os mistérios do cosmos, desvende seu mapa astral e descubra conexões ocultas no universo.
        </p>
    """, unsafe_allow_html=True)
    
    # Botões de ação
    st.markdown("""
        <div class="action-buttons">
            <div class="action-btn-stars">📊 Trânsitos Planetários</div>
            <div class="action-btn-stars">💫 Meu Mapa Astral</div>
            <div class="action-btn-stars">♡ Compatibilidade</div>
        </div>
    """, unsafe_allow_html=True)
    
    st.markdown('</div>', unsafe_allow_html=True)  # Fecha glass-card
    st.markdown('</div>', unsafe_allow_html=True)  # Fecha home-container
    
    # Input de mensagem
    st.markdown("<br><br>", unsafe_allow_html=True)
    
    user_input = st.text_input(
        "", 
        placeholder="✨ Envie uma mensagem para começar sua jornada cósmica...", 
        key="chat_input_home", 
        label_visibility="collapsed"
    )
    
    if user_input:
        # Redirecionar para o Mapa Astral com a pergunta
        st.session_state.current_page = "Mapa Astral"
        st.session_state.suggestion_input = user_input
        st.rerun()
    
    # Footer
    st.markdown("""
        <div style="
            text-align: center; 
            color: rgba(255, 255, 255, 0.4); 
            font-size: 11px; 
            margin-top: 50px;
            padding: 10px;
        ">
            A IA pode cometer erros. Verifique informações importantes.
        </div>
    """, unsafe_allow_html=True)

