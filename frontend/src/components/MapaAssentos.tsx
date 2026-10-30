import type { Assento } from '../types/pedido'

type Props = {
  fileiras: string[]
  assentosPorFileira: number
  /** Assentos já vendidos, como "D5" */
  ocupados: string[]
  escolhidos: Assento[]
  aoAlternar: (assento: Assento) => void
}

export default function MapaAssentos({ fileiras, assentosPorFileira, ocupados, escolhidos, aoAlternar }: Props) {
  const numeros = Array.from({ length: assentosPorFileira }, (_, i) => i + 1)
  // Corredor no meio das salas largas
  const meio = assentosPorFileira > 8 ? Math.floor(assentosPorFileira / 2) : 0

  return (
    <div className="overflow-x-auto pb-2">
      <div className="mx-auto w-fit min-w-full">
        {/* A tela */}
        <div className="mx-auto mb-8 w-4/5 max-w-xl">
          <div className="h-2 rounded-t-[50%] bg-gradient-to-b from-zinc-200 to-zinc-600 shadow-[0_8px_30px_rgba(255,255,255,0.25)]" />
          <p className="mt-2 text-center text-xs tracking-[0.4em] text-zinc-500 uppercase">Tela</p>
        </div>

        <div className="flex flex-col items-center gap-1.5" role="group" aria-label="Mapa de assentos">
          {fileiras.map((fileira) => (
            <div key={fileira} className="flex items-center gap-1.5">
              <span className="w-5 text-center text-xs font-medium text-zinc-500">{fileira}</span>
              {numeros.map((numero) => {
                const codigo = `${fileira}${numero}`
                const ocupado = ocupados.includes(codigo)
                const escolhido = escolhidos.some((e) => e.fileira === fileira && e.numero === numero)
                const cor = ocupado
                  ? 'cursor-not-allowed border-zinc-800 bg-zinc-900 text-zinc-700'
                  : escolhido
                    ? 'border-marca-400 bg-marca-600 text-white shadow shadow-marca-600/40'
                    : 'border-zinc-600 bg-zinc-700 text-zinc-300 hover:bg-zinc-500'
                return (
                  <span key={numero} className={`flex ${numero === meio ? 'mr-4' : ''}`}>
                    <button
                      type="button"
                      disabled={ocupado}
                      aria-pressed={escolhido}
                      aria-label={`Assento ${codigo}, ${ocupado ? 'ocupado' : escolhido ? 'escolhido' : 'livre'}`}
                      onClick={() => aoAlternar({ fileira, numero })}
                      className={`size-7 rounded-t-lg border text-[10px] font-medium transition sm:size-8 sm:text-xs ${cor}`}
                    >
                      {numero}
                    </button>
                  </span>
                )
              })}
              <span className="w-5 text-center text-xs font-medium text-zinc-500">{fileira}</span>
            </div>
          ))}
        </div>

        <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-zinc-400">
          <li className="flex items-center gap-2">
            <span className="size-4 rounded-t border border-zinc-600 bg-zinc-700" /> Livre
          </li>
          <li className="flex items-center gap-2">
            <span className="size-4 rounded-t border border-marca-400 bg-marca-600" /> Escolhido
          </li>
          <li className="flex items-center gap-2">
            <span className="size-4 rounded-t border border-zinc-800 bg-zinc-900" /> Ocupado
          </li>
        </ul>
      </div>
    </div>
  )
}
