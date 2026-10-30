import { useCallback, useState, type SubmitEvent } from 'react'
import { useParams } from 'react-router'
import { apagarExibicao, atualizarExibicao, criarExibicao, listarExibicoes, listarSalas } from '../../api/gerencia'
import { listarFilmes } from '../../api/filmes'
import Campo from '../../components/Campo'
import Carregando from '../../components/Carregando'
import MensagemErro from '../../components/MensagemErro'
import { useApi } from '../../hooks/useApi'
import type { DadosExibicao, Exibicao, Formato, Idioma } from '../../types/exibicao'
import { botao, botaoPerigo, botaoSecundario, cartao, entrada } from '../../utils/estilos'
import { separarErros } from '../../utils/erros'
import { formatarDataHora, formatarMoeda, paraInputLocal } from '../../utils/formatar'

type Campos = { filmeId: string; salaId: string; iniciaEm: string; precoInteira: string; idioma: Idioma; formato: Formato }
const vazio: Campos = { filmeId: '', salaId: '', iniciaEm: '', precoInteira: '32', idioma: 'Dublado', formato: '2D' }

export default function Exibicoes() {
  const cinemaId = Number(useParams().cinemaId)
  const buscarExibicoes = useCallback((sinal: AbortSignal) => listarExibicoes(cinemaId, sinal), [cinemaId])
  const buscarSalas = useCallback((sinal: AbortSignal) => listarSalas(cinemaId, sinal), [cinemaId])
  const buscarFilmes = useCallback((sinal: AbortSignal) => listarFilmes({ porPagina: 50 }, sinal), [])
  const { estado, recarregar } = useApi(buscarExibicoes)
  const salas = useApi(buscarSalas).estado
  const filmes = useApi(buscarFilmes).estado

  const [editando, setEditando] = useState<Exibicao | null>(null)
  const [campos, setCampos] = useState<Campos>(vazio)
  const [erros, setErros] = useState<Record<string, string>>({})
  const [geral, setGeral] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  function editar(e: Exibicao | null) {
    setEditando(e)
    setCampos(
      e === null
        ? vazio
        : {
            filmeId: String(e.filme.id),
            salaId: String(e.sala.id),
            iniciaEm: paraInputLocal(e.iniciaEm),
            precoInteira: String(e.precoInteira),
            idioma: e.idioma,
            formato: e.formato,
          },
    )
    setErros({})
    setGeral(null)
  }

  async function salvar(evento: SubmitEvent<HTMLFormElement>) {
    evento.preventDefault()
    const dados: DadosExibicao = {
      filmeId: Number(campos.filmeId),
      salaId: Number(campos.salaId),
      iniciaEm: campos.iniciaEm,
      precoInteira: Number(campos.precoInteira),
      idioma: campos.idioma,
      formato: campos.formato,
    }
    setEnviando(true)
    try {
      if (editando === null) await criarExibicao(cinemaId, dados)
      else await atualizarExibicao(editando.id, dados)
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

  async function apagar(e: Exibicao) {
    if (!window.confirm(`Apagar a exibição de ${e.filme.titulo}?`)) return
    setGeral(null)
    try {
      await apagarExibicao(e.id)
      recarregar()
    } catch (erro) {
      setGeral(separarErros(erro).geral)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_22rem]">
      <div className="flex flex-col gap-4">
        {geral !== null && <MensagemErro mensagem={geral} />}
        {estado.tipo === 'carregando' && <Carregando />}
        {estado.tipo === 'erro' && <MensagemErro mensagem={estado.mensagem} />}
        {estado.tipo === 'pronto' && (
          <div className={`${cartao} overflow-x-auto`}>
            <table className="w-full text-left text-sm">
              <thead className="text-zinc-500">
                <tr>
                  <th className="py-1 font-medium">Quando</th>
                  <th className="font-medium">Filme</th>
                  <th className="font-medium">Sala</th>
                  <th className="font-medium">Preço</th>
                  <th className="font-medium">Livres</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {estado.dados.map((e) => (
                  <tr key={e.id} className="border-t border-zinc-800">
                    <td className="py-2 whitespace-nowrap">{formatarDataHora(e.iniciaEm)}</td>
                    <td className="font-medium text-white">
                      {e.filme.titulo}
                      <span className="ml-2 text-xs font-normal text-zinc-500">
                        {e.formato} · {e.idioma}
                      </span>
                    </td>
                    <td>{e.sala.nome}</td>
                    <td>{formatarMoeda(e.precoInteira)}</td>
                    <td>{e.assentosLivres}</td>
                    <td className="text-right whitespace-nowrap">
                      <button type="button" onClick={() => editar(e)} className="px-2 text-zinc-300 hover:text-white">
                        Editar
                      </button>
                      <button type="button" onClick={() => apagar(e)} className={botaoPerigo}>
                        Apagar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <form onSubmit={salvar} noValidate className={`${cartao} flex flex-col gap-4 self-start`}>
        <h2 className="font-semibold text-white">{editando === null ? 'Nova exibição' : 'Editar exibição'}</h2>
        <Campo id="filmeId" rotulo="Filme" erro={erros.filmeId}>
          <select id="filmeId" value={campos.filmeId} onChange={(e) => setCampos({ ...campos, filmeId: e.target.value })} className={entrada}>
            <option value="">Escolha...</option>
            {filmes.tipo === 'pronto' && filmes.dados.dados.map((f) => <option key={f.id} value={f.id}>{f.titulo}</option>)}
          </select>
        </Campo>
        <Campo id="salaId" rotulo="Sala" erro={erros.salaId}>
          <select id="salaId" value={campos.salaId} onChange={(e) => setCampos({ ...campos, salaId: e.target.value })} className={entrada}>
            <option value="">Escolha...</option>
            {salas.tipo === 'pronto' && salas.dados.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
        </Campo>
        <Campo id="iniciaEm" rotulo="Início (horário de Brasília)" erro={erros.iniciaEm}>
          <input id="iniciaEm" type="datetime-local" value={campos.iniciaEm} onChange={(e) => setCampos({ ...campos, iniciaEm: e.target.value })} className={entrada} />
        </Campo>
        <Campo id="precoInteira" rotulo="Preço da inteira (R$)" erro={erros.precoInteira}>
          <input id="precoInteira" type="number" step="0.5" value={campos.precoInteira} onChange={(e) => setCampos({ ...campos, precoInteira: e.target.value })} className={entrada} />
        </Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo id="idioma" rotulo="Idioma" erro={erros.idioma}>
            <select id="idioma" value={campos.idioma} onChange={(e) => setCampos({ ...campos, idioma: e.target.value === 'Legendado' ? 'Legendado' : 'Dublado' })} className={entrada}>
              <option>Dublado</option>
              <option>Legendado</option>
            </select>
          </Campo>
          <Campo id="formato" rotulo="Formato" erro={erros.formato}>
            <select id="formato" value={campos.formato} onChange={(e) => setCampos({ ...campos, formato: e.target.value === '3D' ? '3D' : '2D' })} className={entrada}>
              <option>2D</option>
              <option>3D</option>
            </select>
          </Campo>
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={enviando} className={botao}>
            {editando === null ? 'Criar exibição' : 'Salvar'}
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
