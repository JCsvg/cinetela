import type { ReactNode } from 'react'

type Props = {
  id: string
  rotulo: string
  erro?: string
  dica?: string
  children: ReactNode
}

/** Rótulo + campo + erro (ou dica) embaixo. O campo precisa ter o mesmo `id`. */
export default function Campo({ id, rotulo, erro, dica, children }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-zinc-300">
        {rotulo}
      </label>
      {children}
      {erro !== undefined ? (
        <p id={`${id}-erro`} className="text-sm text-red-400">
          {erro}
        </p>
      ) : (
        dica !== undefined && <p className="text-xs text-zinc-500">{dica}</p>
      )}
    </div>
  )
}
