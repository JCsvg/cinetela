import type { Usuario } from '../types/usuario'
import { requisitar } from './cliente'

export type RespostaLogin = {
  token: string
  usuario: Usuario
}

export function fazerLogin(email: string, senha: string): Promise<RespostaLogin> {
  return requisitar<RespostaLogin>('/api/auth/login', { metodo: 'POST', corpo: { email, senha } })
}

export function cadastrar(nome: string, email: string, senha: string): Promise<RespostaLogin> {
  return requisitar<RespostaLogin>('/api/auth/cadastro', { metodo: 'POST', corpo: { nome, email, senha } })
}

export function buscarUsuarioLogado(sinal?: AbortSignal): Promise<Usuario> {
  return requisitar<Usuario>('/api/auth/eu', { sinal })
}

export function fazerLogout(): Promise<void> {
  return requisitar<void>('/api/auth/logout', { metodo: 'POST' })
}
