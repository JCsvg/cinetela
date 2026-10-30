// Classes do Tailwind repetidas em vários componentes ficam aqui, num lugar só.
// (O Tailwind acha as classes lendo o texto dos arquivos, então estas funcionam.)

export const entrada =
  'w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 placeholder:text-zinc-500 focus:border-marca-500 focus:ring-2 focus:ring-marca-500/30 focus:outline-none aria-invalid:border-red-500 disabled:opacity-50'

export const botao =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-marca-600 px-5 py-2.5 font-medium text-white transition hover:bg-marca-500 disabled:cursor-not-allowed disabled:opacity-50'

export const botaoSecundario =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50'

export const botaoPerigo =
  'inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium text-red-400 transition hover:bg-red-950/60 disabled:opacity-50'

export const cartao = 'rounded-xl border border-zinc-800 bg-zinc-900/70 p-5'
