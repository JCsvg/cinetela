import type { Pedido } from '../types/pedido'
import { formatarDia, formatarHora, formatarMoeda } from '../utils/formatar'
import { urlImagem } from '../utils/imagem'

type Props = {
  pedido: Pedido
}

/** O ingresso como um cartão: filme, cinema, sala, horário e assentos. */
export default function IngressoVirtual({ pedido }: Props) {
  const cancelado = pedido.status === 'cancelado'
  const codigo = `CINE-${String(pedido.id).padStart(6, '0')}`

  return (
    <article
      className={`flex overflow-hidden rounded-2xl border bg-zinc-900 ${cancelado ? 'border-zinc-800 opacity-60' : 'border-zinc-700'}`}
    >
      <img src={urlImagem(pedido.filme.poster)} alt="" className="hidden w-32 object-cover sm:block" />
      <div className="flex-1 p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-xl font-bold text-white">{pedido.filme.titulo}</h3>
            <p className="text-sm text-zinc-400">
              {pedido.cinema} · {pedido.sala}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${cancelado ? 'bg-zinc-800 text-zinc-400' : 'bg-emerald-900 text-emerald-300'}`}
          >
            {cancelado ? 'Cancelado' : 'Pago'}
          </span>
        </div>

        <p className="mt-3 text-lg font-semibold text-ouro">
          {formatarDia(pedido.iniciaEm)}, {formatarHora(pedido.iniciaEm)}
        </p>

        <ul className="mt-3 flex flex-wrap gap-2">
          {pedido.ingressos.map((i) => (
            <li key={`${i.fileira}${i.numero}`} className="rounded border border-zinc-700 px-2.5 py-1 text-sm">
              <strong>
                {i.fileira}
                {i.numero}
              </strong>{' '}
              <span className="text-zinc-400">{i.tipo}</span>
            </li>
          ))}
        </ul>

        {pedido.itens.length > 0 && (
          <p className="mt-3 text-sm text-zinc-400">
            Lanchonete: {pedido.itens.map((i) => `${i.quantidade}x ${i.nome}`).join(', ')}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-end justify-between gap-2 border-t border-dashed border-zinc-700 pt-3">
          <p className="font-mono text-sm tracking-widest text-zinc-300">{codigo}</p>
          <p className="text-lg font-bold text-white">{formatarMoeda(pedido.total)}</p>
        </div>
      </div>
    </article>
  )
}
