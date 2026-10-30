export type Papel = 'cliente' | 'cinema' | 'admin'

export type Usuario = {
  id: number
  nome: string
  email: string
  papel: Papel
  /** Só o gerente (papel 'cinema') tem cinema; os outros ficam com null. */
  cinemaId: number | null
}
