import { useState, type SubmitEvent } from 'react'
import { botao, entrada } from '../utils/estilos'

type Props = {
  valorInicial: string
  aoBuscar: (termo: string) => void
}

export default function CampoBusca({ valorInicial, aoBuscar }: Props) {
  const [texto, setTexto] = useState(valorInicial)

  function enviar(evento: SubmitEvent<HTMLFormElement>) {
    evento.preventDefault()
    aoBuscar(texto.trim())
  }

  return (
    <form role="search" onSubmit={enviar} className="flex gap-2">
      <label htmlFor="busca" className="sr-only">
        Buscar filmes
      </label>
      <input
        id="busca"
        type="search"
        value={texto}
        onChange={(evento) => setTexto(evento.target.value)}
        placeholder="Buscar por título ou história"
        className={`${entrada} min-w-0 flex-1`}
      />
      <button type="submit" className={botao}>
        Buscar
      </button>
    </form>
  )
}
