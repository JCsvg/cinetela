import type { Produto } from '../types/produto'
import { formatarMoeda } from '../utils/formatar'
import { urlImagem } from '../utils/imagem'

type Props = {
  produto: Produto
  quantidade: number
  /** +1 ou -1 */
  aoAlterar: (delta: number) => void
}

export default function CardProduto({ produto, quantidade, aoAlterar }: Props) {
  return (
    <article className="flex gap-3 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/70">
      <img src={urlImagem(produto.imagem)} alt={produto.nome} loading="lazy" className="size-28 shrink-0 object-cover" />
      <div className="flex min-w-0 flex-1 flex-col justify-between py-3 pr-3">
        <div>
          <h3 className="font-semibold text-white">{produto.nome}</h3>
          <p className="text-sm text-zinc-400">{produto.descricao}</p>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-bold text-ouro">{formatarMoeda(produto.preco)}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={`Tirar um ${produto.nome}`}
              disabled={quantidade === 0}
              onClick={() => aoAlterar(-1)}
              className="size-8 rounded-full border border-zinc-700 text-lg leading-none text-zinc-200 transition hover:bg-zinc-800 disabled:opacity-30"
            >
              −
            </button>
            <span className="w-5 text-center font-medium tabular-nums" aria-live="polite">
              {quantidade}
            </span>
            <button
              type="button"
              aria-label={`Acrescentar um ${produto.nome}`}
              onClick={() => aoAlterar(1)}
              className="size-8 rounded-full bg-marca-600 text-lg leading-none text-white transition hover:bg-marca-500"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
