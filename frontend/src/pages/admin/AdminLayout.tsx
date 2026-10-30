import { Outlet } from 'react-router'
import Abas from '../../components/Abas'

/** Moldura da administração: abas e a aba atual no <Outlet />. */
export default function AdminLayout() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm tracking-widest text-ouro uppercase">Administração</p>
        <h1 className="text-3xl font-bold text-white">Controle total</h1>
      </div>
      <Abas
        abas={[
          { para: '/admin', rotulo: 'Relatório', fim: true },
          { para: '/admin/filmes', rotulo: 'Filmes' },
          { para: '/admin/cinemas', rotulo: 'Cinemas' },
          { para: '/admin/usuarios', rotulo: 'Usuários' },
        ]}
      />
      <Outlet />
    </div>
  )
}
