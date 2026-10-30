import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { inicioDoPapel, useAuth } from '../auth/useAuth'
import { MODO_DEMO } from '../demo/api'

function classeDoLink({ isActive }: { isActive: boolean }): string {
  const cores = isActive ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
  return `rounded-md px-3 py-1.5 text-sm font-medium transition ${cores}`
}

/** Moldura de todas as páginas. A página da rota aparece no lugar do <Outlet />. */
export default function Layout() {
  const { usuario, sair } = useAuth()
  const navigate = useNavigate()

  async function aoSair() {
    await sair()
    navigate('/')
  }

  return (
    <div className="flex min-h-screen flex-col">
      {MODO_DEMO && (
        <p className="bg-ouro px-4 py-1.5 text-center text-sm font-medium text-zinc-900">
          Demonstração com dados fixos: dá para navegar e escolher assentos. Para entrar e comprar, rode o projeto localmente.
        </p>
      )}
      <header className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-white">
            <span aria-hidden="true" className="text-marca-500">
              ▶
            </span>
            <span>
              Cine<span className="text-marca-500">Tela</span>
            </span>
          </Link>

          <nav className="flex flex-wrap items-center gap-1">
            <NavLink to="/" end className={classeDoLink}>
              Em cartaz
            </NavLink>
            {usuario === null ? (
              <>
                <NavLink to="/login" className={classeDoLink}>
                  Entrar
                </NavLink>
                <NavLink
                  to="/cadastro"
                  className="rounded-md bg-marca-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-marca-500"
                >
                  Criar conta
                </NavLink>
              </>
            ) : (
              <>
                <NavLink to="/conta" className={classeDoLink}>
                  Meus ingressos
                </NavLink>
                {usuario.papel !== 'cliente' && (
                  <NavLink to={inicioDoPapel(usuario.papel, usuario.cinemaId)} className={classeDoLink}>
                    {usuario.papel === 'admin' ? 'Administração' : 'Meu cinema'}
                  </NavLink>
                )}
                <span className="hidden px-2 text-sm text-zinc-500 md:inline">{usuario.nome}</span>
                <button
                  type="button"
                  onClick={aoSair}
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-zinc-400 transition hover:bg-zinc-900 hover:text-white"
                >
                  Sair
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-zinc-800 py-6 text-center text-sm text-zinc-500">
        CineTela, projeto de estudo com PHP, PostgreSQL, React, TypeScript e Tailwind. Filmes fictícios.
      </footer>
    </div>
  )
}
