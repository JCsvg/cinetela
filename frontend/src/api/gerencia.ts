import type { DadosSala, Sala } from '../types/cinema'
import type { DadosExibicao, Exibicao } from '../types/exibicao'
import type { DadosProduto, Produto } from '../types/produto'
import type { Vendas } from '../types/pedido'
import { requisitar } from './cliente'

const base = (cinemaId: number) => `/api/gerencia/cinemas/${cinemaId}`

export function listarSalas(cinemaId: number, sinal?: AbortSignal): Promise<Sala[]> {
  return requisitar<Sala[]>(`${base(cinemaId)}/salas`, { sinal })
}
export function criarSala(cinemaId: number, dados: DadosSala): Promise<Sala> {
  return requisitar<Sala>(`${base(cinemaId)}/salas`, { metodo: 'POST', corpo: dados })
}
export function atualizarSala(id: number, dados: DadosSala): Promise<Sala> {
  return requisitar<Sala>(`/api/gerencia/salas/${id}`, { metodo: 'PUT', corpo: dados })
}
export function apagarSala(id: number): Promise<void> {
  return requisitar<void>(`/api/gerencia/salas/${id}`, { metodo: 'DELETE' })
}

export function listarExibicoes(cinemaId: number, sinal?: AbortSignal): Promise<Exibicao[]> {
  return requisitar<Exibicao[]>(`${base(cinemaId)}/exibicoes`, { sinal })
}
export function criarExibicao(cinemaId: number, dados: DadosExibicao): Promise<Exibicao> {
  return requisitar<Exibicao>(`${base(cinemaId)}/exibicoes`, { metodo: 'POST', corpo: dados })
}
export function atualizarExibicao(id: number, dados: DadosExibicao): Promise<Exibicao> {
  return requisitar<Exibicao>(`/api/gerencia/exibicoes/${id}`, { metodo: 'PUT', corpo: dados })
}
export function apagarExibicao(id: number): Promise<void> {
  return requisitar<void>(`/api/gerencia/exibicoes/${id}`, { metodo: 'DELETE' })
}

export function listarProdutos(cinemaId: number, sinal?: AbortSignal): Promise<Produto[]> {
  return requisitar<Produto[]>(`${base(cinemaId)}/produtos`, { sinal })
}
export function criarProduto(cinemaId: number, dados: DadosProduto): Promise<Produto> {
  return requisitar<Produto>(`${base(cinemaId)}/produtos`, { metodo: 'POST', corpo: dados })
}
export function atualizarProduto(id: number, dados: DadosProduto): Promise<Produto> {
  return requisitar<Produto>(`/api/gerencia/produtos/${id}`, { metodo: 'PUT', corpo: dados })
}
export function apagarProduto(id: number): Promise<void> {
  return requisitar<void>(`/api/gerencia/produtos/${id}`, { metodo: 'DELETE' })
}

export function buscarVendas(cinemaId: number, sinal?: AbortSignal): Promise<Vendas> {
  return requisitar<Vendas>(`${base(cinemaId)}/vendas`, { sinal })
}
