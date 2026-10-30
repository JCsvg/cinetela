const cores: Record<string, string> = {
  L: 'bg-emerald-600',
  '10': 'bg-sky-600',
  '12': 'bg-amber-500 text-zinc-900',
  '14': 'bg-orange-600',
  '16': 'bg-red-600',
  '18': 'bg-zinc-100 text-zinc-900',
}

/** A etiqueta de classificação indicativa: L, 10, 12, 14, 16 ou 18. */
export default function ClassificacaoBadge({ valor }: { valor: string }) {
  return (
    <span
      title={valor === 'L' ? 'Livre para todos os públicos' : `Não recomendado para menores de ${valor} anos`}
      className={`inline-flex size-7 items-center justify-center rounded text-xs font-bold text-white ${cores[valor] ?? 'bg-zinc-600'}`}
    >
      {valor}
    </span>
  )
}
