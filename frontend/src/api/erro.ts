import type { CorpoErro } from '../types/api'

/** Erro de resposta da API, com o status e, no 422, a mensagem de cada campo. */
export class ErroApi extends Error {
  readonly status: number
  readonly campos: Record<string, string>

  constructor(status: number, corpo: CorpoErro) {
    super(corpo.erro)
    this.name = 'ErroApi'
    this.status = status
    this.campos = corpo.campos ?? {}
  }
}
