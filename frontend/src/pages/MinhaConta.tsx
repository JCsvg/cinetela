import { useState } from 'react'
import { cancelarPedido, listarMeusPedidos } from '../api/compra'
import { mensagemDe } from '../api/cliente'
import { useAuth } from '../auth/useAuth'
import Carregando from '../components/Carregando'
import IngressoVirtual from '../components/IngressoVirtual'
import MensagemErro from '../components/MensagemErro'
import { useApi } from '../hooks/useApi'
import { botaoPerigo, cartao } from '../utils/estilos'

const nomeDoPapel = { cliente: 'Cliente', cinema: 'Gerente de cinema', admin: 'Administrador' }

export default function MinhaConta() {
  const { usuario } = useAuth()
  const { estado, recarregar } = useApi(listarMeusPedidos)
  const [erro, setErro] = useState<string | null>(null)
  const [cancelando, setCancelando] = useState<number | null>(null)

  async function cancelar(id: number) {
    if (!window.confirm('Cancelar este pedido? Os assentos voltam a ficar livres.')) {
      return
    }
    setErro(null)
    setCancelando(id)
    try {
      await cancelarPedido(id)
      recarregar()
    } catch (e) {
      setErro(mensagemDe(e))
    } finally {
      setCancelando(null)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <section className={`${cartao} flex flex-wrap items-center justify-between gap-4`}>
        <div>
          <h1 className="text-2xl font-bold text-white">{usuario?.nome}</h1>
          <p className="text-zinc-400">{usuario?.email}</p>
        </div>
        {usuario !== null && (
          <span className="rounded-full bg-zinc-800 px-3 py-1 text-sm text-zinc-300">{nomeDoPapel[usuario.papel]}</span>
        )}
      </section>

      <section className="flex flex-col gap-4" aria-labelledby="titulo-ingressos">
        <h2 id="titulo-ingressos" className="text-2xl font-bold text-white">
          Meus ingressos
        </h2>
        {erro !== null && <MensagemErro mensagem={erro} />}
        {estado.tipo === 'carregando' && <Carregando />}
        {estado.tipo === 'erro' && <MensagemErro mensagem={estado.mensagem} />}
        {estado.tipo === 'pronto' &&
          (estado.dados.length === 0 ? (
            <p className="py-8 text-center text-zinc-500">Você ainda não comprou nenhum ingresso.</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {estado.dados.map((pedido) => (
                <li key={pedido.id}>
                  <IngressoVirtual pedido={pedido} />
                  {pedido.podeCancelar && (
                    <div className="mt-1 text-right">
                      <button type="button" disabled={cancelando === pedido.id} onClick={() => cancelar(pedido.id)} className={botaoPerigo}>
                        {cancelando === pedido.id ? 'Cancelando...' : 'Cancelar pedido'}
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ))}
      </section>
    </div>
  )
}
