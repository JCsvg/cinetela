import type { MapaDeAssentos } from '../types/exibicao'
import type { NovoPedido, Pedido } from '../types/pedido'
import type { Produto } from '../types/produto'
import { requisitar } from './cliente'

export function buscarAssentos(exibicaoId: number, sinal?: AbortSignal): Promise<MapaDeAssentos> {
  return requisitar<MapaDeAssentos>(`/api/exibicoes/${exibicaoId}/assentos`, { sinal })
}

export function listarProdutosDoCinema(cinemaId: number, sinal?: AbortSignal): Promise<Produto[]> {
  return requisitar<Produto[]>(`/api/cinemas/${cinemaId}/produtos`, { sinal })
}

export function criarPedido(pedido: NovoPedido): Promise<Pedido> {
  return requisitar<Pedido>('/api/pedidos', { metodo: 'POST', corpo: pedido })
}

export function buscarPedido(id: number, sinal?: AbortSignal): Promise<Pedido> {
  return requisitar<Pedido>(`/api/pedidos/${id}`, { sinal })
}

export function listarMeusPedidos(sinal?: AbortSignal): Promise<Pedido[]> {
  return requisitar<Pedido[]>('/api/meus-pedidos', { sinal })
}

export function cancelarPedido(id: number): Promise<Pedido> {
  return requisitar<Pedido>(`/api/pedidos/${id}`, { metodo: 'DELETE' })
}
