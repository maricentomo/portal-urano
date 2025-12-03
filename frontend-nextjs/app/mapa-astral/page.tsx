'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

const CHAT_API_URL = '/api/chat';
const CALCULATE_API_URL = '/api/calculate';

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

export default function MapaAstralPage() {
    // Estados
    const [step, setStep] = useState<'form' | 'chat'>('form');
    const [birthData, setBirthData] = useState<BirthData>({
        name: '',
        date: '',
        time: '',
        city: '',
        country: 'Brazil'
    });
    const [mapData, setMapData] = useState<any>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Manipulação do Formulário
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setBirthData(prev => ({ ...prev, [name]: value }));
    };

    const handleCalculate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!birthData.name || !birthData.date || !birthData.time || !birthData.city) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        setIsLoading(true);
        setStatusMessage('Consultando os astros...');

        try {
            // 1. Calcular Mapa
            setStatusMessage('📐 Calculando posições matemáticas...');
            const response = await fetch(CALCULATE_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(birthData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Erro ao calcular o mapa');
            }

            const data = await response.json();
            setMapData(data);

            // 2. Iniciar Chat
            setStep('chat');
            setStatusMessage('');

            // Mensagem inicial do sistema
            const initialMessage = `Aguarde enquanto calculo e analiso seu mapa astral completo...`;

            setMessages([{ role: 'assistant', content: initialMessage }]);

            // Disparar a análise automática
            await sendAnalysisRequest(data);

        } catch (error: any) {
            console.error('Erro:', error);
            alert(`Erro: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Função para enviar o pedido de análise automática
    const sendAnalysisRequest = async (mapData: any) => {
        setIsLoading(true);
        try {
            const response = await fetch(CHAT_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: "Faça a análise completa do meu mapa seguindo as instruções do sistema.",
                    history: [],
                    map_data: mapData
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
                { role: 'assistant', content: `❌ Erro: ${error.message || 'Ocorreu um erro ao processar sua análise.'}` }
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
            .replace(/\n/g, '<br>')
            .replace(/\| (.*?) \|/g, (match) => {
                // Simple table formatting (very basic)
                return `< div class="table-row" > ${match}</div > `;
            });
    };

    return (
        <div className="chat-page">
            {/* Texture Banner */}
            <div className="texture-banner">
                <Image src="/textura.png" alt="Textura Mística" width={1920} height={90} style={{ objectFit: 'cover' }} />
            </div>

            <div className="chat-center">
                {step === 'form' ? (
                    <div className="form-container" style={{ maxWidth: '600px', margin: '40px auto', padding: '20px', backgroundColor: '#1a1a1a', borderRadius: '15px', color: 'white' }}>
                        <h2 style={{ textAlign: 'center', color: '#9a64ce', marginBottom: '30px' }}>Inicie sua Jornada Cósmica</h2>
                        <form onSubmit={handleCalculate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px' }}>Nome Completo</label>
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
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px' }}>Data (DD/MM/AAAA)</label>
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
                                    <label style={{ display: 'block', marginBottom: '8px' }}>Hora (HH:MM)</label>
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
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px' }}>Cidade</label>
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
                                    <label style={{ display: 'block', marginBottom: '8px' }}>País</label>
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
                                style={{ width: '100%', marginTop: '20px', padding: '15px', borderRadius: '8px', justifyContent: 'center' }}
                                disabled={isLoading}
                            >
                                {isLoading ? statusMessage : '✨ Iniciar Consulta'}
                            </button>
                        </form>
                    </div>
                ) : (
                    <>
                        <div className="chat-history">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`message ${msg.role} `}>
                                    <div
                                        className={`message - content ${msg.role === 'user' ? 'user-message' : 'ai-message'} `}
                                        dangerouslySetInnerHTML={{ __html: msg.role === 'assistant' ? formatMarkdown(msg.content) : msg.content }}
                                    />
                                </div>
                            ))}
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

                        {/* Chat input removido conforme solicitado */}
                    </>
                )}
            </div>
        </div>
    );
}
