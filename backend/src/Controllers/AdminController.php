<?php

declare(strict_types=1);

namespace Cine\Controllers;

use Cine\Auth\Autenticador;
use Cine\Database\Erros;
use Cine\Http\HttpErro;
use Cine\Http\Requisicao;
use Cine\Http\Resposta;
use Cine\Repositorios\CinemaRepositorio;
use Cine\Repositorios\FilmeRepositorio;
use Cine\Repositorios\PedidoRepositorio;
use Cine\Repositorios\UsuarioRepositorio;
use Cine\Validacao\Validador;
use PDOException;

/** Painel do administrador: filmes, cinemas, usuários e relatório geral. */
final class AdminController
{
    public function __construct(
        private readonly FilmeRepositorio $filmes,
        private readonly CinemaRepositorio $cinemas,
        private readonly UsuarioRepositorio $usuarios,
        private readonly PedidoRepositorio $pedidos,
        private readonly Autenticador $autenticador,
    ) {
    }

    // ---------- Filmes ----------

    /** POST /api/admin/filmes -> 201 */
    public function criarFilme(Requisicao $req): Resposta
    {
        $this->autenticador->exigirAdmin($req);
        $id = $this->filmes->criar($this->validarFilme($req));
        return Resposta::json($this->filmes->buscarPorId($id), 201);
    }

    /** PUT /api/admin/filmes/{id} */
    public function atualizarFilme(Requisicao $req, array $params): Resposta
    {
        $this->autenticador->exigirAdmin($req);
        $filme = $this->filmes->buscarPorId((int) $params['id']) ?? throw HttpErro::naoEncontrado('Filme não encontrado');
        $this->filmes->atualizar($filme->id, $this->validarFilme($req));
        return Resposta::json($this->filmes->buscarPorId($filme->id));
    }

    /** DELETE /api/admin/filmes/{id} -> 204; 409 se o filme tem exibições */
    public function apagarFilme(Requisicao $req, array $params): Resposta
    {
        $this->autenticador->exigirAdmin($req);
        $filme = $this->filmes->buscarPorId((int) $params['id']) ?? throw HttpErro::naoEncontrado('Filme não encontrado');
        try {
            $this->filmes->apagar($filme->id);
        } catch (PDOException $e) {
            throw Erros::chaveEstrangeira($e) ? new HttpErro(409, 'Este filme tem exibições e não pode ser apagado') : $e;
        }
        return Resposta::semConteudo();
    }

    // ---------- Cinemas ----------

    /** POST /api/admin/cinemas -> 201 */
    public function criarCinema(Requisicao $req): Resposta
    {
        $this->autenticador->exigirAdmin($req);
        $id = $this->cinemas->criar($this->validarCinema($req));
        return Resposta::json($this->cinemas->buscarPorId($id), 201);
    }

    /** PUT /api/admin/cinemas/{id} */
    public function atualizarCinema(Requisicao $req, array $params): Resposta
    {
        $this->autenticador->exigirAdmin($req);
        $cinema = $this->cinemas->buscarPorId((int) $params['id']) ?? throw HttpErro::naoEncontrado('Cinema não encontrado');
        $this->cinemas->atualizar($cinema->id, $this->validarCinema($req));
        return Resposta::json($this->cinemas->buscarPorId($cinema->id));
    }

    /** DELETE /api/admin/cinemas/{id} -> 204; 409 se tem salas, gerentes ou produtos */
    public function apagarCinema(Requisicao $req, array $params): Resposta
    {
        $this->autenticador->exigirAdmin($req);
        $cinema = $this->cinemas->buscarPorId((int) $params['id']) ?? throw HttpErro::naoEncontrado('Cinema não encontrado');
        try {
            $this->cinemas->apagar($cinema->id);
        } catch (PDOException $e) {
            throw Erros::chaveEstrangeira($e) ? new HttpErro(409, 'Este cinema ainda tem salas, produtos ou gerentes') : $e;
        }
        return Resposta::semConteudo();
    }

    // ---------- Usuários ----------

    /** GET /api/admin/usuarios */
    public function usuarios(Requisicao $req): Resposta
    {
        $this->autenticador->exigirAdmin($req);
        return Resposta::json($this->usuarios->listar());
    }

    /**
     * PUT /api/admin/usuarios/{id}  {"papel": "cinema", "cinemaId": 2}
     * Só o papel e o cinema mudam. Quem não é gerente fica com cinemaId nulo.
     */
    public function atualizarUsuario(Requisicao $req, array $params): Resposta
    {
        $admin = $this->autenticador->exigirAdmin($req);
        $usuario = $this->usuarios->buscarPorId((int) $params['id']) ?? throw HttpErro::naoEncontrado('Usuário não encontrado');
        if ($usuario->id === $admin->id) {
            throw new HttpErro(409, 'Você não pode mudar o seu próprio papel');
        }

        $corpo = $req->json();
        $v = new Validador($corpo);
        $papel = $v->opcao('papel', ['cliente', 'cinema', 'admin']);
        $cinemaId = null;
        if ($papel === 'cinema') {
            $cinemaId = $v->inteiro('cinemaId', 1, PHP_INT_MAX);
            if (!$v->temErro('cinemaId') && $this->cinemas->buscarPorId($cinemaId) === null) {
                $v->erro('cinemaId', 'Este cinema não existe.');
            }
        }
        $v->validar();

        $this->usuarios->atualizarPapel($usuario->id, $papel, $cinemaId);
        return Resposta::json($this->usuarios->buscarPorId($usuario->id));
    }

    // ---------- Relatório ----------

    /** GET /api/admin/relatorio */
    public function relatorio(Requisicao $req): Resposta
    {
        $this->autenticador->exigirAdmin($req);
        return Resposta::json($this->pedidos->relatorioGeral());
    }

    // ---------- Validação ----------

    /** @return array<string, mixed> */
    private function validarFilme(Requisicao $req): array
    {
        $v = new Validador($req->json());
        $dados = [
            'titulo' => $v->texto('titulo', 1, 100),
            'sinopse' => $v->texto('sinopse', 20, 2000),
            'genero' => $v->texto('genero', 2, 30),
            'duracaoMin' => $v->inteiro('duracaoMin', 1, 600),
            'classificacao' => $v->opcao('classificacao', ['L', '10', '12', '14', '16', '18']),
            'estreia' => $v->data('estreia'),
            'poster' => $v->texto('poster', 1, 120),
            'fundo' => $v->texto('fundo', 1, 120),
        ];
        $v->validar();
        return $dados;
    }

    /** @return array{nome: string, cidade: string, endereco: string, imagem: string} */
    private function validarCinema(Requisicao $req): array
    {
        $v = new Validador($req->json());
        $dados = [
            'nome' => $v->texto('nome', 2, 80),
            'cidade' => $v->texto('cidade', 2, 60),
            'endereco' => $v->texto('endereco', 5, 120),
            'imagem' => $v->texto('imagem', 1, 120),
        ];
        $v->validar();
        return $dados;
    }
}
