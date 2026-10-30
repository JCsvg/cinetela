export type TipoIngresso = 'inteira' | 'meia'

export type Assento = {
  fileira: string
  numero: number
}

export type IngressoEscolhido = Assento & { tipo: TipoIngresso }

export type ItemEscolhido = {
  produtoId: number
  quantidade: number
}

export type DadosPagamento = {
  titular: string
  numero: string
  /** MM/AA */
  validade: string
  cvv: string
}

/** O corpo do POST /api/pedidos. O preço nunca vai: o back calcula. */
export type NovoPedido = {
  exibicaoId: number
  ingressos: IngressoEscolhido[]
  itens: ItemEscolhido[]
  pagamento: DadosPagamento
}

export type Pedido = {
  id: number
  exibicaoId: number
  filme: { titulo: string; poster: string }
  cinema: string
  sala: string
  iniciaEm: string
  total: number
  status: 'pago' | 'cancelado'
  criadoEm: string
  ingressos: (IngressoEscolhido & { preco: number })[]
  itens: { produtoId: number; nome: string; quantidade: number; precoUnit: number }[]
  podeCancelar: boolean
}

export type Vendas = {
  pedidos: number
  receitaTotal: number
  receitaIngressos: number
  receitaLanchonete: number
  ingressosVendidos: number
  porFilme: { filme: string; ingressos: number; receita: number }[]
  porDia: { dia: string; pedidos: number; receita: number }[]
}

export type Relatorio = {
  pedidos: number
  receitaTotal: number
  ingressosVendidos: number
  porCinema: { cinemaId: number; cinema: string; pedidos: number; receita: number }[]
  topFilmes: { filme: string; ingressos: number }[]
  usuarios: { papel: string; total: number }[]
}
