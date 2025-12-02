'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

export default function Sidebar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                className="mobile-menu-btn"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle menu"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 12h18M3 6h18M3 18h18" />
                </svg>
            </button>

            {/* Overlay */}
            {isOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="logo-container">
                        <Link href="/">
                            <Image src="/logo_novo.png" alt="Portal Urano" className="logo" width={240} height={80} />
                        </Link>
                    </div>
                </div>

                <div className="sidebar-divider"></div>

                <nav className="sidebar-nav">
                    {/* ASTROLOGIA */}
                    <div className="sidebar-category-title">ASTROLOGIA</div>
                    <Link href="/mapa-astral" className="sidebar-button" onClick={() => setIsOpen(false)}>☉ Mapa Astral</Link>
                    <Link href="/revolucao-solar" className="sidebar-button" onClick={() => setIsOpen(false)}>⊙ Revolução Solar</Link>
                    <Link href="/sinastria" className="sidebar-button" onClick={() => setIsOpen(false)}>♡ Sinastria</Link>
                    <Link href="/vocacional" className="sidebar-button" onClick={() => setIsOpen(false)}>⚙ Vocacional</Link>
                    <Link href="/infantil" className="sidebar-button" onClick={() => setIsOpen(false)}>○ Infantil</Link>
                    <Link href="/transitos" className="sidebar-button" onClick={() => setIsOpen(false)}>⊕ Trânsitos</Link>

                    {/* MATRIZ DO DESTINO */}
                    <div className="sidebar-category-title">MATRIZ DO DESTINO</div>
                    <Link href="/matriz-pessoal" className="sidebar-button" onClick={() => setIsOpen(false)}>◎ Matriz Pessoal</Link>
                    <Link href="/matriz-compatibilidade" className="sidebar-button" onClick={() => setIsOpen(false)}>⬡ Matriz Compatibilidade</Link>
                    <Link href="/matriz-infantil" className="sidebar-button" onClick={() => setIsOpen(false)}>○ Matriz Infantil</Link>

                    {/* TUTORIAIS */}
                    <div className="sidebar-category-title">TUTORIAIS</div>
                    <Link href="/videos" className="sidebar-button" onClick={() => setIsOpen(false)}>▷ Vídeos</Link>
                    <Link href="/pdfs" className="sidebar-button" onClick={() => setIsOpen(false)}>□ PDFs</Link>

                    {/* ARTES */}
                    <div className="sidebar-category-title">ARTES</div>
                    <Link href="/galeria" className="sidebar-button" onClick={() => setIsOpen(false)}>▢ Galeria</Link>
                </nav>

                {/* Footer User Info */}
                <div className="sidebar-footer">
                    <div className="user-info">
                        <div className="user-avatar">US</div>
                        <div className="user-details">
                            <div className="user-name">Membro Iniciado</div>
                            <div className="user-plan">Plano Astral Premium</div>
                        </div>
                    </div>
                    <button className="logout-button">Sair</button>
                </div>
            </aside>
        </>
    );
}
