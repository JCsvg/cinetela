import { useCallback, useState, type SubmitEvent } from 'react'
import { apagarFilme, atualizarFilme, criarFilme } from '../../api/admin'
import { listarFilmes } from '../../api/filmes'
import Campo from '../../components/Campo'
import Carregando from '../../components/Carregando'
import MensagemErro from '../../components/MensagemErro'
import { useApi } from '../../hooks/useApi'
import type { Filme } from '../../types/filme'
import { botao, botaoPerigo, botaoSecundario, cartao, entrada } from '../../utils/estilos'
import { separarErros } from '../../utils/erros'
import { urlImagem } from '../../utils/imagem'

// Cada imagem de filme tem um par: -poster.jpg e -fundo.jpg
const IMAGENS = [
  'noite-de-neon', 'o-ultimo-farol', 'terra-vermelha', 'mar-de-estrelas', 'a-casa-da-floresta',
  'corrida-no-gelo', 'cidade-submersa', 'verao-em-lisboa', 'sinfonia-de-cinzas',
]
const CLASSIFICACOES = ['L', '10', '12', '14', '16', '18']

type Campos = {
  titulo: string
  sinopse: string
  genero: string
  duracaoMin: string
  classificacao: string
  estreia: string
  imagem: string
}
const vazio: Campos = { titulo: '', sinopse: '', genero: '', duracaoMin: '100', classificacao: 'L', estreia: '', imagem: IMAGENS[0] }

/** "/img/filmes/noite-de-neon-poster.jpg" vira "noite-de-neon". */
const imagemDe = (poster: string) => poster.replace('/img/filmes/', '').replace('-poster.jpg', '')

export default function Filmes() {
  const buscar = useCallback((sinal: AbortSignal) => listarFilmes({ porPagina: 50 }, sinal), [])
  const { estado, recarregar } = useApi(buscar)

  const [editando, setEditando] = useState<Filme | null>(null)
  const [campos, setCampos] = useState<Campos>(vazio)
  const [erros, setErros] = useState<Record<string, string>>({})
  const [geral, setGeral] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  function editar(f: Filme | null) {
    setEditando(f)
    setCampos(
      f === null
        ? vazio
        : {
            titulo: f.titulo, sinopse: f.sinopse, genero: f.genero, duracaoMin: String(f.duracaoMin),
            classificacao: f.classificacao, estreia: f.estreia, imagem: imagemDe(f.poster),
          },
    )
    setErros({})
    setGeral(null)
  }

  async function salvar(evento: SubmitEvent<HTMLFormElement>) {
    evento.preventDefault()
    const dados = {
      titulo: campos.titulo.trim(),
      sinopse: campos.sinopse.trim(),
      genero: campos.genero.trim(),
      duracaoMin: Number(campos.duracaoMin),
      classificacao: campos.classificacao,
      estreia: campos.estreia,
      poster: `/img/filmes/${campos.imagem}-poster.jpg`,
      fundo: `/img/filmes/${campos.imagem}-fundo.jpg`,
    }
    setEnviando(true)
    try {
      if (editando === null) await criarFilme(dados)
      else await atualizarFilme(editando.id, dados)
      editar(null)
      recarregar()
    } catch (e) {
      const separados = separarErros(e)
      setErros(separados.campos)
      setGeral(separados.geral)
    } finally {
      setEnviando(false)
    }
  }

  async function apagar(f: Filme) {
    if (!window.confirm(`Apagar "${f.titulo}"?`)) return
    setGeral(null)
    try {
      await apagarFilme(f.id)
      recarregar()
    } catch (e) {
      setGeral(separarErros(e).geral)
    }
  }

  const campo = (nome: keyof Campos) => ({
    value: campos[nome],
    onChange: (e: { target: { value: string } }) => setCampos({ ...campos, [nome]: e.target.value }),
    className: entrada,
  })

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_24rem]">
      <div className="flex flex-col gap-4">
        {geral !== null && <MensagemErro mensagem={geral} />}
        {estado.tipo === 'carregando' && <Carregando />}
        {estado.tipo === 'erro' && <MensagemErro mensagem={estado.mensagem} />}
        {estado.tipo === 'pronto' && (
          <ul className="flex flex-col gap-2">
            {estado.dados.dados.map((f) => (
              <li key={f.id} className={`${cartao} flex items-center gap-4 py-3`}>
                <img src={urlImagem(f.poster)} alt="" className="h-16 w-11 rounded object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white">{f.titulo}</p>
                  <p className="text-sm text-zinc-400">
                    {f.genero} · {f.duracaoMin} min · {f.classificacao} · {f.emCartaz ? 'em cartaz' : 'sem sessões'}
                  </p>
                </div>
                <div className="whitespace-nowrap">
                  <button type="button" onClick={() => editar(f)} className="px-2 text-sm text-zinc-300 hover:text-white">
                    Editar
                  </button>
                  <button type="button" onClick={() => apagar(f)} className={botaoPerigo}>
                    Apagar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form onSubmit={salvar} noValidate className={`${cartao} flex flex-col gap-4 self-start`}>
        <h2 className="font-semibold text-white">{editando === null ? 'Novo filme' : `Editar ${editando.titulo}`}</h2>
        <Campo id="titulo" rotulo="Título" erro={erros.titulo}>
          <input id="titulo" {...campo('titulo')} />
        </Campo>
        <Campo id="sinopse" rotulo="Sinopse" erro={erros.sinopse}>
          <textarea id="sinopse" rows={4} {...campo('sinopse')} />
        </Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo id="genero" rotulo="Gênero" erro={erros.genero}>
            <input id="genero" {...campo('genero')} />
          </Campo>
          <Campo id="duracaoMin" rotulo="Duração (min)" erro={erros.duracaoMin}>
            <input id="duracaoMin" type="number" {...campo('duracaoMin')} />
          </Campo>
          <Campo id="classificacao" rotulo="Classificação" erro={erros.classificacao}>
            <select id="classificacao" {...campo('classificacao')}>
              {CLASSIFICACOES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Campo>
          <Campo id="estreia" rotulo="Estreia" erro={erros.estreia}>
            <input id="estreia" type="date" {...campo('estreia')} />
          </Campo>
        </div>
        <Campo id="imagem" rotulo="Imagem" erro={erros.poster ?? erros.fundo}>
          <select id="imagem" {...campo('imagem')}>
            {IMAGENS.map((i) => (
              <option key={i}>{i}</option>
            ))}
          </select>
        </Campo>
        <div className="flex gap-2">
          <button type="submit" disabled={enviando} className={botao}>
            {editando === null ? 'Criar filme' : 'Salvar'}
          </button>
          {editando !== null && (
            <button type="button" onClick={() => editar(null)} className={botaoSecundario}>
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
