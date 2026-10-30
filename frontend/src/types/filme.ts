/** Um filme, igual ao JSON da API. O tipo escrito uma vez faz o editor completar os campos em todo lugar. */
export type Filme = {
  id: number
  titulo: string
  sinopse: string
  genero: string
  duracaoMin: number
  classificacao: string
  /** Data "2026-11-02", sem hora */
  estreia: string
  poster: string
  fundo: string
  /** true se existe alguma exibição futura */
  emCartaz: boolean
}

/** O que o formulário do administrador envia (Etapa 14): o Filme sem id e sem emCartaz. */
export type DadosFilme = Omit<Filme, 'id' | 'emCartaz'>
