type Props = {
  texto?: string
}

export default function Carregando({ texto = 'Carregando...' }: Props) {
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-16 text-zinc-400">
      <span className="size-5 animate-spin rounded-full border-2 border-zinc-700 border-t-marca-500" />
      {texto}
    </div>
  )
}
