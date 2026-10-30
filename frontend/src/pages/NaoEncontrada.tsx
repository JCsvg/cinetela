import { Link } from 'react-router'

export default function NaoEncontrada() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <p className="text-6xl font-bold text-zinc-700">404</p>
      <h1 className="text-2xl font-semibold text-white">Esta sessão não existe</h1>
      <Link to="/" className="text-marca-400 hover:underline">
        Voltar para os filmes em cartaz
      </Link>
    </div>
  )
}
