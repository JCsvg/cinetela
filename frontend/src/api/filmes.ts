import type { Pagina } from '../types/api'
import type { Cinema } from '../types/cinema'
import type { GrupoDeHorarios } from '../types/exibicao'
import type { Filme } from '../types/filme'
import { montarQuery, requisitar } from './cliente'

export type FiltroFilmes = {
  genero?: string
  busca?: string
  emCartaz?: boolean
  pagina?: number
  porPagina?: number
}

export function listarFilmes(filtro: FiltroFilmes = {}, sinal?: AbortSignal): Promise<Pagina<Filme>> {
  return requisitar<Pagina<Filme>>(`/api/filmes${montarQuery(filtro)}`, { sinal })
}

export function buscarFilme(id: number, sinal?: AbortSignal): Promise<Filme> {
  return requisitar<Filme>(`/api/filmes/${id}`, { sinal })
}

export function listarGeneros(sinal?: AbortSignal): Promise<string[]> {
  return requisitar<string[]>('/api/generos', { sinal })
}

export function listarHorarios(
  filmeId: number,
  filtro: { cidade?: string; data?: string } = {},
  sinal?: AbortSignal,
): Promise<GrupoDeHorarios[]> {
  return requisitar<GrupoDeHorarios[]>(`/api/filmes/${filmeId}/exibicoes${montarQuery(filtro)}`, { sinal })
}

export function listarCidades(sinal?: AbortSignal): Promise<string[]> {
  return requisitar<string[]>('/api/cidades', { sinal })
}

export function listarCinemas(sinal?: AbortSignal): Promise<Cinema[]> {
  return requisitar<Cinema[]>('/api/cinemas', { sinal })
}
