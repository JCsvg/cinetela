import { useState, type SubmitEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router'
import { mensagemDe } from '../api/cliente'
import { inicioDoPapel, useAuth } from '../auth/useAuth'
import Campo from '../components/Campo'
import MensagemErro from '../components/MensagemErro'
import { MODO_DEMO } from '../demo/api'
import { botao, botaoSecundario, cartao, entrada } from '../utils/estilos'

const CONTAS = [
  { rotulo: 'Cliente', email: 'cliente@cine.dev' },
  { rotulo: 'Gerente do Cine Aurora', email: 'gerente@cine.dev' },
  { rotulo: 'Administrador', email: 'admin@cine.dev' },
]

export default function Login() {
  const { usuario, entrar } = useAuth()
  const local = useLocation()
  // A RotaProtegida guarda aqui a página que pediu o login
  const voltarPara = (local.state as { voltarPara?: string } | null)?.voltarPara

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  // Já logado (ou acabou de entrar): segue para onde ia, ou para o início do papel
  if (usuario !== null) {
    return <Navigate to={voltarPara ?? inicioDoPapel(usuario.papel, usuario.cinemaId)} replace />
  }

  async function enviar(evento: SubmitEvent<HTMLFormElement>) {
    evento.preventDefault()
    setEnviando(true)
    setErro(null)
    try {
      await entrar(email, senha)
    } catch (e) {
      setErro(mensagemDe(e))
      setEnviando(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <h1 className="text-3xl font-bold text-white">Entrar</h1>

      <form onSubmit={enviar} className={`${cartao} flex flex-col gap-4`}>
        {erro !== null && <MensagemErro mensagem={erro} />}
        <Campo id="email" rotulo="E-mail">
          <input id="email" type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className={entrada} />
        </Campo>
        <Campo id="senha" rotulo="Senha">
          <input id="senha" type="password" required autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} className={entrada} />
        </Campo>
        <button type="submit" disabled={enviando} className={botao}>
          {enviando ? 'Entrando...' : 'Entrar'}
        </button>
        <p className="text-center text-sm text-zinc-400">
          Ainda não tem conta?{' '}
          <Link to="/cadastro" state={local.state} className="text-marca-400 hover:underline">
            Criar conta
          </Link>
        </p>
      </form>

      {!MODO_DEMO && (
        <div className="rounded-xl border border-dashed border-zinc-700 p-4">
          <p className="mb-2 text-sm text-zinc-400">Contas de teste (senha senha123). Clique para preencher:</p>
          <div className="flex flex-wrap gap-2">
            {CONTAS.map((c) => (
              <button
                key={c.email}
                type="button"
                onClick={() => {
                  setEmail(c.email)
                  setSenha('senha123')
                }}
                className={botaoSecundario}
              >
                {c.rotulo}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
