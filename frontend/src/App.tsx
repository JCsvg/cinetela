import { Route, Routes } from 'react-router'
import RotaProtegida from './auth/RotaProtegida'
import Layout from './components/Layout'
import AdminLayout from './pages/admin/AdminLayout'
import Cinemas from './pages/admin/Cinemas'
import Filmes from './pages/admin/Filmes'
import Relatorio from './pages/admin/Relatorio'
import UsuariosAdmin from './pages/admin/Usuarios'
import Assentos from './pages/Assentos'
import Cadastro from './pages/Cadastro'
import Confirmacao from './pages/Confirmacao'
import FilmeDetalhe from './pages/FilmeDetalhe'
import Exibicoes from './pages/gerencia/Exibicoes'
import GerenciaInicio from './pages/gerencia/GerenciaInicio'
import GerenciaLayout from './pages/gerencia/GerenciaLayout'
import Lanchonete from './pages/gerencia/Lanchonete'
import Salas from './pages/gerencia/Salas'
import Vendas from './pages/gerencia/Vendas'
import Home from './pages/Home'
import LanchoneteCompra from './pages/Lanchonete'
import Login from './pages/Login'
import MinhaConta from './pages/MinhaConta'
import NaoEncontrada from './pages/NaoEncontrada'
import Pagamento from './pages/Pagamento'

export default function App() {
  return (
    <Routes>
      {/* Rota sem path: só a moldura. As filhas aparecem no <Outlet /> do Layout */}
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="filmes/:id" element={<FilmeDetalhe />} />
        <Route path="login" element={<Login />} />
        <Route path="cadastro" element={<Cadastro />} />

        {/* A escolha dos assentos e da lanchonete é livre; pagar exige conta */}
        <Route path="sessoes/:id/assentos" element={<Assentos />} />
        <Route path="lanchonete" element={<LanchoneteCompra />} />

        <Route element={<RotaProtegida />}>
          <Route path="pagamento" element={<Pagamento />} />
          <Route path="pedidos/:id" element={<Confirmacao />} />
          <Route path="conta" element={<MinhaConta />} />
        </Route>

        <Route element={<RotaProtegida papeis={['cinema', 'admin']} />}>
          <Route path="gerencia" element={<GerenciaInicio />} />
          <Route path="gerencia/:cinemaId" element={<GerenciaLayout />}>
            <Route index element={<Vendas />} />
            <Route path="exibicoes" element={<Exibicoes />} />
            <Route path="salas" element={<Salas />} />
            <Route path="lanchonete" element={<Lanchonete />} />
          </Route>
        </Route>

        <Route element={<RotaProtegida papeis={['admin']} />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<Relatorio />} />
            <Route path="filmes" element={<Filmes />} />
            <Route path="cinemas" element={<Cinemas />} />
            <Route path="usuarios" element={<UsuariosAdmin />} />
          </Route>
        </Route>

        <Route path="*" element={<NaoEncontrada />} />
      </Route>
    </Routes>
  )
}
