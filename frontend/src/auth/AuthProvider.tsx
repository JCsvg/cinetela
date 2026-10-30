import { useEffect, useState, type ReactNode } from 'react'
import { buscarUsuarioLogado, cadastrar as cadastrarNaApi, fazerLogin, fazerLogout } from '../api/auth'
import { ErroApi, lerToken, salvarToken } from '../api/cliente'
import type { Usuario } from '../types/usuario'
import { AuthContext } from './useAuth'

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  // Só há o que verificar se ficou um token de uma visita anterior
  const [verificando, setVerificando] = useState(() => lerToken() !== null)

  useEffect(() => {
    if (lerToken() === null) {
      return
    }
    const controle = new AbortController()
    buscarUsuarioLogado(controle.signal)
      .then(setUsuario)
      .catch((erro: unknown) => {
        if (erro instanceof ErroApi && erro.status === 401) {
          salvarToken(null) // expirou ou foi apagado no servidor
        }
      })
      .finally(() => {
        if (!controle.signal.aborted) {
          setVerificando(false)
        }
      })
    return () => controle.abort()
  }, [])

  async function entrar(email: string, senha: string) {
    const resposta = await fazerLogin(email, senha)
    salvarToken(resposta.token)
    setUsuario(resposta.usuario)
  }

  async function cadastrar(nome: string, email: string, senha: string) {
    const resposta = await cadastrarNaApi(nome, email, senha)
    salvarToken(resposta.token)
    setUsuario(resposta.usuario)
  }

  async function sair() {
    try {
      await fazerLogout()
    } catch {
      // Se o servidor já não reconhece o token, o logout local basta
    } finally {
      salvarToken(null)
      setUsuario(null)
    }
  }

  return <AuthContext value={{ usuario, verificando, entrar, cadastrar, sair }}>{children}</AuthContext>
}
