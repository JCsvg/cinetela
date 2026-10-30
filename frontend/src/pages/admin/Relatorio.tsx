import { buscarRelatorio } from '../../api/admin'
import Carregando from '../../components/Carregando'
import MensagemErro from '../../components/MensagemErro'
import { useApi } from '../../hooks/useApi'
import { cartao } from '../../utils/estilos'
import { formatarMoeda } from '../../utils/formatar'

export default function Relatorio() {
  const { estado } = useApi(buscarRelatorio)

  if (estado.tipo === 'carregando') return <Carregando />
  if (estado.tipo === 'erro') return <MensagemErro mensagem={estado.mensagem} />
  const r = estado.dados

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <div className={cartao}>
          <p className="text-sm text-zinc-400">Receita total</p>
          <p className="mt-1 text-2xl font-bold text-white">{formatarMoeda(r.receitaTotal)}</p>
        </div>
        <div className={cartao}>
          <p className="text-sm text-zinc-400">Pedidos pagos</p>
          <p className="mt-1 text-2xl font-bold text-white">{r.pedidos}</p>
        </div>
        <div className={cartao}>
          <p className="text-sm text-zinc-400">Ingressos vendidos</p>
          <p className="mt-1 text-2xl font-bold text-white">{r.ingressosVendidos}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className={cartao}>
          <h2 className="mb-3 font-semibold text-white">Receita por cinema</h2>
          <table className="w-full text-left text-sm">
            <tbody>
              {r.porCinema.map((c) => (
                <tr key={c.cinemaId} className="border-t border-zinc-800 first:border-0">
                  <td className="py-2 text-zinc-200">{c.cinema}</td>
                  <td className="text-zinc-500">{c.pedidos} pedidos</td>
                  <td className="text-right font-medium text-white">{formatarMoeda(c.receita)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className={cartao}>
          <h2 className="mb-3 font-semibold text-white">Filmes mais vendidos</h2>
          <ol className="flex flex-col gap-2 text-sm">
            {r.topFilmes.map((f, i) => (
              <li key={f.filme} className="flex justify-between border-t border-zinc-800 pt-2 first:border-0 first:pt-0">
                <span className="text-zinc-200">
                  {i + 1}. {f.filme}
                </span>
                <span className="text-zinc-400">{f.ingressos} ingressos</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section className={cartao}>
        <h2 className="mb-3 font-semibold text-white">Usuários por papel</h2>
        <ul className="flex flex-wrap gap-6 text-sm">
          {r.usuarios.map((u) => (
            <li key={u.papel}>
              <span className="text-zinc-400">{u.papel}: </span>
              <strong className="text-white">{u.total}</strong>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
