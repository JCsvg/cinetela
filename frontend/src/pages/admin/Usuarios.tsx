import { useCallback, useState } from 'react'
import { listarUsuarios, mudarPapel } from '../../api/admin'
import { listarCinemas } from '../../api/filmes'
import { useAuth } from '../../auth/useAuth'
import Carregando from '../../components/Carregando'
import MensagemErro from '../../components/MensagemErro'
import { useApi } from '../../hooks/useApi'
import type { Cinema } from '../../types/cinema'
import type { Papel, Usuario } from '../../types/usuario'
import { botao, cartao, entrada } from '../../utils/estilos'
import { separarErros } from '../../utils/erros'

const PAPEIS: Papel[] = ['cliente', 'cinema', 'admin']

function LinhaUsuario({ usuario, cinemas, ehVoce, aoSalvar }: {
  usuario: Usuario
  cinemas: Cinema[]
  ehVoce: boolean
  aoSalvar: () => void
}) {
  const [papel, setPapel] = useState<Papel>(usuario.papel)
  const [cinemaId, setCinemaId] = useState(String(usuario.cinemaId ?? cinemas[0]?.id ?? ''))
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function salvar() {
    setEnviando(true)
    setErro(null)
    try {
      await mudarPapel(usuario.id, papel, papel === 'cinema' ? Number(cinemaId) : null)
      aoSalvar()
    } catch (e) {
      const { campos, geral } = separarErros(e)
      setErro(geral ?? Object.values(campos).join(' '))
    } finally {
      setEnviando(false)
    }
  }

  const mudou = papel !== usuario.papel || (papel === 'cinema' && Number(cinemaId) !== usuario.cinemaId)

  return (
    <tr className="border-t border-zinc-800 align-top">
      <td className="py-3">
        <p className="font-medium text-white">
          {usuario.nome} {ehVoce && <span className="text-xs text-zinc-500">(você)</span>}
        </p>
        <p className="text-zinc-500">{usuario.email}</p>
      </td>
      <td>
        <select
          aria-label={`Papel de ${usuario.nome}`}
          disabled={ehVoce}
          value={papel}
          onChange={(e) => setPapel(PAPEIS.find((p) => p === e.target.value) ?? 'cliente')}
          className={`${entrada} w-32`}
        >
          {PAPEIS.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </td>
      <td>
        {papel === 'cinema' && (
          <select aria-label={`Cinema de ${usuario.nome}`} value={cinemaId} onChange={(e) => setCinemaId(e.target.value)} className={`${entrada} w-48`}>
            {cinemas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        )}
      </td>
      <td className="text-right">
        {!ehVoce && (
          <button type="button" disabled={!mudou || enviando} onClick={salvar} className={`${botao} px-3 py-1.5 text-sm`}>
            Salvar
          </button>
        )}
        {erro !== null && <p className="mt-1 text-xs text-red-400">{erro}</p>}
      </td>
    </tr>
  )
}

export default function UsuariosAdmin() {
  const { usuario: eu } = useAuth()
  const buscar = useCallback((sinal: AbortSignal) => listarUsuarios(sinal), [])
  const { estado, recarregar } = useApi(buscar)
  const cinemas = useApi(listarCinemas).estado

  if (estado.tipo === 'carregando' || cinemas.tipo === 'carregando') return <Carregando />
  if (estado.tipo === 'erro') return <MensagemErro mensagem={estado.mensagem} />
  if (cinemas.tipo === 'erro') return <MensagemErro mensagem={cinemas.mensagem} />

  return (
    <div className={`${cartao} overflow-x-auto`}>
      <table className="w-full text-left text-sm">
        <thead className="text-zinc-500">
          <tr>
            <th className="py-1 font-medium">Usuário</th>
            <th className="font-medium">Papel</th>
            <th className="font-medium">Cinema</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {estado.dados.map((u) => (
            <LinhaUsuario key={`${u.id}-${u.papel}-${u.cinemaId}`} usuario={u} cinemas={cinemas.dados} ehVoce={u.id === eu?.id} aoSalvar={recarregar} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
