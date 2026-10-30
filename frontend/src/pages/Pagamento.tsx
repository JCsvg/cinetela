import { useState, type ChangeEvent, type SubmitEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { ErroApi, mensagemDe } from '../api/cliente'
import { criarPedido } from '../api/compra'
import Campo from '../components/Campo'
import MensagemErro from '../components/MensagemErro'
import ResumoDaCompra from '../components/ResumoDaCompra'
import { totalGeral } from '../compra/reducer'
import { useCompra } from '../compra/useCompra'
import type { DadosPagamento } from '../types/pedido'
import { botao, cartao, entrada } from '../utils/estilos'
import { formatarMoeda } from '../utils/formatar'

type Erros = Partial<Record<keyof DadosPagamento, string>>

function validar(d: DadosPagamento): Erros {
  const erros: Erros = {}
  if (d.titular.trim().length < 3) erros.titular = 'Informe o nome como está no cartão.'
  if (!/^\d{16}$/.test(d.numero.replace(/\s/g, ''))) erros.numero = 'O número do cartão tem 16 dígitos.'
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(d.validade)) erros.validade = 'Use o formato MM/AA.'
  if (!/^\d{3,4}$/.test(d.cvv)) erros.cvv = 'O código de segurança tem 3 ou 4 dígitos.'
  return erros
}

export default function Pagamento() {
  const { compra, dispatch } = useCompra()
  const navigate = useNavigate()
  const [campos, setCampos] = useState<DadosPagamento>({ titular: '', numero: '', validade: '', cvv: '' })
  const [erros, setErros] = useState<Erros>({})
  const [erroGeral, setErroGeral] = useState<string | null>(null)
  const [conflito, setConflito] = useState(false)
  const [enviando, setEnviando] = useState(false)
  // Depois de pagar, a compra é limpa antes da navegação terminar: sem este estado, a guarda
  // abaixo veria a compra vazia e mandaria para "/" em vez de ir para o ingresso.
  const [finalizado, setFinalizado] = useState(false)

  if (finalizado) {
    return null
  }
  if (compra.exibicao === null || compra.ingressos.length === 0) {
    return <Navigate to="/" replace />
  }
  const exibicao = compra.exibicao

  function mudar(evento: ChangeEvent<HTMLInputElement>) {
    const { name, value } = evento.target
    // Número do cartão em blocos de 4: "4111 1111 1111 1111"
    const formatado = name === 'numero' ? value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ') : value
    setCampos((anterior) => ({ ...anterior, [name]: formatado }))
  }

  async function enviar(evento: SubmitEvent<HTMLFormElement>) {
    evento.preventDefault()
    const errosLocais = validar(campos)
    setErros(errosLocais)
    setErroGeral(null)
    setConflito(false)
    if (Object.keys(errosLocais).length > 0) {
      return
    }

    setEnviando(true)
    try {
      const pedido = await criarPedido({
        exibicaoId: exibicao.id,
        ingressos: compra.ingressos,
        itens: compra.itens.map((i) => ({ produtoId: i.produto.id, quantidade: i.quantidade })),
        pagamento: campos,
      })
      setFinalizado(true)
      dispatch({ tipo: 'limpar' })
      navigate(`/pedidos/${pedido.id}`, { replace: true })
    } catch (erro) {
      if (erro instanceof ErroApi && erro.status === 422) {
        // As chaves do servidor são "pagamento.numero", "ingressos", "itens"...
        const dosCampos: Erros = {}
        for (const campo of ['titular', 'numero', 'validade', 'cvv'] as const) {
          const mensagem = erro.campos[`pagamento.${campo}`]
          if (mensagem !== undefined) dosCampos[campo] = mensagem
        }
        setErros(dosCampos)
        const outros = Object.entries(erro.campos).filter(([chave]) => !chave.startsWith('pagamento.'))
        if (outros.length > 0) setErroGeral(outros.map(([, m]) => m).join(' '))
      } else {
        setErroGeral(mensagemDe(erro))
        setConflito(erro instanceof ErroApi && erro.status === 409)
      }
    } finally {
      setEnviando(false)
    }
  }

  const atributos = (campo: keyof DadosPagamento) =>
    erros[campo] !== undefined ? { 'aria-invalid': true, 'aria-describedby': `${campo}-erro` } : {}

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to="/lanchonete" className="text-sm text-marca-400 hover:underline">
          Voltar para a lanchonete
        </Link>
        <h1 className="mt-1 text-3xl font-bold text-white">Pagamento</h1>
        <p className="text-zinc-400">Ambiente de estudo: nenhum cartão é cobrado nem guardado. Use 4111 1111 1111 1111.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_22rem]">
        <form onSubmit={enviar} noValidate className={`${cartao} flex flex-col gap-4`}>
          {erroGeral !== null && <MensagemErro mensagem={erroGeral} />}
          {conflito && (
            <Link to={`/sessoes/${exibicao.id}/assentos`} className="text-sm text-marca-400 underline">
              Escolher outros assentos
            </Link>
          )}

          <Campo id="titular" rotulo="Nome no cartão" erro={erros.titular}>
            <input id="titular" name="titular" autoComplete="cc-name" value={campos.titular} onChange={mudar} className={entrada} {...atributos('titular')} />
          </Campo>
          <Campo id="numero" rotulo="Número do cartão" erro={erros.numero}>
            <input id="numero" name="numero" inputMode="numeric" autoComplete="cc-number" placeholder="0000 0000 0000 0000" value={campos.numero} onChange={mudar} className={entrada} {...atributos('numero')} />
          </Campo>
          <div className="grid grid-cols-2 gap-4">
            <Campo id="validade" rotulo="Validade" erro={erros.validade} dica="MM/AA">
              <input id="validade" name="validade" autoComplete="cc-exp" placeholder="12/30" maxLength={5} value={campos.validade} onChange={mudar} className={entrada} {...atributos('validade')} />
            </Campo>
            <Campo id="cvv" rotulo="Código (CVV)" erro={erros.cvv}>
              <input id="cvv" name="cvv" inputMode="numeric" autoComplete="cc-csc" maxLength={4} value={campos.cvv} onChange={mudar} className={entrada} {...atributos('cvv')} />
            </Campo>
          </div>

          <button type="submit" disabled={enviando} className={botao}>
            {enviando ? 'Processando...' : `Pagar ${formatarMoeda(totalGeral(compra))}`}
          </button>
        </form>

        <ResumoDaCompra compra={compra} />
      </div>
    </div>
  )
}
