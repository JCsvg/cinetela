import { useCallback } from 'react'
import { useParams, useSearchParams } from 'react-router'
import { ErroApi } from '../api/cliente'
import { buscarFilme, listarCidades, listarHorarios } from '../api/filmes'
import Carregando from '../components/Carregando'
import ClassificacaoBadge from '../components/ClassificacaoBadge'
import HorariosPorCinema from '../components/HorariosPorCinema'
import MensagemErro from '../components/MensagemErro'
import { useApi } from '../hooks/useApi'
import { entrada } from '../utils/estilos'
import { formatarDuracao, formatarDiaDoFiltro, proximosDias } from '../utils/formatar'
import NaoEncontrada from './NaoEncontrada'
import { urlImagem } from '../utils/imagem'

const DIAS = proximosDias(7)

export default function FilmeDetalhe() {
  const { id } = useParams()
  const filmeId = Number(id)
  // Cidade e dia ficam na URL, como o filtro da Home
  const [params, setParams] = useSearchParams()
  const cidade = params.get('cidade') ?? ''
  const dia = params.get('dia') ?? ''

  const buscarDoFilme = useCallback((sinal: AbortSignal) => buscarFilme(filmeId, sinal), [filmeId])
  const buscarHorarios = useCallback(
    (sinal: AbortSignal) => listarHorarios(filmeId, { cidade, data: dia }, sinal),
    [filmeId, cidade, dia],
  )
  const buscarCidades = useCallback((sinal: AbortSignal) => listarCidades(sinal), [])

  const filme = useApi(buscarDoFilme).estado
  const horarios = useApi(buscarHorarios).estado
  const cidades = useApi(buscarCidades).estado

  function mudar(chave: string, valor: string) {
    setParams((atuais) => {
      const novos = new URLSearchParams(atuais)
      if (valor === '') novos.delete(chave)
      else novos.set(chave, valor)
      return novos
    })
  }

  if (filme.tipo === 'carregando') return <Carregando />
  if (filme.tipo === 'erro') {
    return filme.erro instanceof ErroApi && filme.erro.status === 404 ? <NaoEncontrada /> : <MensagemErro mensagem={filme.mensagem} />
  }
  const f = filme.dados

  return (
    <div className="flex flex-col gap-10">
      <section className="relative isolate overflow-hidden rounded-2xl">
        <img src={urlImagem(f.fundo)} alt="" className="absolute inset-0 -z-10 size-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-zinc-950/30" />
        <div className="flex flex-col gap-6 p-6 pt-24 sm:flex-row sm:p-10 sm:pt-32">
          <img src={urlImagem(f.poster)} alt={`Cena de ${f.titulo}`} className="hidden h-64 w-44 rounded-lg object-cover shadow-2xl sm:block" />
          <div className="flex flex-col justify-end gap-3">
            <h1 className="text-4xl font-extrabold tracking-tight text-white">{f.titulo}</h1>
            <p className="flex flex-wrap items-center gap-3 text-sm text-zinc-300">
              <ClassificacaoBadge valor={f.classificacao} />
              <span>{f.genero}</span>
              <span>{formatarDuracao(f.duracaoMin)}</span>
              {!f.emCartaz && <span className="rounded bg-ouro px-2 py-0.5 font-bold text-zinc-900">Estreia em {f.estreia.split('-').reverse().join('/')}</span>}
            </p>
            <p className="max-w-2xl text-zinc-300">{f.sinopse}</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="titulo-sessoes" className="flex flex-col gap-4">
        <h2 id="titulo-sessoes" className="text-2xl font-bold text-white">
          Sessões
        </h2>

        <div className="flex flex-wrap items-end gap-4">
          <div className="w-52">
            <label htmlFor="cidade" className="mb-1 block text-sm text-zinc-400">
              Cidade
            </label>
            <select id="cidade" value={cidade} onChange={(e) => mudar('cidade', e.target.value)} className={entrada}>
              <option value="">Todas</option>
              {cidades.tipo === 'pronto' && cidades.dados.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Dia">
            <button
              type="button"
              aria-pressed={dia === ''}
              onClick={() => mudar('dia', '')}
              className={`rounded-lg px-3 py-2 text-sm transition ${dia === '' ? 'bg-marca-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
            >
              Qualquer dia
            </button>
            {DIAS.map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={dia === d}
                onClick={() => mudar('dia', d)}
                className={`rounded-lg px-3 py-2 text-sm transition ${dia === d ? 'bg-marca-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
              >
                {formatarDiaDoFiltro(d)}
              </button>
            ))}
          </div>
        </div>

        {horarios.tipo === 'carregando' && <Carregando texto="Buscando sessões..." />}
        {horarios.tipo === 'erro' && <MensagemErro mensagem={horarios.mensagem} />}
        {horarios.tipo === 'pronto' &&
          (horarios.dados.length === 0 ? (
            <p className="py-8 text-center text-zinc-500">
              {f.emCartaz ? 'Nenhuma sessão com esse filtro.' : 'As sessões ainda não foram abertas.'}
            </p>
          ) : (
            <HorariosPorCinema grupos={horarios.dados} />
          ))}
      </section>
    </div>
  )
}

