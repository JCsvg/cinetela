// Gera public/demo/dados.json, os dados fixos do modo demonstração (GitHub Pages), lendo a API local.
//
// Uso (com o projeto rodando e o banco recém-criado):  npm run demo:gerar  [http://localhost:8000]
//
// As datas saem relativas ao dia de hoje ("dia 2 às 14:00"), e o front as refaz a partir da data de quem abre
// a página. As 16 sessões do seed se repetem todos os dias, então os dias que faltarem (as sessões de hoje que
// já passaram, por exemplo) são completados copiando o mesmo horário de outro dia.
import { mkdirSync, writeFileSync } from 'node:fs'

const API = process.argv[2] ?? 'http://localhost:8000'
const DIAS = 7

async function get(caminho) {
  const resposta = await fetch(API + caminho)
  if (!resposta.ok) throw new Error(`${caminho}: ${resposta.status}`)
  return resposta.json()
}

const formatoDia = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' })
const dia = (texto) => {
  const [a, m, d] = texto.split('-').map(Number)
  return Math.round(Date.UTC(a, m - 1, d) / 86400000)
}
const hoje = dia(formatoDia.format(new Date()))

const pagina = await get('/api/filmes?porPagina=50')
const filmes = pagina.dados.map(({ estreia, emCartaz, ...resto }) => ({ ...resto, estreiaDia: dia(estreia) - hoje }))
const cinemas = await get('/api/cinemas')

const produtos = {}
for (const c of cinemas) produtos[c.id] = await get(`/api/cinemas/${c.id}/produtos`)

// Todas as sessões que a API conhece, com o mapa de assentos de cada uma
const capturadas = []
for (const f of filmes) {
  for (const grupo of await get(`/api/filmes/${f.id}/exibicoes`)) {
    for (const h of grupo.exibicoes) {
      const mapa = await get(`/api/exibicoes/${h.id}/assentos`)
      const e = mapa.exibicao
      capturadas.push({
        id: e.id,
        filmeId: e.filme.id,
        dia: dia(e.iniciaEm.slice(0, 10)) - hoje,
        hora: e.iniciaEm.slice(11, 16),
        cinema: e.cinema,
        sala: e.sala,
        precoInteira: e.precoInteira,
        idioma: e.idioma,
        formato: e.formato,
        fileiras: mapa.fileiras,
        ocupados: mapa.ocupados,
      })
    }
  }
}

// Completa os dias 0 a 6 de cada "modelo" (filme, sala e horário)
const exibicoes = [...capturadas]
let proximoId = Math.max(...capturadas.map((e) => e.id)) + 1
const modelos = new Map()
for (const e of capturadas) modelos.set(`${e.filmeId}|${e.sala.id}|${e.hora}`, e)
for (const [chave, modelo] of modelos) {
  for (let d = 0; d < DIAS; d++) {
    if (!capturadas.some((e) => `${e.filmeId}|${e.sala.id}|${e.hora}` === chave && e.dia === d)) {
      exibicoes.push({ ...modelo, id: proximoId++, dia: d, ocupados: [] })
    }
  }
}
exibicoes.sort((a, b) => a.id - b.id)

mkdirSync('public/demo', { recursive: true })
writeFileSync('public/demo/dados.json', JSON.stringify({ filmes, cinemas, produtos, exibicoes }))
console.log(`public/demo/dados.json: ${filmes.length} filmes, ${cinemas.length} cinemas, ${exibicoes.length} sessões`)
