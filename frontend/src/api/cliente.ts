import { MODO_DEMO, responderDemo } from '../demo/api'
import type { CorpoErro } from '../types/api'
import { ErroApi } from './erro'

export { ErroApi }

const CHAVE_TOKEN = 'cine.token'

// Em desenvolvimento a API está no mesmo endereço (o proxy do Vite repassa /api). Hospedada
// separada, a URL dela vem de VITE_API_URL no build.
const API = import.meta.env.VITE_API_URL ?? ''

export function lerToken(): string | null {
  return localStorage.getItem(CHAVE_TOKEN)
}

/** Guarda o token do login; null apaga (logout ou sessão expirada). */
export function salvarToken(token: string | null): void {
  if (token === null) {
    localStorage.removeItem(CHAVE_TOKEN)
  } else {
    localStorage.setItem(CHAVE_TOKEN, token)
  }
}

type Opcoes = {
  metodo?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  corpo?: unknown
  sinal?: AbortSignal
}

function ehCorpoErro(valor: unknown): valor is CorpoErro {
  return typeof valor === 'object' && valor !== null && 'erro' in valor && typeof valor.erro === 'string'
}

/**
 * fetch com JSON, token e erro tipado. Toda chamada da API passa por aqui, nenhum componente chama fetch direto.
 * Resolve com o corpo já convertido para T; rejeita com ErroApi se o status não for 2xx.
 */
export async function requisitar<T>(caminho: string, { metodo = 'GET', corpo, sinal }: Opcoes = {}): Promise<T> {
  // Demonstração (GitHub Pages): não há API, as respostas saem de dados fixos
  if (MODO_DEMO) {
    return responderDemo<T>(caminho, metodo)
  }

  const cabecalhos: Record<string, string> = { Accept: 'application/json' }
  if (corpo !== undefined) {
    cabecalhos['Content-Type'] = 'application/json'
  }
  const token = lerToken()
  if (token !== null) {
    cabecalhos.Authorization = `Bearer ${token}`
  }

  const resposta = await fetch(API + caminho, {
    method: metodo,
    headers: cabecalhos,
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
    signal: sinal,
  })

  if (resposta.status === 204) {
    return undefined as T
  }

  const dados: unknown = await resposta.json().catch(() => null)
  if (!resposta.ok) {
    throw new ErroApi(resposta.status, ehCorpoErro(dados) ? dados : { erro: `Erro HTTP ${resposta.status}` })
  }
  return dados as T
}

/** Texto para mostrar na tela, venha o erro de onde vier. */
export function mensagemDe(erro: unknown): string {
  return erro instanceof Error ? erro.message : 'Algo deu errado'
}

/** Monta "?a=1&b=2" só com os valores preenchidos; sem nenhum, devolve "". */
export function montarQuery(filtro: Record<string, string | number | boolean | undefined>): string {
  const params = new URLSearchParams()
  for (const [chave, valor] of Object.entries(filtro)) {
    if (valor !== undefined && valor !== '' && valor !== false) {
      params.set(chave, String(valor))
    }
  }
  const texto = params.toString()
  return texto === '' ? '' : `?${texto}`
}
