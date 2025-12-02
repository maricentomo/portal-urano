'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

const API_URL = '/api/chat';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function MapaAstralPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async () => {
        if (!inputMessage.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', content: inputMessage };
        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: inputMessage,
                    history: messages
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Erro ao conectar com a IA');
            }

            const data = await response.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        } catch (error: any) {
            console.error('Erro:', error);
            setMessages(prev => [
                ...prev,
                { role: 'assistant', content: `❌ Erro: ${error.message || 'Ocorreu um erro ao processar sua mensagem.'}` }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const formatMarkdown = (text: string) => {
        return text
            .replace(/### (.*?)(\n|$)/g, '<h3>$1</h3>')
            .replace(/## (.*?)(\n|$)/g, '<h2>$1</h2>')
            .replace(/# (.*?)(\n|$)/g, '<h1>$1</h1>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');
    };

    return (
        <div className="chat-page">
            {/* Texture Banner */}
            <div className="texture-banner">
                <Image src="/textura.png" alt="Textura Mística" width={1920} height={90} style={{ objectFit: 'cover' }} />
            </div>

            <div className="chat-center">
                <div className="chat-history">
                    {messages.length === 0 ? (
                        <div className="welcome-message">
                            <h1>☉ Mapa Astral</h1>
                            <p>Converse comigo sobre interpretação de mapas astrais, posições planetárias e influências cósmicas.</p>
                        </div>
                    ) : (
                        messages.map((msg, idx) => (
                            <div key={idx} className={`message ${msg.role}`}>
                                <div
                                    className={`message-content ${msg.role === 'user' ? 'user-message' : 'ai-message'}`}
                                    dangerouslySetInnerHTML={{ __html: msg.role === 'assistant' ? formatMarkdown(msg.content) : msg.content }}
                                />
                            </div>
                        ))
                    )}
                    {isLoading && (
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

                <div className="chat-input-wrapper">
                    <div className="chat-input-container">
                        <input
                            type="text"
                            className="chat-input"
                            placeholder="Faça sua pergunta sobre Mapa Astral..."
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                            disabled={isLoading}
                        />
                        <button
                            className="chat-send-btn"
                            onClick={sendMessage}
                            disabled={isLoading}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
