import { useCallback, useEffect, useState } from 'react'
import { mensagemDe } from '../api/cliente'

type Resultado<T> = { buscar: unknown; dados?: T; erro?: unknown; falhou: boolean }

export type EstadoApi<T> =
  | { tipo: 'carregando' }
  | { tipo: 'erro'; mensagem: string; erro: unknown }
  | { tipo: 'pronto'; dados: T }

/**
 * Busca dados quando o componente aparece (e quando `buscar` muda) e entrega
 * o estado pronto para um switch: carregando, erro ou pronto.
 *
 * `buscar` precisa ser estável: use useCallback no componente, com as
 * dependências certas, senão a busca roda a cada renderização.
 *
 * Devolve também `recarregar()`, para buscar de novo depois de criar, editar
 * ou apagar. Durante o recarregamento os dados antigos continuam na tela.
 */
export function useApi<T>(buscar: (sinal: AbortSignal) => Promise<T>): {
  estado: EstadoApi<T>
  recarregar: () => void
} {
  const [resultado, setResultado] = useState<Resultado<T> | null>(null)
  const [versao, setVersao] = useState(0)

  useEffect(() => {
    const controle = new AbortController()
    buscar(controle.signal)
      .then((dados) => setResultado({ buscar, dados, falhou: false }))
      .catch((erro: unknown) => {
        if (!controle.signal.aborted) setResultado({ buscar, erro, falhou: true })
      })
    return () => controle.abort()
  }, [buscar, versao])

  const recarregar = useCallback(() => setVersao((v) => v + 1), [])

  // Resultado de outra busca (ex.: o filtro mudou) conta como "ainda carregando"
  if (resultado === null || resultado.buscar !== buscar) {
    return { estado: { tipo: 'carregando' }, recarregar }
  }
  if (resultado.falhou) {
    return { estado: { tipo: 'erro', mensagem: mensagemDe(resultado.erro), erro: resultado.erro }, recarregar }
  }
  return { estado: { tipo: 'pronto', dados: resultado.dados as T }, recarregar }
}
