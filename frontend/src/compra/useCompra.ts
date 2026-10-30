import { createContext, useContext, type Dispatch } from 'react'
import type { Acao, Compra } from './reducer'

export type ValorCompra = {
  compra: Compra
  dispatch: Dispatch<Acao>
}

export const CompraContext = createContext<ValorCompra | null>(null)

export function useCompra(): ValorCompra {
  const valor = useContext(CompraContext)
  if (valor === null) {
    throw new Error('useCompra precisa estar dentro de <CompraProvider>')
  }
  return valor
}
