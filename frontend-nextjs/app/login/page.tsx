'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg(null);

    if (!email || !password) {
      setErrorMsg('Preencha e-mail e senha.');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.error || 'Erro ao fazer login.');
        return;
      }

      // Guardar usuário de forma provisória no localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('portalurano_user', JSON.stringify(data.user));
        localStorage.setItem('portalurano_token', data.token);
      }

      // Redirecionar para a home depois do login
      router.push('/');
    } catch (err) {
      console.error(err);
      setErrorMsg('Não foi possível conectar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <h1>Entrar no Portal Urano</h1>

        <p className="login-subtitle">
          Use seu e-mail e senha para acessar seus relatórios astrológicos.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              placeholder="voce@exemplo.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              placeholder="Digite sua senha"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {errorMsg && (
            <p className="login-error">
              {errorMsg}
            </p>
          )}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="login-small-text">
          Ainda não tem conta? Em breve você poderá criar a sua aqui.
        </p>
      </div>
    </div>
  );
}
