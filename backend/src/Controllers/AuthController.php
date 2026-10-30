<?php

declare(strict_types=1);

namespace Cine\Controllers;

use Cine\Auth\Autenticador;
use Cine\Http\HttpErro;
use Cine\Http\Requisicao;
use Cine\Http\Resposta;
use Cine\Repositorios\TokenRepositorio;
use Cine\Repositorios\UsuarioRepositorio;
use Cine\Validacao\Validador;

final class AuthController
{
    public function __construct(
        private readonly UsuarioRepositorio $usuarios,
        private readonly TokenRepositorio $tokens,
        private readonly Autenticador $autenticador,
    ) {
    }

    /** POST /api/auth/cadastro  {"nome", "email", "senha"} -> 201 {"token", "usuario"} (já entra logado) */
    public function cadastro(Requisicao $req): Resposta
    {
        $v = new Validador($req->json());
        $nome = $v->texto('nome', 2, 80);
        $email = $v->email('email');
        $senha = $v->texto('senha', 6, 100);
        if (!$v->temErro('email') && $this->usuarios->buscarPorEmail($email) !== null) {
            $v->erro('email', 'Este e-mail já tem cadastro.');
        }
        $v->validar();

        $usuario = $this->usuarios->criarCliente($nome, $email, password_hash($senha, PASSWORD_DEFAULT));
        return Resposta::json(['token' => $this->tokens->criar($usuario->id), 'usuario' => $usuario], 201);
    }

    /** POST /api/auth/login  {"email", "senha"} -> {"token", "usuario"} */
    public function login(Requisicao $req): Resposta
    {
        $v = new Validador($req->json());
        $email = $v->texto('email', 3, 120);
        $senha = $v->texto('senha', 1, 100);
        $v->validar();

        $usuario = $this->usuarios->buscarPorEmail($email);
        // Mesma mensagem para e-mail inexistente e senha errada: não revela quais e-mails existem
        if ($usuario === null || !password_verify($senha, $usuario->senhaHash)) {
            throw new HttpErro(401, 'E-mail ou senha inválidos');
        }

        return Resposta::json(['token' => $this->tokens->criar($usuario->id), 'usuario' => $usuario]);
    }

    /** GET /api/auth/eu -> o usuário do token */
    public function eu(Requisicao $req): Resposta
    {
        return Resposta::json($this->autenticador->exigir($req));
    }

    /** POST /api/auth/logout -> 204, e o token deixa de valer */
    public function logout(Requisicao $req): Resposta
    {
        $this->autenticador->exigir($req);
        $this->tokens->apagar((string) $this->autenticador->token($req));
        return Resposta::semConteudo();
    }
}
