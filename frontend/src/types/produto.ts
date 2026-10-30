export type Categoria = 'pipoca' | 'bebida' | 'lanche' | 'doce' | 'combo'

export const CATEGORIAS: readonly Categoria[] = ['pipoca', 'bebida', 'lanche', 'doce', 'combo']

export type Produto = {
  id: number
  cinemaId: number
  nome: string
  descricao: string
  categoria: Categoria
  preco: number
  imagem: string
  ativo: boolean
}

export type DadosProduto = Omit<Produto, 'id' | 'cinemaId'>
