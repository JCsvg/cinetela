const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const diaExtenso = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
const diaCurto = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })
const hora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })
const dataHora = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

/** 32 vira "R$ 32,00". */
export function formatarMoeda(valor: number): string {
  return moeda.format(valor)
}

/** "2026-10-23T19:00:00-03:00" vira "19:00". */
export function formatarHora(iso: string): string {
  return hora.format(new Date(iso))
}

/** "sexta-feira, 23 de outubro" */
export function formatarDia(iso: string): string {
  return diaExtenso.format(new Date(iso))
}

/** "sex., 23/10" */
export function formatarDiaCurto(iso: string): string {
  return diaCurto.format(new Date(iso))
}

/** "23/10 19:00" */
export function formatarDataHora(iso: string): string {
  return dataHora.format(new Date(iso))
}

/** 125 vira "2h05". */
export function formatarDuracao(minutos: number): string {
  const h = Math.floor(minutos / 60)
  const m = String(minutos % 60).padStart(2, '0')
  return h === 0 ? `${minutos} min` : `${h}h${m}`
}

/** Os próximos `quantos` dias, começando em hoje, como "2026-10-23". Usa o dia local do navegador. */
export function proximosDias(quantos: number): string[] {
  return Array.from({ length: quantos }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const mes = String(d.getMonth() + 1).padStart(2, '0')
    const dia = String(d.getDate()).padStart(2, '0')
    return `${d.getFullYear()}-${mes}-${dia}`
  })
}

/** "2026-10-23" vira "sex., 23/10" (meio-dia evita o salto de fuso). */
export function formatarDiaDoFiltro(dia: string): string {
  return diaCurto.format(new Date(`${dia}T12:00:00`))
}

const paraInput = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

/**
 * "2026-10-23T19:00:00-03:00" vira "2026-10-23T19:00", o formato do
 * <input type="datetime-local">, sempre no horário de Brasília.
 */
export function paraInputLocal(iso: string): string {
  return paraInput.format(new Date(iso)).replace(' ', 'T')
}
