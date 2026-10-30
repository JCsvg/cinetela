import { createContext, useContext } from 'react'
import type { Papel, Usuario } from '../types/usuario'

export type ValorAuth = {
  usuario: Usuario | null
  /** true enquanto confere, ao abrir a página, se o token salvo ainda vale */
  verificando: boolean
  entrar: (email: string, senha: string) => Promise<void>
  cadastrar: (nome: string, email: string, senha: string) => Promise<void>
  sair: () => Promise<void>
}

// Fica aqui, e não no AuthProvider.tsx, porque o Fast Refresh do Vite
// só funciona em arquivo que exporta apenas componentes.
export const AuthContext = createContext<ValorAuth | null>(null)

export function useAuth(): ValorAuth {
  const valor = useContext(AuthContext)
  if (valor === null) {
    throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  }
  return valor
}

/** Para onde cada papel vai depois de entrar. */
export function inicioDoPapel(papel: Papel, cinemaId: number | null): string {
  if (papel === 'admin') return '/admin'
  if (papel === 'cinema' && cinemaId !== null) return `/gerencia/${cinemaId}`
  return '/'
}
