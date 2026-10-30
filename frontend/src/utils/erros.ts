import { ErroApi, mensagemDe } from '../api/cliente'

/**
 * Separa o erro de uma chamada em: mensagens por campo (o 422 do back) e um
 * aviso geral (qualquer outro erro, como 409 ou rede fora).
 */
export function separarErros(erro: unknown): { campos: Record<string, string>; geral: string | null } {
  if (erro instanceof ErroApi && erro.status === 422) {
    return { campos: erro.campos, geral: null }
  }
  return { campos: {}, geral: mensagemDe(erro) }
}
