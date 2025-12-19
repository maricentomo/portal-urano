import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password } = body;

  const senhaCorreta = 'portalurano123';

  if (!email || !password) {
    return NextResponse.json(
      { error: 'E-mail e senha são obrigatórios.' },
      { status: 400 }
    );
  }

  if (password !== senhaCorreta) {
    return NextResponse.json(
      { error: 'Credenciais inválidas.' },
      { status: 401 }
    );
  }

  const user = {
    id: 'demo-user-1',
    name: 'Membro Iniciado',
    email,
  };

  return NextResponse.json(
    {
      user,
      token: 'token-falso-por-enquanto',
    },
    { status: 200 }
  );
}
