import { useCallback } from 'react'
import { Outlet, useParams } from 'react-router'
import { useAuth } from '../../auth/useAuth'
import Abas from '../../components/Abas'
import Carregando from '../../components/Carregando'
import MensagemErro from '../../components/MensagemErro'
import { useApi } from '../../hooks/useApi'
import { listarCinemas } from '../../api/filmes'

/** Moldura do painel de UM cinema: nome, abas e a aba atual no <Outlet />. */
export default function GerenciaLayout() {
  const { cinemaId } = useParams()
  const id = Number(cinemaId)
  const { usuario } = useAuth()
  const buscar = useCallback((sinal: AbortSignal) => listarCinemas(sinal), [])
  const { estado } = useApi(buscar)

  // O back também confere (403); aqui só evitamos mostrar um painel que não vai funcionar
  const pode = usuario?.papel === 'admin' || (usuario?.papel === 'cinema' && usuario.cinemaId === id)
  if (!pode) {
    return <MensagemErro mensagem="Você não gerencia este cinema." />
  }
  if (estado.tipo === 'carregando') return <Carregando />
  if (estado.tipo === 'erro') return <MensagemErro mensagem={estado.mensagem} />

  const cinema = estado.dados.find((c) => c.id === id)
  if (cinema === undefined) {
    return <MensagemErro mensagem="Cinema não encontrado." />
  }

  const base = `/gerencia/${id}`
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm tracking-widest text-ouro uppercase">Painel do cinema</p>
        <h1 className="text-3xl font-bold text-white">{cinema.nome}</h1>
        <p className="text-zinc-400">{cinema.endereco}, {cinema.cidade}</p>
      </div>
      <Abas
        abas={[
          { para: base, rotulo: 'Vendas', fim: true },
          { para: `${base}/exibicoes`, rotulo: 'Exibições' },
          { para: `${base}/salas`, rotulo: 'Salas' },
          { para: `${base}/lanchonete`, rotulo: 'Lanchonete' },
        ]}
      />
      <Outlet />
    </div>
  )
}
