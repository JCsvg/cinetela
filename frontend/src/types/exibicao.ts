import type { Cinema } from './cinema'

export type Idioma = 'Dublado' | 'Legendado'
export type Formato = '2D' | '3D'

/** Uma sessão de cinema completa, como vem de /api/exibicoes/{id}/assentos. */
export type Exibicao = {
  id: number
  filme: { id: number; titulo: string; poster: string; duracaoMin: number; classificacao: string }
  cinema: { id: number; nome: string; cidade: string }
  sala: { id: number; nome: string; fileiras: number; assentosPorFileira: number }
  iniciaEm: string
  precoInteira: number
  precoMeia: number
  idioma: Idioma
  formato: Formato
  assentosLivres: number
}

/** Versão curta, usada na lista de horários de um filme. */
export type HorarioDoFilme = {
  id: number
  iniciaEm: string
  sala: string
  idioma: Idioma
  formato: Formato
  precoInteira: number
  assentosLivres: number
}

export type GrupoDeHorarios = {
  cinema: Cinema
  exibicoes: HorarioDoFilme[]
}

export type MapaDeAssentos = {
  exibicao: Exibicao
  /** Letras das fileiras: ['A', 'B', ...] */
  fileiras: string[]
  /** Assentos já vendidos, como "D5" */
  ocupados: string[]
}

/** O que o painel do cinema envia ao criar ou editar uma exibição. */
export type DadosExibicao = {
  filmeId: number
  salaId: number
  /** "2026-10-30T19:00", horário de Brasília */
  iniciaEm: string
  precoInteira: number
  idioma: Idioma
  formato: Formato
}
