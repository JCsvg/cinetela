import { useCallback, useState, type SubmitEvent } from 'react'
import { useParams } from 'react-router'
import { apagarProduto, atualizarProduto, criarProduto, listarProdutos } from '../../api/gerencia'
import Campo from '../../components/Campo'
import Carregando from '../../components/Carregando'
import MensagemErro from '../../components/MensagemErro'
import { useApi } from '../../hooks/useApi'
import { CATEGORIAS, type Categoria, type Produto } from '../../types/produto'
import { botao, botaoPerigo, botaoSecundario, cartao, entrada } from '../../utils/estilos'
import { separarErros } from '../../utils/erros'
import { formatarMoeda } from '../../utils/formatar'
import { urlImagem } from '../../utils/imagem'

const IMAGENS = ['pipoca', 'refrigerante', 'agua', 'nachos', 'cachorro-quente', 'chocolate']

type Campos = { nome: string; descricao: string; categoria: Categoria; preco: string; imagem: string; ativo: boolean }
const vazio: Campos = { nome: '', descricao: '', categoria: 'pipoca', preco: '', imagem: '/img/produtos/pipoca.jpg', ativo: true }

export default function Lanchonete() {
  const cinemaId = Number(useParams().cinemaId)
  const buscar = useCallback((sinal: AbortSignal) => listarProdutos(cinemaId, sinal), [cinemaId])
  const { estado, recarregar } = useApi(buscar)

  const [editando, setEditando] = useState<Produto | null>(null)
  const [campos, setCampos] = useState<Campos>(vazio)
  const [erros, setErros] = useState<Record<string, string>>({})
  const [geral, setGeral] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  function editar(p: Produto | null) {
    setEditando(p)
    setCampos(
      p === null
        ? vazio
        : { nome: p.nome, descricao: p.descricao, categoria: p.categoria, preco: String(p.preco), imagem: p.imagem, ativo: p.ativo },
    )
    setErros({})
    setGeral(null)
  }

  async function salvar(evento: SubmitEvent<HTMLFormElement>) {
    evento.preventDefault()
    const dados = { ...campos, nome: campos.nome.trim(), descricao: campos.descricao.trim(), preco: Number(campos.preco) }
    setEnviando(true)
    try {
      if (editando === null) await criarProduto(cinemaId, dados)
      else await atualizarProduto(editando.id, dados)
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

  async function apagar(p: Produto) {
    if (!window.confirm(`Apagar ${p.nome}?`)) return
    setGeral(null)
    try {
      await apagarProduto(p.id)
      recarregar()
    } catch (e) {
      setGeral(separarErros(e).geral)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_22rem]">
      <div className="flex flex-col gap-4">
        {geral !== null && <MensagemErro mensagem={geral} />}
        {estado.tipo === 'carregando' && <Carregando />}
        {estado.tipo === 'erro' && <MensagemErro mensagem={estado.mensagem} />}
        {estado.tipo === 'pronto' && (
          <ul className="flex flex-col gap-2">
            {estado.dados.map((p) => (
              <li key={p.id} className={`${cartao} flex items-center gap-4 py-3 ${p.ativo ? '' : 'opacity-50'}`}>
                <img src={urlImagem(p.imagem)} alt="" className="size-14 rounded object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white">
                    {p.nome} {!p.ativo && <span className="text-xs text-zinc-500">(desativado)</span>}
                  </p>
                  <p className="truncate text-sm text-zinc-400">{p.descricao}</p>
                </div>
                <p className="font-bold text-ouro">{formatarMoeda(p.preco)}</p>
                <div className="whitespace-nowrap">
                  <button type="button" onClick={() => editar(p)} className="px-2 text-sm text-zinc-300 hover:text-white">
                    Editar
                  </button>
                  <button type="button" onClick={() => apagar(p)} className={botaoPerigo}>
                    Apagar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form onSubmit={salvar} noValidate className={`${cartao} flex flex-col gap-4 self-start`}>
        <h2 className="font-semibold text-white">{editando === null ? 'Novo produto' : `Editar ${editando.nome}`}</h2>
        <Campo id="nome" rotulo="Nome" erro={erros.nome}>
          <input id="nome" value={campos.nome} onChange={(e) => setCampos({ ...campos, nome: e.target.value })} className={entrada} />
        </Campo>
        <Campo id="descricao" rotulo="Descrição" erro={erros.descricao}>
          <input id="descricao" value={campos.descricao} onChange={(e) => setCampos({ ...campos, descricao: e.target.value })} className={entrada} />
        </Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo id="categoria" rotulo="Categoria" erro={erros.categoria}>
            <select
              id="categoria"
              value={campos.categoria}
              onChange={(e) => setCampos({ ...campos, categoria: CATEGORIAS.find((c) => c === e.target.value) ?? 'pipoca' })}
              className={entrada}
            >
              {CATEGORIAS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Campo>
          <Campo id="preco" rotulo="Preço (R$)" erro={erros.preco}>
            <input id="preco" type="number" step="0.5" value={campos.preco} onChange={(e) => setCampos({ ...campos, preco: e.target.value })} className={entrada} />
          </Campo>
        </div>
        <Campo id="imagem" rotulo="Imagem" erro={erros.imagem}>
          <select id="imagem" value={campos.imagem} onChange={(e) => setCampos({ ...campos, imagem: e.target.value })} className={entrada}>
            {IMAGENS.map((i) => (
              <option key={i} value={`/img/produtos/${i}.jpg`}>
                {i}
              </option>
            ))}
          </select>
        </Campo>
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input type="checkbox" checked={campos.ativo} onChange={(e) => setCampos({ ...campos, ativo: e.target.checked })} className="size-4 accent-marca-600" />
          Disponível para venda
        </label>
        <div className="flex gap-2">
          <button type="submit" disabled={enviando} className={botao}>
            {editando === null ? 'Criar produto' : 'Salvar'}
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
