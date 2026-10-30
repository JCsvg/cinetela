import { useCallback } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ErroApi } from '../api/cliente'
import { buscarAssentos } from '../api/compra'
import Carregando from '../components/Carregando'
import MapaAssentos from '../components/MapaAssentos'
import MensagemErro from '../components/MensagemErro'
import ResumoDaCompra from '../components/ResumoDaCompra'
import { codigoDoAssento, MAX_INGRESSOS, type Compra } from '../compra/reducer'
import { useCompra } from '../compra/useCompra'
import { useApi } from '../hooks/useApi'
import { botao, cartao, entrada } from '../utils/estilos'
import { formatarMoeda } from '../utils/formatar'
import NaoEncontrada from './NaoEncontrada'

export default function Assentos() {
  const { id } = useParams()
  const exibicaoId = Number(id)
  const navigate = useNavigate()
  const { compra, dispatch } = useCompra()

  const buscar = useCallback((sinal: AbortSignal) => buscarAssentos(exibicaoId, sinal), [exibicaoId])
  const { estado } = useApi(buscar)

  if (estado.tipo === 'carregando') return <Carregando texto="Montando a sala..." />
  if (estado.tipo === 'erro') {
    return estado.erro instanceof ErroApi && estado.erro.status === 404 ? (
      <NaoEncontrada />
    ) : (
      <MensagemErro mensagem={estado.mensagem} />
    )
  }

  const { exibicao, fileiras, ocupados } = estado.dados
  // A compra guardada pode ser de outra exibição: neste caso a escolha daqui recomeça
  const atual: Compra = compra.exibicao?.id === exibicao.id ? compra : { exibicao, ingressos: [], itens: [] }
  const jaComecou = new Date(exibicao.iniciaEm) <= new Date()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to={`/filmes/${exibicao.filme.id}`} className="text-sm text-marca-400 hover:underline">
          Voltar para as sessões
        </Link>
        <h1 className="mt-1 text-3xl font-bold text-white">Escolha seus assentos</h1>
        <p className="text-zinc-400">
          Até {MAX_INGRESSOS} ingressos por compra · inteira {formatarMoeda(exibicao.precoInteira)} · meia{' '}
          {formatarMoeda(exibicao.precoMeia)}
        </p>
      </div>

      {jaComecou && <MensagemErro mensagem="Esta sessão já começou." />}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="flex flex-col gap-6">
          <div className={cartao}>
            <MapaAssentos
              fileiras={fileiras}
              assentosPorFileira={exibicao.sala.assentosPorFileira}
              ocupados={ocupados}
              escolhidos={atual.ingressos}
              aoAlternar={(assento) => dispatch({ tipo: 'alternarAssento', exibicao, assento })}
            />
          </div>

          {atual.ingressos.length > 0 && (
            <div className={cartao}>
              <h2 className="mb-3 font-semibold text-white">Tipo de cada ingresso</h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {atual.ingressos.map((i) => (
                  <li key={codigoDoAssento(i)} className="flex items-center justify-between gap-3">
                    <label htmlFor={`tipo-${codigoDoAssento(i)}`} className="font-medium">
                      Assento {codigoDoAssento(i)}
                    </label>
                    <select
                      id={`tipo-${codigoDoAssento(i)}`}
                      value={i.tipo}
                      onChange={(e) =>
                        dispatch({
                          tipo: 'mudarTipo',
                          assento: i,
                          tipoIngresso: e.target.value === 'meia' ? 'meia' : 'inteira',
                        })
                      }
                      className={`${entrada} w-auto`}
                    >
                      <option value="inteira">Inteira</option>
                      <option value="meia">Meia-entrada</option>
                    </select>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <ResumoDaCompra compra={atual}>
          <button
            type="button"
            disabled={atual.ingressos.length === 0 || jaComecou}
            onClick={() => navigate('/lanchonete')}
            className={botao}
          >
            Continuar para a lanchonete
          </button>
        </ResumoDaCompra>
      </div>
    </div>
  )
}
