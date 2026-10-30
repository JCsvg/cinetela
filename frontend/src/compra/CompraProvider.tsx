import { useEffect, useReducer, type ReactNode } from 'react'
import { compraReducer, compraVazia, type Compra } from './reducer'
import { CompraContext } from './useCompra'

const CHAVE = 'cine.compra'

/** Recarregar a página no meio da compra não perde os assentos e a lanchonete. */
function lerSalva(): Compra {
  try {
    const texto = sessionStorage.getItem(CHAVE)
    return texto === null ? compraVazia : (JSON.parse(texto) as Compra)
  } catch {
    return compraVazia
  }
}

export default function CompraProvider({ children }: { children: ReactNode }) {
  const [compra, dispatch] = useReducer(compraReducer, undefined, lerSalva)

  useEffect(() => {
    try {
      sessionStorage.setItem(CHAVE, JSON.stringify(compra))
    } catch {
      // Navegador sem sessionStorage: a compra só vale enquanto a página está aberta
    }
  }, [compra])

  return <CompraContext value={{ compra, dispatch }}>{children}</CompraContext>
}
