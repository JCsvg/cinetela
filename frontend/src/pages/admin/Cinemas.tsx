import { useState, type SubmitEvent } from 'react'
import { apagarCinema, atualizarCinema, criarCinema } from '../../api/admin'
import { listarCinemas } from '../../api/filmes'
import Campo from '../../components/Campo'
import Carregando from '../../components/Carregando'
import MensagemErro from '../../components/MensagemErro'
import { useApi } from '../../hooks/useApi'
import type { Cinema } from '../../types/cinema'
import { botao, botaoPerigo, botaoSecundario, cartao, entrada } from '../../utils/estilos'
import { separarErros } from '../../utils/erros'
import { urlImagem } from '../../utils/imagem'

const IMAGENS = ['cine-aurora', 'cine-horizonte', 'cine-retro-palace']
type Campos = { nome: string; cidade: string; endereco: string; imagem: string }
const vazio: Campos = { nome: '', cidade: '', endereco: '', imagem: IMAGENS[0] }

export default function Cinemas() {
  const { estado, recarregar } = useApi(listarCinemas)
  const [editando, setEditando] = useState<Cinema | null>(null)
  const [campos, setCampos] = useState<Campos>(vazio)
  const [erros, setErros] = useState<Record<string, string>>({})
  const [geral, setGeral] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  function editar(c: Cinema | null) {
    setEditando(c)
    setCampos(
      c === null
        ? vazio
        : { nome: c.nome, cidade: c.cidade, endereco: c.endereco, imagem: c.imagem.replace('/img/cinemas/', '').replace('.jpg', '') },
    )
    setErros({})
    setGeral(null)
  }

  async function salvar(evento: SubmitEvent<HTMLFormElement>) {
    evento.preventDefault()
    const dados = {
      nome: campos.nome.trim(),
      cidade: campos.cidade.trim(),
      endereco: campos.endereco.trim(),
      imagem: `/img/cinemas/${campos.imagem}.jpg`,
    }
    setEnviando(true)
    try {
      if (editando === null) await criarCinema(dados)
      else await atualizarCinema(editando.id, dados)
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

  async function apagar(c: Cinema) {
    if (!window.confirm(`Apagar o ${c.nome}?`)) return
    setGeral(null)
    try {
      await apagarCinema(c.id)
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
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_22rem]">
      <div className="flex flex-col gap-4">
        {geral !== null && <MensagemErro mensagem={geral} />}
        {estado.tipo === 'carregando' && <Carregando />}
        {estado.tipo === 'erro' && <MensagemErro mensagem={estado.mensagem} />}
        {estado.tipo === 'pronto' && (
          <ul className="flex flex-col gap-2">
            {estado.dados.map((c) => (
              <li key={c.id} className={`${cartao} flex items-center gap-4 py-3`}>
                <img src={urlImagem(c.imagem)} alt="" className="h-14 w-24 rounded object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white">{c.nome}</p>
                  <p className="truncate text-sm text-zinc-400">
                    {c.endereco}, {c.cidade}
                  </p>
                </div>
                <div className="whitespace-nowrap">
                  <button type="button" onClick={() => editar(c)} className="px-2 text-sm text-zinc-300 hover:text-white">
                    Editar
                  </button>
                  <button type="button" onClick={() => apagar(c)} className={botaoPerigo}>
                    Apagar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form onSubmit={salvar} noValidate className={`${cartao} flex flex-col gap-4 self-start`}>
        <h2 className="font-semibold text-white">{editando === null ? 'Novo cinema' : `Editar ${editando.nome}`}</h2>
        <Campo id="nome" rotulo="Nome" erro={erros.nome}>
          <input id="nome" {...campo('nome')} />
        </Campo>
        <Campo id="cidade" rotulo="Cidade" erro={erros.cidade}>
          <input id="cidade" {...campo('cidade')} />
        </Campo>
        <Campo id="endereco" rotulo="Endereço" erro={erros.endereco}>
          <input id="endereco" {...campo('endereco')} />
        </Campo>
        <Campo id="imagem" rotulo="Foto" erro={erros.imagem}>
          <select id="imagem" {...campo('imagem')}>
            {IMAGENS.map((i) => (
              <option key={i}>{i}</option>
            ))}
          </select>
        </Campo>
        <div className="flex gap-2">
          <button type="submit" disabled={enviando} className={botao}>
            {editando === null ? 'Criar cinema' : 'Salvar'}
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
