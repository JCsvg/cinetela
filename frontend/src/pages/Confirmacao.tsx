import { useCallback } from 'react'
import { Link, useParams } from 'react-router'
import { ErroApi } from '../api/cliente'
import { buscarPedido } from '../api/compra'
import Carregando from '../components/Carregando'
import IngressoVirtual from '../components/IngressoVirtual'
import MensagemErro from '../components/MensagemErro'
import { useApi } from '../hooks/useApi'
import { botao, botaoSecundario } from '../utils/estilos'
import NaoEncontrada from './NaoEncontrada'

export default function Confirmacao() {
  const { id } = useParams()
  const pedidoId = Number(id)
  const buscar = useCallback((sinal: AbortSignal) => buscarPedido(pedidoId, sinal), [pedidoId])
  const { estado } = useApi(buscar)

  if (estado.tipo === 'carregando') return <Carregando />
  if (estado.tipo === 'erro') {
    return estado.erro instanceof ErroApi && estado.erro.status === 404 ? <NaoEncontrada /> : <MensagemErro mensagem={estado.mensagem} />
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="text-center">
        <p className="text-5xl" aria-hidden="true">
          🎟️
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white">Compra confirmada!</h1>
        <p className="text-zinc-400">Apresente o código abaixo na entrada da sala e na lanchonete.</p>
      </div>
      <IngressoVirtual pedido={estado.dados} />
      <div className="flex flex-wrap justify-center gap-3">
        <Link to="/conta" className={botao}>
          Meus ingressos
        </Link>
        <Link to="/" className={botaoSecundario}>
          Ver mais filmes
        </Link>
      </div>
    </div>
  )
}
