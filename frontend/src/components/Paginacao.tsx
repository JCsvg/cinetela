type Props = {
  pagina: number
  totalPaginas: number
  aoMudar: (pagina: number) => void
}

const base = 'min-w-9 rounded-md px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40'

export default function Paginacao({ pagina, totalPaginas, aoMudar }: Props) {
  if (totalPaginas <= 1) {
    return null
  }

  const numeros = Array.from({ length: totalPaginas }, (_, i) => i + 1)

  return (
    <nav aria-label="Paginação" className="flex flex-wrap items-center justify-center gap-1">
      <button type="button" disabled={pagina <= 1} onClick={() => aoMudar(pagina - 1)} className={`${base} text-zinc-300 hover:bg-zinc-800`}>
        Anterior
      </button>
      {numeros.map((numero) => (
        <button
          key={numero}
          type="button"
          aria-current={numero === pagina ? 'page' : undefined}
          onClick={() => aoMudar(numero)}
          className={`${base} ${numero === pagina ? 'bg-marca-600 text-white' : 'text-zinc-300 hover:bg-zinc-800'}`}
        >
          {numero}
        </button>
      ))}
      <button type="button" disabled={pagina >= totalPaginas} onClick={() => aoMudar(pagina + 1)} className={`${base} text-zinc-300 hover:bg-zinc-800`}>
        Próxima
      </button>
    </nav>
  )
}
