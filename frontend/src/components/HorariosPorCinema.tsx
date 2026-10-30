import { Link } from 'react-router'
import type { GrupoDeHorarios } from '../types/exibicao'
import { cartao } from '../utils/estilos'
import { formatarHora, formatarMoeda } from '../utils/formatar'
import { urlImagem } from '../utils/imagem'

type Props = {
  grupos: GrupoDeHorarios[]
}

/** Os horários de um filme, um bloco por cinema. Cada horário leva à escolha de assentos. */
export default function HorariosPorCinema({ grupos }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {grupos.map(({ cinema, exibicoes }) => (
        <section key={cinema.id} className={`${cartao} flex flex-col gap-4 sm:flex-row`}>
          <img src={urlImagem(cinema.imagem)} alt={`Foto do ${cinema.nome}`} loading="lazy" className="h-32 w-full rounded-lg object-cover sm:w-52" />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white">{cinema.nome}</h3>
            <p className="text-sm text-zinc-400">
              {cinema.endereco}, {cinema.cidade}
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {exibicoes.map((e) => {
                const esgotada = e.assentosLivres === 0
                return (
                  <li key={e.id}>
                    <Link
                      to={`/sessoes/${e.id}/assentos`}
                      aria-disabled={esgotada}
                      className={`flex flex-col items-center rounded-lg border px-3 py-1.5 text-center transition ${
                        esgotada
                          ? 'pointer-events-none border-zinc-800 text-zinc-600'
                          : 'border-zinc-600 text-white hover:border-marca-500 hover:bg-marca-600/20'
                      }`}
                    >
                      <span className="text-lg leading-tight font-bold">{formatarHora(e.iniciaEm)}</span>
                      <span className="text-[11px] text-zinc-400">
                        {e.sala} · {e.formato} · {e.idioma}
                      </span>
                      <span className="text-[11px] text-zinc-500">
                        {esgotada
                          ? 'Esgotada'
                          : e.assentosLivres < 10
                            ? `Só ${e.assentosLivres} lugares`
                            : formatarMoeda(e.precoInteira)}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </section>
      ))}
    </div>
  )
}
