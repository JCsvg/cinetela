import { Link, Navigate } from 'react-router'
import { listarCinemas } from '../../api/filmes'
import { useAuth } from '../../auth/useAuth'
import Carregando from '../../components/Carregando'
import MensagemErro from '../../components/MensagemErro'
import { useApi } from '../../hooks/useApi'
import { cartao } from '../../utils/estilos'

/** /gerencia: o gerente vai direto para o cinema dele; o admin escolhe um. */
export default function GerenciaInicio() {
  const { usuario } = useAuth()
  const { estado } = useApi(listarCinemas)

  if (usuario?.papel === 'cinema' && usuario.cinemaId !== null) {
    return <Navigate to={`/gerencia/${usuario.cinemaId}`} replace />
  }
  if (estado.tipo === 'carregando') return <Carregando />
  if (estado.tipo === 'erro') return <MensagemErro mensagem={estado.mensagem} />

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-white">Qual cinema?</h1>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {estado.dados.map((c) => (
          <li key={c.id}>
            <Link to={`/gerencia/${c.id}`} className={`${cartao} block transition hover:border-zinc-600`}>
              <h2 className="font-bold text-white">{c.nome}</h2>
              <p className="text-sm text-zinc-400">{c.cidade}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
