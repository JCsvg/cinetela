export type Cinema = {
  id: number
  nome: string
  cidade: string
  endereco: string
  imagem: string
}

export type DadosCinema = Omit<Cinema, 'id'>

export type Sala = {
  id: number
  cinemaId: number
  nome: string
  fileiras: number
  assentosPorFileira: number
  capacidade: number
}

export type DadosSala = Pick<Sala, 'nome' | 'fileiras' | 'assentosPorFileira'>
