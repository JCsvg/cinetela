import type { Exibicao } from '../types/exibicao'
import type { Assento, IngressoEscolhido, TipoIngresso } from '../types/pedido'
import type { Produto } from '../types/produto'

/** O que o cliente já escolheu até agora, passo a passo, antes de pagar. */
export type Compra = {
  exibicao: Exibicao | null
  ingressos: IngressoEscolhido[]
  itens: { produto: Produto; quantidade: number }[]
}

export type Acao =
  | { tipo: 'alternarAssento'; exibicao: Exibicao; assento: Assento }
  | { tipo: 'mudarTipo'; assento: Assento; tipoIngresso: TipoIngresso }
  | { tipo: 'alterarItem'; produto: Produto; delta: number }
  | { tipo: 'limpar' }

export const MAX_INGRESSOS = 8
export const MAX_POR_ITEM = 10

export const compraVazia: Compra = { exibicao: null, ingressos: [], itens: [] }

const mesmoAssento = (a: Assento, b: Assento) => a.fileira === b.fileira && a.numero === b.numero

export function compraReducer(compra: Compra, acao: Acao): Compra {
  switch (acao.tipo) {
    case 'alternarAssento': {
      // Escolher assento em OUTRA exibição recomeça a compra; na mesma, continua
      const base: Compra =
        compra.exibicao?.id === acao.exibicao.id ? compra : { exibicao: acao.exibicao, ingressos: [], itens: [] }
      const jaEscolhido = base.ingressos.some((i) => mesmoAssento(i, acao.assento))
      if (jaEscolhido) {
        return { ...base, ingressos: base.ingressos.filter((i) => !mesmoAssento(i, acao.assento)) }
      }
      if (base.ingressos.length >= MAX_INGRESSOS) {
        return base
      }
      return { ...base, ingressos: [...base.ingressos, { ...acao.assento, tipo: 'inteira' }] }
    }

    case 'mudarTipo':
      return {
        ...compra,
        ingressos: compra.ingressos.map((i) =>
          mesmoAssento(i, acao.assento) ? { ...i, tipo: acao.tipoIngresso } : i,
        ),
      }

    case 'alterarItem': {
      const atual = compra.itens.find((i) => i.produto.id === acao.produto.id)
      const quantidade = Math.min(MAX_POR_ITEM, Math.max(0, (atual?.quantidade ?? 0) + acao.delta))
      const semEste = compra.itens.filter((i) => i.produto.id !== acao.produto.id)
      return { ...compra, itens: quantidade === 0 ? semEste : [...semEste, { produto: acao.produto, quantidade }] }
    }

    case 'limpar':
      return compraVazia
  }
}

export function totalIngressos(compra: Compra): number {
  const e = compra.exibicao
  if (e === null) return 0
  return compra.ingressos.reduce((soma, i) => soma + (i.tipo === 'meia' ? e.precoMeia : e.precoInteira), 0)
}

export function totalLanchonete(compra: Compra): number {
  return compra.itens.reduce((soma, i) => soma + i.produto.preco * i.quantidade, 0)
}

export function totalGeral(compra: Compra): number {
  return totalIngressos(compra) + totalLanchonete(compra)
}

/** "D5" para o assento D, número 5. */
export function codigoDoAssento(a: Assento): string {
  return `${a.fileira}${a.numero}`
}
