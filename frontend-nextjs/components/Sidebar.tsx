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
          <div className="sidebar-category-title sidebar-category-title--accent">O QUE VOCÊ VERÁ POR AQUI</div>

          <Link href="/mapa-astral" className="sidebar-button" onClick={() => setIsOpen(false)}>
            ☉ Mapa Astral
          </Link>

          <span className="sidebar-button sidebar-button--disabled" aria-disabled="true">⊕ Trânsitos (em breve)</span>
          <span className="sidebar-button sidebar-button--disabled" aria-disabled="true">⊙ Revolução Solar (em breve)</span>
          <span className="sidebar-button sidebar-button--disabled" aria-disabled="true">♡ Sinastria (em breve)</span>
          <span className="sidebar-button sidebar-button--disabled" aria-disabled="true">⚙ Vocacional (em breve)</span>
          <span className="sidebar-button sidebar-button--disabled" aria-disabled="true">○ Infantil (em breve)</span>

          {/* MATRIZ DO DESTINO */}
          <div className="sidebar-category-title">MATRIZ DO DESTINO</div>
          <span className="sidebar-button sidebar-button--disabled" aria-disabled="true">◎ Matriz Pessoal (em breve)</span>
          <span className="sidebar-button sidebar-button--disabled" aria-disabled="true">⬡ Matriz Compatibilidade (em breve)</span>
          <span className="sidebar-button sidebar-button--disabled" aria-disabled="true">○ Matriz Infantil (em breve)</span>

          {/* TUTORIAIS */}
          <div className="sidebar-category-title">TUTORIAIS</div>
          <span className="sidebar-button sidebar-button--disabled" aria-disabled="true">▷ Vídeos (em breve)</span>
          <span className="sidebar-button sidebar-button--disabled" aria-disabled="true">□ PDFs (em breve)</span>

          {/* ARTES */}
          <div className="sidebar-category-title">ARTES</div>
          <span className="sidebar-button sidebar-button--disabled" aria-disabled="true">▢ Galeria (em breve)</span>
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
