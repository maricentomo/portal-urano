'use client';

import Image from 'next/image';
import { useState } from 'react';

export default function Home() {
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: 'Olá! Como posso te ajudar com sua jornada astrológica? 🌟' }
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const sendMessage = () => {
    if (!inputMessage.trim()) return;

    // Adicionar mensagem do usuário
    setChatMessages(prev => [...prev, { role: 'user', content: inputMessage }]);
    setInputMessage('');

    // Simular resposta (em produção, chamar API)
    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Obrigada pela sua mensagem! Em breve isso será conectado à API. 🌟' }
      ]);
    }, 1000);
  };

  return (
    <div id="home-page" className="page active">
      {/* Texture Banner */}
      <div className="texture-banner">
        <Image src="/textura.png" alt="Textura Mística" width={1920} height={90} style={{ objectFit: 'cover' }} />
      </div>

      {/* Content Area */}
      <div className="home-content">
        <div className="home-text">
          <h1 className="home-title">
            Olá, que bom te ver<br />
            por aqui...
          </h1>
          <p className="home-subtitle">
            Explore os mistérios do cosmos, desvende seu mapa astral <br />e descubra conexões ocultas no universo.
          </p>

          {/* Chat de Ajuda */}
          <div className="chat-container">
            <div className="chat-messages" id="chatMessages">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`chat-message ${msg.role}`}>
                  <div className="message-bubble">{msg.content}</div>
                </div>
              ))}
            </div>
            <div className="chat-input-container">
              <input
                type="text"
                className="chat-input"
                placeholder="Digite sua pergunta..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button className="chat-send-btn" onClick={sendMessage}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="home-image">
          <Image src="/elfa_2.png" alt="Assistente Mística" className="elf-image" width={500} height={600} />
        </div>
      </div>

      {/* Footer */}
      <div className="page-footer">
        A IA pode cometer erros. Verifique informações importantes.
      </div>
    </div>
  );
}
