import { useCallback } from 'react'
import { useParams } from 'react-router'
import { buscarVendas } from '../../api/gerencia'
import Carregando from '../../components/Carregando'
import MensagemErro from '../../components/MensagemErro'
import { useApi } from '../../hooks/useApi'
import { cartao } from '../../utils/estilos'
import { formatarMoeda } from '../../utils/formatar'

function Numero({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className={cartao}>
      <p className="text-sm text-zinc-400">{rotulo}</p>
      <p className="mt-1 text-2xl font-bold text-white">{valor}</p>
    </div>
  )
}

export default function Vendas() {
  const cinemaId = Number(useParams().cinemaId)
  const buscar = useCallback((sinal: AbortSignal) => buscarVendas(cinemaId, sinal), [cinemaId])
  const { estado } = useApi(buscar)

  if (estado.tipo === 'carregando') return <Carregando />
  if (estado.tipo === 'erro') return <MensagemErro mensagem={estado.mensagem} />
  const v = estado.dados
  const maiorReceita = Math.max(1, ...v.porFilme.map((f) => f.receita))

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Numero rotulo="Receita total" valor={formatarMoeda(v.receitaTotal)} />
        <Numero rotulo="Ingressos vendidos" valor={String(v.ingressosVendidos)} />
        <Numero rotulo="Receita de ingressos" valor={formatarMoeda(v.receitaIngressos)} />
        <Numero rotulo="Receita da lanchonete" valor={formatarMoeda(v.receitaLanchonete)} />
      </div>

      <section className={cartao}>
        <h2 className="mb-4 font-semibold text-white">Receita de ingressos por filme</h2>
        {v.porFilme.length === 0 ? (
          <p className="text-zinc-500">Ainda não há vendas.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {v.porFilme.map((f) => (
              <li key={f.filme}>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-200">{f.filme}</span>
                  <span className="text-zinc-400">
                    {f.ingressos} ingressos · {formatarMoeda(f.receita)}
                  </span>
                </div>
                <div className="mt-1 h-2 rounded bg-zinc-800">
                  <div className="h-2 rounded bg-marca-600" style={{ width: `${(f.receita / maiorReceita) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={cartao}>
        <h2 className="mb-3 font-semibold text-white">Pedidos por dia (últimos 7 com venda)</h2>
        {v.porDia.length === 0 ? (
          <p className="text-zinc-500">Ainda não há vendas.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-zinc-500">
              <tr>
                <th className="py-1 font-medium">Dia</th>
                <th className="py-1 font-medium">Pedidos</th>
                <th className="py-1 text-right font-medium">Receita</th>
              </tr>
            </thead>
            <tbody>
              {v.porDia.map((d) => (
                <tr key={d.dia} className="border-t border-zinc-800">
                  <td className="py-2">{d.dia.split('-').reverse().join('/')}</td>
                  <td>{d.pedidos}</td>
                  <td className="text-right">{formatarMoeda(d.receita)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
