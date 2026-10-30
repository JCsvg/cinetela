import { codigoDoAssento, totalGeral, totalIngressos, totalLanchonete, type Compra } from '../compra/reducer'
import { cartao } from '../utils/estilos'
import { formatarDia, formatarHora, formatarMoeda } from '../utils/formatar'
import { urlImagem } from '../utils/imagem'

type Props = {
  compra: Compra
  /** Conteúdo extra no rodapé do resumo (botão de continuar, por exemplo) */
  children?: React.ReactNode
}

/** Resumo fixo ao lado das etapas da compra: sessão, assentos, lanchonete e total. */
export default function ResumoDaCompra({ compra, children }: Props) {
  const e = compra.exibicao
  if (e === null) {
    return null
  }

  return (
    <aside className={`${cartao} flex flex-col gap-4 lg:sticky lg:top-24`} aria-label="Resumo da compra">
      <div className="flex gap-3">
        <img src={urlImagem(e.filme.poster)} alt="" className="h-24 w-16 rounded object-cover" />
        <div className="min-w-0">
          <h2 className="font-bold text-white">{e.filme.titulo}</h2>
          <p className="text-sm text-zinc-400">{e.cinema.nome}</p>
          <p className="text-sm text-zinc-400">
            {e.sala.nome} · {e.formato} · {e.idioma}
          </p>
          <p className="text-sm text-zinc-300">
            {formatarDia(e.iniciaEm)}, {formatarHora(e.iniciaEm)}
          </p>
        </div>
      </div>

      <div className="border-t border-zinc-800 pt-3 text-sm">
        <h3 className="mb-1 font-medium text-zinc-300">Ingressos</h3>
        {compra.ingressos.length === 0 ? (
          <p className="text-zinc-500">Nenhum assento escolhido.</p>
        ) : (
          <ul className="space-y-1">
            {compra.ingressos.map((i) => (
              <li key={codigoDoAssento(i)} className="flex justify-between text-zinc-300">
                <span>
                  Assento {codigoDoAssento(i)} ({i.tipo})
                </span>
                <span>{formatarMoeda(i.tipo === 'meia' ? e.precoMeia : e.precoInteira)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {compra.itens.length > 0 && (
        <div className="border-t border-zinc-800 pt-3 text-sm">
          <h3 className="mb-1 font-medium text-zinc-300">Lanchonete</h3>
          <ul className="space-y-1">
            {compra.itens.map((i) => (
              <li key={i.produto.id} className="flex justify-between text-zinc-300">
                <span>
                  {i.quantidade}x {i.produto.nome}
                </span>
                <span>{formatarMoeda(i.produto.preco * i.quantidade)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="border-t border-zinc-800 pt-3">
        <dl className="space-y-1 text-sm text-zinc-400">
          <div className="flex justify-between">
            <dt>Ingressos</dt>
            <dd>{formatarMoeda(totalIngressos(compra))}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Lanchonete</dt>
            <dd>{formatarMoeda(totalLanchonete(compra))}</dd>
          </div>
          <div className="flex justify-between pt-1 text-lg font-bold text-white">
            <dt>Total</dt>
            <dd>{formatarMoeda(totalGeral(compra))}</dd>
          </div>
        </dl>
      </div>
      {children}
    </aside>
  )
}
