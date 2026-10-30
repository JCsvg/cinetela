import { Link } from 'react-router'
import type { Filme } from '../types/filme'
import { formatarDuracao } from '../utils/formatar'
import ClassificacaoBadge from './ClassificacaoBadge'
import { urlImagem } from '../utils/imagem'

type Props = {
  filme: Filme
}

export default function FilmeCard({ filme }: Props) {
  return (
    <Link
      to={`/filmes/${filme.id}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 transition hover:-translate-y-1 hover:border-zinc-600 hover:shadow-xl hover:shadow-black/50"
    >
      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          src={urlImagem(filme.poster)}
          alt={`Cena do filme ${filme.titulo}`}
          loading="lazy"
          className="size-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3 pt-12">
          <h2 className="text-lg leading-tight font-bold text-white drop-shadow">{filme.titulo}</h2>
        </div>
        <div className="absolute top-2 left-2">
          <ClassificacaoBadge valor={filme.classificacao} />
        </div>
        {!filme.emCartaz && (
          <span className="absolute top-2 right-2 rounded bg-ouro px-2 py-0.5 text-xs font-bold text-zinc-900">
            Em breve
          </span>
        )}
      </div>
      <p className="px-3 py-2.5 text-sm text-zinc-400">
        {filme.genero} · {formatarDuracao(filme.duracaoMin)}
      </p>
    </Link>
  )
}
