import type { Cinema, DadosCinema } from '../types/cinema'
import type { DadosFilme, Filme } from '../types/filme'
import type { Relatorio } from '../types/pedido'
import type { Papel, Usuario } from '../types/usuario'
import { requisitar } from './cliente'

export function criarFilme(dados: DadosFilme): Promise<Filme> {
  return requisitar<Filme>('/api/admin/filmes', { metodo: 'POST', corpo: dados })
}
export function atualizarFilme(id: number, dados: DadosFilme): Promise<Filme> {
  return requisitar<Filme>(`/api/admin/filmes/${id}`, { metodo: 'PUT', corpo: dados })
}
export function apagarFilme(id: number): Promise<void> {
  return requisitar<void>(`/api/admin/filmes/${id}`, { metodo: 'DELETE' })
}

export function criarCinema(dados: DadosCinema): Promise<Cinema> {
  return requisitar<Cinema>('/api/admin/cinemas', { metodo: 'POST', corpo: dados })
}
export function atualizarCinema(id: number, dados: DadosCinema): Promise<Cinema> {
  return requisitar<Cinema>(`/api/admin/cinemas/${id}`, { metodo: 'PUT', corpo: dados })
}
export function apagarCinema(id: number): Promise<void> {
  return requisitar<void>(`/api/admin/cinemas/${id}`, { metodo: 'DELETE' })
}

export function listarUsuarios(sinal?: AbortSignal): Promise<Usuario[]> {
  return requisitar<Usuario[]>('/api/admin/usuarios', { sinal })
}
export function mudarPapel(id: number, papel: Papel, cinemaId: number | null): Promise<Usuario> {
  return requisitar<Usuario>(`/api/admin/usuarios/${id}`, { metodo: 'PUT', corpo: { papel, cinemaId } })
}

export function buscarRelatorio(sinal?: AbortSignal): Promise<Relatorio> {
  return requisitar<Relatorio>('/api/admin/relatorio', { sinal })
}
