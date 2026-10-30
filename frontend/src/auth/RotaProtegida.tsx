import { Navigate, Outlet, useLocation } from 'react-router'
import Carregando from '../components/Carregando'
import type { Papel } from '../types/usuario'
import { useAuth } from './useAuth'

type Props = {
  /** Papéis que podem entrar. Sem a prop, qualquer pessoa logada entra. */
  papeis?: Papel[]
}

/**
 * Rota pai das páginas que exigem login. Sem login, manda para /login
 * guardando de onde veio, para voltar depois de entrar. Com login mas sem
 * o papel certo, mostra um aviso (o back também confere, com 403).
 */
export default function RotaProtegida({ papeis }: Props) {
  const { usuario, verificando } = useAuth()
  const local = useLocation()

  if (verificando) {
    return <Carregando />
  }
  if (usuario === null) {
    return <Navigate to="/login" replace state={{ voltarPara: local.pathname }} />
  }
  if (papeis !== undefined && !papeis.includes(usuario.papel)) {
    return (
      <div className="py-16 text-center">
        <p className="text-5xl font-bold text-zinc-700">403</p>
        <p className="mt-2 text-zinc-300">Você não tem acesso a esta área.</p>
      </div>
    )
  }
  return <Outlet />
}
