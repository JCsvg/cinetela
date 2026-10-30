import { NavLink } from 'react-router'

type Aba = {
  para: string
  rotulo: string
  /** true para a aba "raiz", que não deve ficar ativa nas filhas */
  fim?: boolean
}

/** Menu de abas dos painéis (cinema e administração). */
export default function Abas({ abas }: { abas: Aba[] }) {
  return (
    <nav className="flex flex-wrap gap-1 border-b border-zinc-800">
      {abas.map((aba) => (
        <NavLink
          key={aba.para}
          to={aba.para}
          end={aba.fim}
          className={({ isActive }) =>
            `-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition ${
              isActive ? 'border-marca-500 text-white' : 'border-transparent text-zinc-400 hover:text-white'
            }`
          }
        >
          {aba.rotulo}
        </NavLink>
      ))}
    </nav>
  )
}
