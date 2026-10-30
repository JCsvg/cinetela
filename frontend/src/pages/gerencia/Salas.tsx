import { useCallback, useState, type SubmitEvent } from 'react'
import { useParams } from 'react-router'
import { apagarSala, atualizarSala, criarSala, listarSalas } from '../../api/gerencia'
import Campo from '../../components/Campo'
import Carregando from '../../components/Carregando'
import MensagemErro from '../../components/MensagemErro'
import { useApi } from '../../hooks/useApi'
import type { DadosSala, Sala } from '../../types/cinema'
import { botao, botaoPerigo, botaoSecundario, cartao, entrada } from '../../utils/estilos'
import { separarErros } from '../../utils/erros'

const vazio = { nome: '', fileiras: '8', assentosPorFileira: '10' }

export default function Salas() {
  const cinemaId = Number(useParams().cinemaId)
  const buscar = useCallback((sinal: AbortSignal) => listarSalas(cinemaId, sinal), [cinemaId])
  const { estado, recarregar } = useApi(buscar)

  const [editando, setEditando] = useState<Sala | null>(null)
  const [campos, setCampos] = useState(vazio)
  const [erros, setErros] = useState<Record<string, string>>({})
  const [geral, setGeral] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  function editar(sala: Sala | null) {
    setEditando(sala)
    setCampos(
      sala === null
        ? vazio
        : { nome: sala.nome, fileiras: String(sala.fileiras), assentosPorFileira: String(sala.assentosPorFileira) },
    )
    setErros({})
    setGeral(null)
  }

  async function salvar(evento: SubmitEvent<HTMLFormElement>) {
    evento.preventDefault()
    const dados: DadosSala = {
      nome: campos.nome.trim(),
      fileiras: Number(campos.fileiras),
      assentosPorFileira: Number(campos.assentosPorFileira),
    }
    setEnviando(true)
    try {
      if (editando === null) await criarSala(cinemaId, dados)
      else await atualizarSala(editando.id, dados)
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

  async function apagar(sala: Sala) {
    if (!window.confirm(`Apagar a ${sala.nome}?`)) return
    setGeral(null)
    try {
      await apagarSala(sala.id)
      recarregar()
    } catch (e) {
      setGeral(separarErros(e).geral)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="flex flex-col gap-4">
        {geral !== null && <MensagemErro mensagem={geral} />}
        {estado.tipo === 'carregando' && <Carregando />}
        {estado.tipo === 'erro' && <MensagemErro mensagem={estado.mensagem} />}
        {estado.tipo === 'pronto' && (
          <table className={`${cartao} w-full text-left text-sm`}>
            <thead className="text-zinc-500">
              <tr>
                <th className="py-1 font-medium">Sala</th>
                <th className="font-medium">Fileiras × assentos</th>
                <th className="font-medium">Capacidade</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {estado.dados.map((s) => (
                <tr key={s.id} className="border-t border-zinc-800">
                  <td className="py-2 font-medium text-white">{s.nome}</td>
                  <td>
                    {s.fileiras} × {s.assentosPorFileira}
                  </td>
                  <td>{s.capacidade}</td>
                  <td className="text-right whitespace-nowrap">
                    <button type="button" onClick={() => editar(s)} className="px-2 text-zinc-300 hover:text-white">
                      Editar
                    </button>
                    <button type="button" onClick={() => apagar(s)} className={botaoPerigo}>
                      Apagar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <form onSubmit={salvar} noValidate className={`${cartao} flex flex-col gap-4 self-start`}>
        <h2 className="font-semibold text-white">{editando === null ? 'Nova sala' : `Editar ${editando.nome}`}</h2>
        <Campo id="nome" rotulo="Nome" erro={erros.nome}>
          <input id="nome" value={campos.nome} onChange={(e) => setCampos({ ...campos, nome: e.target.value })} className={entrada} />
        </Campo>
        <Campo id="fileiras" rotulo="Fileiras (1 a 26)" erro={erros.fileiras}>
          <input id="fileiras" type="number" value={campos.fileiras} onChange={(e) => setCampos({ ...campos, fileiras: e.target.value })} className={entrada} />
        </Campo>
        <Campo id="assentos" rotulo="Assentos por fileira (1 a 30)" erro={erros.assentosPorFileira}>
          <input id="assentos" type="number" value={campos.assentosPorFileira} onChange={(e) => setCampos({ ...campos, assentosPorFileira: e.target.value })} className={entrada} />
        </Campo>
        <div className="flex gap-2">
          <button type="submit" disabled={enviando} className={botao}>
            {editando === null ? 'Criar sala' : 'Salvar'}
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
