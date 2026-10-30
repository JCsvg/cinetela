import { useCallback, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { listarProdutosDoCinema } from '../api/compra'
import CardProduto from '../components/CardProduto'
import Carregando from '../components/Carregando'
import MensagemErro from '../components/MensagemErro'
import ResumoDaCompra from '../components/ResumoDaCompra'
import { useCompra } from '../compra/useCompra'
import { useApi } from '../hooks/useApi'
import { CATEGORIAS, type Categoria } from '../types/produto'
import { botao, botaoSecundario } from '../utils/estilos'

const nomeDaCategoria: Record<Categoria, string> = {
  pipoca: 'Pipoca',
  bebida: 'Bebidas',
  lanche: 'Lanches',
  doce: 'Doces',
  combo: 'Combos',
}

export default function Lanchonete() {
  const { compra, dispatch } = useCompra()
  const navigate = useNavigate()
  const [categoria, setCategoria] = useState<Categoria | 'todas'>('todas')

  const cinemaId = compra.exibicao?.cinema.id ?? 0
  const buscar = useCallback((sinal: AbortSignal) => listarProdutosDoCinema(cinemaId, sinal), [cinemaId])
  const { estado } = useApi(buscar)

  // Entrou aqui sem escolher assentos (link direto, ou a compra foi limpa)
  if (compra.exibicao === null) return <Navigate to="/" replace />
  if (compra.ingressos.length === 0) return <Navigate to={`/sessoes/${compra.exibicao.id}/assentos`} replace />

  const quantidadeDe = (produtoId: number) => compra.itens.find((i) => i.produto.id === produtoId)?.quantidade ?? 0

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to={`/sessoes/${compra.exibicao.id}/assentos`} className="text-sm text-marca-400 hover:underline">
          Voltar para os assentos
        </Link>
        <h1 className="mt-1 text-3xl font-bold text-white">Lanchonete do {compra.exibicao.cinema.nome}</h1>
        <p className="text-zinc-400">Opcional. Retire no balcão com o código do ingresso.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Categoria">
            {(['todas', ...CATEGORIAS] as const).map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={categoria === c}
                onClick={() => setCategoria(c)}
                className={`rounded-full px-3 py-1 text-sm transition ${categoria === c ? 'bg-marca-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
              >
                {c === 'todas' ? 'Tudo' : nomeDaCategoria[c]}
              </button>
            ))}
          </div>

          {estado.tipo === 'carregando' && <Carregando />}
          {estado.tipo === 'erro' && <MensagemErro mensagem={estado.mensagem} />}
          {estado.tipo === 'pronto' && (
            <div className="grid gap-3 md:grid-cols-2">
              {estado.dados
                .filter((p) => categoria === 'todas' || p.categoria === categoria)
                .map((produto) => (
                  <CardProduto
                    key={produto.id}
                    produto={produto}
                    quantidade={quantidadeDe(produto.id)}
                    aoAlterar={(delta) => dispatch({ tipo: 'alterarItem', produto, delta })}
                  />
                ))}
            </div>
          )}
        </div>

        <ResumoDaCompra compra={compra}>
          <button type="button" onClick={() => navigate('/pagamento')} className={botao}>
            {compra.itens.length === 0 ? 'Seguir sem lanchonete' : 'Ir para o pagamento'}
          </button>
          <Link to={`/sessoes/${compra.exibicao.id}/assentos`} className={botaoSecundario}>
            Mudar assentos
          </Link>
        </ResumoDaCompra>
      </div>
    </div>
  )
}
