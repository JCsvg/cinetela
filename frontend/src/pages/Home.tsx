import { useCallback } from 'react'
import { Link, useSearchParams } from 'react-router'
import { listarFilmes, listarGeneros } from '../api/filmes'
import CampoBusca from '../components/CampoBusca'
import Carregando from '../components/Carregando'
import ClassificacaoBadge from '../components/ClassificacaoBadge'
import FilmeCard from '../components/FilmeCard'
import MensagemErro from '../components/MensagemErro'
import Paginacao from '../components/Paginacao'
import { useApi } from '../hooks/useApi'
import { botao } from '../utils/estilos'
import { formatarDuracao } from '../utils/formatar'
import { urlImagem } from '../utils/imagem'

export default function Home() {
  // O filtro mora na URL (?busca=&genero=&pagina=&todos=1): recarregar ou compartilhar o link mantém tudo
  const [params, setParams] = useSearchParams()
  const busca = params.get('busca') ?? ''
  const genero = params.get('genero') ?? ''
  const pagina = Number(params.get('pagina')) || 1
  const todos = params.get('todos') === '1'
  const semFiltro = busca === '' && genero === '' && pagina === 1

  const buscarFilmes = useCallback(
    (sinal: AbortSignal) => listarFilmes({ busca, genero, pagina, emCartaz: !todos }, sinal),
    [busca, genero, pagina, todos],
  )
  const buscarDestaque = useCallback((sinal: AbortSignal) => listarFilmes({ emCartaz: true, porPagina: 1 }, sinal), [])
  const buscarGeneros = useCallback((sinal: AbortSignal) => listarGeneros(sinal), [])

  const { estado } = useApi(buscarFilmes)
  const destaque = useApi(buscarDestaque).estado
  const generos = useApi(buscarGeneros).estado

  /** Troca valores da query string. Valor '' tira o parâmetro da URL. */
  function mudarFiltro(mudancas: Record<string, string>) {
    setParams((atuais) => {
      const novos = new URLSearchParams(atuais)
      for (const [chave, valor] of Object.entries(mudancas)) {
        if (valor === '') novos.delete(chave)
        else novos.set(chave, valor)
      }
      return novos
    })
  }

  const filmeDestaque = destaque.tipo === 'pronto' ? destaque.dados.dados[0] : undefined

  return (
    <div className="flex flex-col gap-8">
      {semFiltro && filmeDestaque !== undefined && (
        <section className="relative isolate overflow-hidden rounded-2xl">
          <img src={urlImagem(filmeDestaque.fundo)} alt="" className="absolute inset-0 -z-10 size-full object-cover" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-zinc-950 via-zinc-950/70 to-transparent" />
          <div className="flex min-h-80 max-w-xl flex-col justify-end gap-3 p-6 sm:p-10">
            <p className="text-sm font-semibold tracking-widest text-ouro uppercase">Em destaque</p>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">{filmeDestaque.titulo}</h1>
            <p className="flex items-center gap-3 text-sm text-zinc-300">
              <ClassificacaoBadge valor={filmeDestaque.classificacao} />
              {filmeDestaque.genero} · {formatarDuracao(filmeDestaque.duracaoMin)}
            </p>
            <p className="line-clamp-3 text-zinc-300">{filmeDestaque.sinopse}</p>
            <div>
              <Link to={`/filmes/${filmeDestaque.id}`} className={botao}>
                Ver sessões
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-white">{todos ? 'Todos os filmes' : 'Em cartaz'}</h2>
        {/* key: quando a busca muda por fora, o campo recomeça com o valor novo */}
        <CampoBusca key={busca} valorInicial={busca} aoBuscar={(termo) => mudarFiltro({ busca: termo, pagina: '' })} />

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-pressed={genero === ''}
            onClick={() => mudarFiltro({ genero: '', pagina: '' })}
            className={`rounded-full px-3 py-1 text-sm transition ${genero === '' ? 'bg-marca-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
          >
            Todos os gêneros
          </button>
          {generos.tipo === 'pronto' &&
            generos.dados.map((g) => (
              <button
                key={g}
                type="button"
                aria-pressed={genero === g}
                onClick={() => mudarFiltro({ genero: g, pagina: '' })}
                className={`rounded-full px-3 py-1 text-sm transition ${genero === g ? 'bg-marca-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
              >
                {g}
              </button>
            ))}
          <label className="ml-auto flex items-center gap-2 text-sm text-zinc-400">
            <input
              type="checkbox"
              checked={todos}
              onChange={(e) => mudarFiltro({ todos: e.target.checked ? '1' : '', pagina: '' })}
              className="size-4 accent-marca-600"
            />
            Incluir "em breve"
          </label>
        </div>
      </section>

      {estado.tipo === 'carregando' && <Carregando />}
      {estado.tipo === 'erro' && <MensagemErro mensagem={estado.mensagem} />}
      {estado.tipo === 'pronto' &&
        (estado.dados.dados.length === 0 ? (
          <p className="py-12 text-center text-zinc-500">Nenhum filme encontrado.</p>
        ) : (
          <>
            <p className="text-sm text-zinc-500">
              {estado.dados.total} {estado.dados.total === 1 ? 'filme' : 'filmes'}
              {busca !== '' && ` para "${busca}"`}
              {genero !== '' && ` em ${genero}`}
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {estado.dados.dados.map((filme) => (
                <FilmeCard key={filme.id} filme={filme} />
              ))}
            </div>
            <Paginacao
              pagina={pagina}
              totalPaginas={estado.dados.totalPaginas}
              aoMudar={(nova) => {
                mudarFiltro({ pagina: nova === 1 ? '' : String(nova) })
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            />
          </>
        ))}
    </div>
  )
}
