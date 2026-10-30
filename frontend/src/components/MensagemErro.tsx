type Props = {
  mensagem: string
}

export default function MensagemErro({ mensagem }: Props) {
  return (
    <div role="alert" className="rounded-lg border border-red-900 bg-red-950/60 px-4 py-3 text-red-200">
      {mensagem}
    </div>
  )
}
