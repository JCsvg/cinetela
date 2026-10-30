import { useState, type ChangeEvent, type SubmitEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router'
import { ErroApi, mensagemDe } from '../api/cliente'
import { inicioDoPapel, useAuth } from '../auth/useAuth'
import Campo from '../components/Campo'
import MensagemErro from '../components/MensagemErro'
import { botao, cartao, entrada } from '../utils/estilos'

type Campos = { nome: string; email: string; senha: string; confirmacao: string }
type Erros = Partial<Record<keyof Campos, string>>

export default function Cadastro() {
  const { usuario, cadastrar } = useAuth()
  const local = useLocation()
  const voltarPara = (local.state as { voltarPara?: string } | null)?.voltarPara

  const [campos, setCampos] = useState<Campos>({ nome: '', email: '', senha: '', confirmacao: '' })
  const [erros, setErros] = useState<Erros>({})
  const [erroGeral, setErroGeral] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  if (usuario !== null) {
    return <Navigate to={voltarPara ?? inicioDoPapel(usuario.papel, usuario.cinemaId)} replace />
  }

  function mudar(evento: ChangeEvent<HTMLInputElement>) {
    const { name, value } = evento.target
    setCampos((anterior) => ({ ...anterior, [name]: value }))
  }

  async function enviar(evento: SubmitEvent<HTMLFormElement>) {
    evento.preventDefault()
    const locais: Erros = {}
    if (campos.nome.trim().length < 2) locais.nome = 'Informe seu nome.'
    if (!/^\S+@\S+\.\S+$/.test(campos.email)) locais.email = 'E-mail inválido.'
    if (campos.senha.length < 6) locais.senha = 'Use pelo menos 6 caracteres.'
    if (campos.confirmacao !== campos.senha) locais.confirmacao = 'As senhas não são iguais.'
    setErros(locais)
    setErroGeral(null)
    if (Object.keys(locais).length > 0) {
      return
    }

    setEnviando(true)
    try {
      await cadastrar(campos.nome.trim(), campos.email.trim(), campos.senha)
    } catch (e) {
      if (e instanceof ErroApi && e.status === 422) setErros(e.campos)
      else setErroGeral(mensagemDe(e))
      setEnviando(false)
    }
  }

  const atributos = (campo: keyof Campos) =>
    erros[campo] !== undefined ? { 'aria-invalid': true, 'aria-describedby': `${campo}-erro` } : {}

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <h1 className="text-3xl font-bold text-white">Criar conta</h1>
      <form onSubmit={enviar} noValidate className={`${cartao} flex flex-col gap-4`}>
        {erroGeral !== null && <MensagemErro mensagem={erroGeral} />}
        <Campo id="nome" rotulo="Nome" erro={erros.nome}>
          <input id="nome" name="nome" autoComplete="name" value={campos.nome} onChange={mudar} className={entrada} {...atributos('nome')} />
        </Campo>
        <Campo id="email" rotulo="E-mail" erro={erros.email}>
          <input id="email" name="email" type="email" autoComplete="email" value={campos.email} onChange={mudar} className={entrada} {...atributos('email')} />
        </Campo>
        <Campo id="senha" rotulo="Senha" erro={erros.senha} dica="Pelo menos 6 caracteres.">
          <input id="senha" name="senha" type="password" autoComplete="new-password" value={campos.senha} onChange={mudar} className={entrada} {...atributos('senha')} />
        </Campo>
        <Campo id="confirmacao" rotulo="Repita a senha" erro={erros.confirmacao}>
          <input id="confirmacao" name="confirmacao" type="password" autoComplete="new-password" value={campos.confirmacao} onChange={mudar} className={entrada} {...atributos('confirmacao')} />
        </Campo>
        <button type="submit" disabled={enviando} className={botao}>
          {enviando ? 'Criando...' : 'Criar conta'}
        </button>
        <p className="text-center text-sm text-zinc-400">
          Já tem conta?{' '}
          <Link to="/login" state={local.state} className="text-marca-400 hover:underline">
            Entrar
          </Link>
        </p>
      </form>
    </div>
  )
}
