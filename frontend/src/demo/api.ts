import { ErroApi } from '../api/erro'
import type { Pagina } from '../types/api'
import type { Cinema } from '../types/cinema'
import type { Exibicao, GrupoDeHorarios, HorarioDoFilme, MapaDeAssentos } from '../types/exibicao'
import type { Filme } from '../types/filme'
import type { Produto } from '../types/produto'

/**
 * Modo demonstração (GitHub Pages): não existe API. O `requisitar` entrega o pedido a este adaptador, que
 * responde com o mesmo formato da API de verdade, só que lendo `public/demo/dados.json` (gerado por
 * `npm run demo:gerar` a partir da API local). Só as consultas de leitura existem; entrar e comprar não.
 *
 * Ligado apenas com VITE_DEMO=1 no build. Rodando local, esta função nunca é chamada.
 */
export const MODO_DEMO = import.meta.env.VITE_DEMO === '1'

// As datas do arquivo são relativas ao dia em que ele foi gerado ("dia 2 às 14:00"), então a demonstração
// sempre mostra sessões dos próximos 7 dias, não importa quando alguém a abra.
type FilmeDemo = Omit<Filme, 'estreia' | 'emCartaz'> & { estreiaDia: number }

type ExibicaoDemo = {
  id: number
  filmeId: number
  dia: number
  hora: string
  cinema: Exibicao['cinema']
  sala: Exibicao['sala']
  precoInteira: number
  idioma: Exibicao['idioma']
  formato: Exibicao['formato']
  fileiras: string[]
  ocupados: string[]
}

type Dados = {
  filmes: FilmeDemo[]
  cinemas: Cinema[]
  produtos: Record<string, Produto[]>
  exibicoes: ExibicaoDemo[]
}

let carregados: Promise<Dados> | null = null

function dados(): Promise<Dados> {
  carregados ??= fetch(`${import.meta.env.BASE_URL}demo/dados.json`).then((r) => r.json() as Promise<Dados>)
  return carregados
}

const formatoDia = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** A data de hoje em Brasília somada a `dias`, como "2026-10-30". */
function dataEm(dias: number): string {
  const [ano, mes, dia] = formatoDia.format(new Date()).split('-').map(Number)
  return new Date(Date.UTC(ano, mes - 1, dia + dias)).toISOString().slice(0, 10)
}

function inicioDe(e: ExibicaoDemo): string {
  return `${dataEm(e.dia)}T${e.hora}:00-03:00`
}

function emBreve(e: ExibicaoDemo): boolean {
  return new Date(inicioDe(e)).getTime() > Date.now()
}

function montarExibicao(e: ExibicaoDemo, d: Dados): Exibicao {
  const filme = d.filmes.find((f) => f.id === e.filmeId)
  if (filme === undefined) {
    throw new ErroApi(404, { erro: 'Filme não encontrado' })
  }
  return {
    id: e.id,
    filme: {
      id: filme.id,
      titulo: filme.titulo,
      poster: filme.poster,
      duracaoMin: filme.duracaoMin,
      classificacao: filme.classificacao,
    },
    cinema: e.cinema,
    sala: e.sala,
    iniciaEm: inicioDe(e),
    precoInteira: e.precoInteira,
    precoMeia: Math.round((e.precoInteira / 2) * 100) / 100,
    idioma: e.idioma,
    formato: e.formato,
    assentosLivres: e.sala.fileiras * e.sala.assentosPorFileira - e.ocupados.length,
  }
}

/** Inteiro de um parâmetro da query dentro de [min, max]; inválido cai no padrão (como o back). */
function inteiro(valor: string | null, padrao: number, min: number, max: number): number {
  if (valor === null || !/^(0|[1-9]\d*)$/.test(valor)) return padrao
  const n = Number(valor)
  return n >= min && n <= max ? n : padrao
}

function listarFilmes(d: Dados, q: URLSearchParams): Pagina<Filme> {
  const genero = (q.get('genero') ?? '').trim().toLowerCase()
  const busca = (q.get('busca') ?? '').trim().toLowerCase()
  const soEmCartaz = ['1', 'true'].includes((q.get('emCartaz') ?? '').trim())
  const pagina = inteiro(q.get('pagina'), 1, 1, Number.MAX_SAFE_INTEGER)
  const porPagina = inteiro(q.get('porPagina'), 8, 1, 50)

  const emCartaz = new Set(d.exibicoes.filter(emBreve).map((e) => e.filmeId))
  const filtrados = d.filmes
    .filter((f) => genero === '' || f.genero.toLowerCase() === genero)
    .filter((f) => busca === '' || `${f.titulo} ${f.sinopse}`.toLowerCase().includes(busca))
    .filter((f) => !soEmCartaz || emCartaz.has(f.id))
    .sort((a, b) => b.estreiaDia - a.estreiaDia || b.id - a.id)

  const pedaco = filtrados.slice((pagina - 1) * porPagina, pagina * porPagina)
  return {
    dados: pedaco.map(({ estreiaDia, ...resto }) => ({
      ...resto,
      estreia: dataEm(estreiaDia),
      emCartaz: emCartaz.has(resto.id),
    })),
    pagina,
    porPagina,
    total: filtrados.length,
    totalPaginas: Math.max(1, Math.ceil(filtrados.length / porPagina)),
  }
}

function horariosDoFilme(d: Dados, filmeId: number, q: URLSearchParams): GrupoDeHorarios[] {
  const data = (q.get('data') ?? '').trim()
  if (data !== '' && !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    throw new ErroApi(422, {
      erro: 'Alguns campos estão inválidos',
      campos: { data: 'Use uma data no formato AAAA-MM-DD.' },
    })
  }
  const cidade = (q.get('cidade') ?? '').trim().toLowerCase()

  const sessoes = d.exibicoes
    .filter((e) => e.filmeId === filmeId && emBreve(e))
    .filter((e) => cidade === '' || e.cinema.cidade.toLowerCase() === cidade)
    .filter((e) => data === '' || dataEm(e.dia) === data)
    .sort((a, b) => a.cinema.nome.localeCompare(b.cinema.nome) || inicioDe(a).localeCompare(inicioDe(b)))

  const grupos = new Map<number, GrupoDeHorarios>()
  for (const e of sessoes) {
    const cinema = d.cinemas.find((c) => c.id === e.cinema.id)
    if (cinema === undefined) continue
    const grupo = grupos.get(cinema.id) ?? { cinema, exibicoes: [] }
    const horario: HorarioDoFilme = {
      id: e.id,
      iniciaEm: inicioDe(e),
      sala: e.sala.nome,
      idioma: e.idioma,
      formato: e.formato,
      precoInteira: e.precoInteira,
      assentosLivres: e.sala.fileiras * e.sala.assentosPorFileira - e.ocupados.length,
    }
    grupo.exibicoes.push(horario)
    grupos.set(cinema.id, grupo)
  }
  return [...grupos.values()]
}

/** Responde como a API responderia. Só GET de leitura; o resto avisa que é uma demonstração. */
export async function responderDemo<T>(caminho: string, metodo: string): Promise<T> {
  const url = new URL(caminho, 'http://demo')
  const rota = url.pathname
  const q = url.searchParams

  if (metodo !== 'GET' || /^\/api\/(auth|pedidos|meus-pedidos|gerencia|admin)/.test(rota)) {
    throw new ErroApi(503, {
      erro: 'Modo demonstração: dá para navegar e escolher assentos, mas entrar e comprar só rodando o projeto localmente.',
    })
  }

  const d = await dados()
  const resposta = (valor: unknown) => valor as T

  if (rota === '/api/filmes') {
    return resposta(listarFilmes(d, q))
  }

  const umFilme = rota.match(/^\/api\/filmes\/(\d+)$/)
  if (umFilme !== null) {
    const f = listarFilmes(d, new URLSearchParams({ porPagina: '50' })).dados.find((x) => x.id === Number(umFilme[1]))
    if (f === undefined) throw new ErroApi(404, { erro: 'Filme não encontrado' })
    return resposta(f)
  }

  const horarios = rota.match(/^\/api\/filmes\/(\d+)\/exibicoes$/)
  if (horarios !== null) {
    if (!d.filmes.some((f) => f.id === Number(horarios[1]))) throw new ErroApi(404, { erro: 'Filme não encontrado' })
    return resposta(horariosDoFilme(d, Number(horarios[1]), q))
  }

  if (rota === '/api/generos') {
    return resposta([...new Set(d.filmes.map((f) => f.genero))].sort((a, b) => a.localeCompare(b, 'pt')))
  }

  if (rota === '/api/cinemas') {
    const cidade = (q.get('cidade') ?? '').trim().toLowerCase()
    return resposta(
      d.cinemas
        .filter((c) => cidade === '' || c.cidade.toLowerCase() === cidade)
        .sort((a, b) => a.cidade.localeCompare(b.cidade, 'pt') || a.nome.localeCompare(b.nome, 'pt')),
    )
  }

  if (rota === '/api/cidades') {
    return resposta([...new Set(d.cinemas.map((c) => c.cidade))].sort((a, b) => a.localeCompare(b, 'pt')))
  }

  const produtos = rota.match(/^\/api\/cinemas\/(\d+)\/produtos$/)
  if (produtos !== null) {
    if (!d.cinemas.some((c) => c.id === Number(produtos[1]))) throw new ErroApi(404, { erro: 'Cinema não encontrado' })
    return resposta((d.produtos[produtos[1]] ?? []).filter((p) => p.ativo))
  }

  const assentos = rota.match(/^\/api\/exibicoes\/(\d+)\/assentos$/)
  if (assentos !== null) {
    const e = d.exibicoes.find((x) => x.id === Number(assentos[1]))
    if (e === undefined) throw new ErroApi(404, { erro: 'Exibição não encontrada' })
    const mapa: MapaDeAssentos = { exibicao: montarExibicao(e, d), fileiras: e.fileiras, ocupados: e.ocupados }
    return resposta(mapa)
  }

  throw new ErroApi(404, { erro: 'Rota não encontrada' })
}
