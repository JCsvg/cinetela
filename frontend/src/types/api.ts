/** Envelope das listagens paginadas: GET /api/filmes */
export type Pagina<T> = {
  dados: T[]
  pagina: number
  porPagina: number
  total: number
  totalPaginas: number
}

/** Corpo de toda resposta de erro da API. `campos` só vem no 422. */
export type CorpoErro = {
  erro: string
  campos?: Record<string, string>
}
