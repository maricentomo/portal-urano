'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Sidebar() {
    return (
        <aside className="sidebar">
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
                <Link href="/mapa-astral" className="sidebar-button">☉ Mapa Astral</Link>
                <Link href="/revolucao-solar" className="sidebar-button">⊙ Revolução Solar</Link>
                <Link href="/sinastria" className="sidebar-button">♡ Sinastria</Link>
                <Link href="/vocacional" className="sidebar-button">⚙ Vocacional</Link>
                <Link href="/infantil" className="sidebar-button">○ Infantil</Link>
                <Link href="/transitos" className="sidebar-button">⊕ Trânsitos</Link>

                {/* MATRIZ DO DESTINO */}
                <div className="sidebar-category-title">MATRIZ DO DESTINO</div>
                <Link href="/matriz-pessoal" className="sidebar-button">◎ Matriz Pessoal</Link>
                <Link href="/matriz-compatibilidade" className="sidebar-button">⬡ Matriz Compatibilidade</Link>
                <Link href="/matriz-infantil" className="sidebar-button">○ Matriz Infantil</Link>

                {/* TUTORIAIS */}
                <div className="sidebar-category-title">TUTORIAIS</div>
                <Link href="/videos" className="sidebar-button">▷ Vídeos</Link>
                <Link href="/pdfs" className="sidebar-button">□ PDFs</Link>

                {/* ARTES */}
                <div className="sidebar-category-title">ARTES</div>
                <Link href="/galeria" className="sidebar-button">▢ Galeria</Link>
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
    );
}
