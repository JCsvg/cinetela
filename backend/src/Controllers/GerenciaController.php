<?php

declare(strict_types=1);

namespace Cine\Controllers;

use Cine\Auth\Autenticador;
use Cine\Database\Erros;
use Cine\Http\HttpErro;
use Cine\Http\Requisicao;
use Cine\Http\Resposta;
use Cine\Models\Usuario;
use Cine\Repositorios\CinemaRepositorio;
use Cine\Repositorios\ExibicaoRepositorio;
use Cine\Repositorios\FilmeRepositorio;
use Cine\Repositorios\PedidoRepositorio;
use Cine\Repositorios\ProdutoRepositorio;
use Cine\Repositorios\SalaRepositorio;
use Cine\Validacao\Validador;
use PDOException;

/**
 * Painel do cinema: salas, exibições, lanchonete e vendas de UM cinema.
 * O gerente só mexe no dele; o admin mexe em qualquer um.
 * Ordem das conferências: 401, 404, 403, 422.
 */
final class GerenciaController
{
    public function __construct(
        private readonly CinemaRepositorio $cinemas,
        private readonly SalaRepositorio $salas,
        private readonly ExibicaoRepositorio $exibicoes,
        private readonly FilmeRepositorio $filmes,
        private readonly ProdutoRepositorio $produtos,
        private readonly PedidoRepositorio $pedidos,
        private readonly Autenticador $autenticador,
    ) {
    }

    // ---------- Salas ----------

    /** GET /api/gerencia/cinemas/{id}/salas */
    public function salas(Requisicao $req, array $params): Resposta
    {
        $cinemaId = $this->cinemaDoGerente($req, (int) $params['id']);
        return Resposta::json($this->salas->listarDoCinema($cinemaId));
    }

    /** POST /api/gerencia/cinemas/{id}/salas  {"nome", "fileiras", "assentosPorFileira"} -> 201 */
    public function criarSala(Requisicao $req, array $params): Resposta
    {
        $cinemaId = $this->cinemaDoGerente($req, (int) $params['id']);
        $dados = $this->validarSala($req);
        try {
            $id = $this->salas->criar($cinemaId, $dados);
        } catch (PDOException $e) {
            throw $this->erroDeSala($e);
        }
        return Resposta::json($this->salas->buscarPorId($id), 201);
    }

    /** PUT /api/gerencia/salas/{id} */
    public function atualizarSala(Requisicao $req, array $params): Resposta
    {
        $sala = $this->salas->buscarPorId((int) $params['id']) ?? throw $this->naoEncontrado($req, 'Sala');
        $this->cinemaDoGerente($req, $sala->cinemaId);
        $dados = $this->validarSala($req);
        try {
            $this->salas->atualizar($sala->id, $dados);
        } catch (PDOException $e) {
            throw $this->erroDeSala($e);
        }
        return Resposta::json($this->salas->buscarPorId($sala->id));
    }

    /** DELETE /api/gerencia/salas/{id} -> 204; 409 se a sala já tem exibições */
    public function apagarSala(Requisicao $req, array $params): Resposta
    {
        $sala = $this->salas->buscarPorId((int) $params['id']) ?? throw $this->naoEncontrado($req, 'Sala');
        $this->cinemaDoGerente($req, $sala->cinemaId);
        try {
            $this->salas->apagar($sala->id);
        } catch (PDOException $e) {
            throw Erros::chaveEstrangeira($e) ? new HttpErro(409, 'Esta sala tem exibições e não pode ser apagada') : $e;
        }
        return Resposta::semConteudo();
    }

    // ---------- Exibições ----------

    /** GET /api/gerencia/cinemas/{id}/exibicoes -> de hoje em diante */
    public function exibicoes(Requisicao $req, array $params): Resposta
    {
        $cinemaId = $this->cinemaDoGerente($req, (int) $params['id']);
        return Resposta::json($this->exibicoes->listarDoCinema($cinemaId));
    }

    /** POST /api/gerencia/cinemas/{id}/exibicoes -> 201 */
    public function criarExibicao(Requisicao $req, array $params): Resposta
    {
        $cinemaId = $this->cinemaDoGerente($req, (int) $params['id']);
        $dados = $this->validarExibicao($req, $cinemaId, 0);
        return Resposta::json($this->exibicoes->buscarPorId($this->exibicoes->criar($dados)), 201);
    }

    /** PUT /api/gerencia/exibicoes/{id} */
    public function atualizarExibicao(Requisicao $req, array $params): Resposta
    {
        $exibicao = $this->exibicoes->buscarPorId((int) $params['id']) ?? throw $this->naoEncontrado($req, 'Exibição');
        $this->cinemaDoGerente($req, $exibicao->cinemaId);
        $dados = $this->validarExibicao($req, $exibicao->cinemaId, $exibicao->id);
        $this->exibicoes->atualizar($exibicao->id, $dados);
        return Resposta::json($this->exibicoes->buscarPorId($exibicao->id));
    }

    /** DELETE /api/gerencia/exibicoes/{id} -> 204; 409 se já existem pedidos */
    public function apagarExibicao(Requisicao $req, array $params): Resposta
    {
        $exibicao = $this->exibicoes->buscarPorId((int) $params['id']) ?? throw $this->naoEncontrado($req, 'Exibição');
        $this->cinemaDoGerente($req, $exibicao->cinemaId);
        try {
            $this->exibicoes->apagar($exibicao->id);
        } catch (PDOException $e) {
            throw Erros::chaveEstrangeira($e) ? new HttpErro(409, 'Já existem pedidos para esta exibição') : $e;
        }
        return Resposta::semConteudo();
    }

    // ---------- Lanchonete ----------

    /** GET /api/gerencia/cinemas/{id}/produtos -> todos, inclusive os desativados */
    public function produtos(Requisicao $req, array $params): Resposta
    {
        $cinemaId = $this->cinemaDoGerente($req, (int) $params['id']);
        return Resposta::json($this->produtos->listarDoCinema($cinemaId, false));
    }

    /** POST /api/gerencia/cinemas/{id}/produtos -> 201 */
    public function criarProduto(Requisicao $req, array $params): Resposta
    {
        $cinemaId = $this->cinemaDoGerente($req, (int) $params['id']);
        $dados = $this->validarProduto($req);
        return Resposta::json($this->produtos->buscarPorId($this->produtos->criar($cinemaId, $dados)), 201);
    }

    /** PUT /api/gerencia/produtos/{id} */
    public function atualizarProduto(Requisicao $req, array $params): Resposta
    {
        $produto = $this->produtos->buscarPorId((int) $params['id']) ?? throw $this->naoEncontrado($req, 'Produto');
        $this->cinemaDoGerente($req, $produto->cinemaId);
        $this->produtos->atualizar($produto->id, $this->validarProduto($req));
        return Resposta::json($this->produtos->buscarPorId($produto->id));
    }

    /** DELETE /api/gerencia/produtos/{id} -> 204; 409 se já foi vendido (desative em vez de apagar) */
    public function apagarProduto(Requisicao $req, array $params): Resposta
    {
        $produto = $this->produtos->buscarPorId((int) $params['id']) ?? throw $this->naoEncontrado($req, 'Produto');
        $this->cinemaDoGerente($req, $produto->cinemaId);
        try {
            $this->produtos->apagar($produto->id);
        } catch (PDOException $e) {
            throw Erros::chaveEstrangeira($e) ? new HttpErro(409, 'Este produto já foi vendido: desative-o em vez de apagar') : $e;
        }
        return Resposta::semConteudo();
    }

    // ---------- Vendas ----------

    /** GET /api/gerencia/cinemas/{id}/vendas */
    public function vendas(Requisicao $req, array $params): Resposta
    {
        $cinemaId = $this->cinemaDoGerente($req, (int) $params['id']);
        return Resposta::json($this->pedidos->vendasDoCinema($cinemaId));
    }

    // ---------- Apoio ----------

    /**
     * 401 sem login, 404 se o cinema não existe, 403 se o usuário não gerencia este cinema.
     * Devolve o id do cinema.
     */
    private function cinemaDoGerente(Requisicao $req, int $cinemaId): int
    {
        $usuario = $this->autenticador->exigir($req);
        if ($this->cinemas->buscarPorId($cinemaId) === null) {
            throw HttpErro::naoEncontrado('Cinema não encontrado');
        }
        $this->exigirPodeGerenciar($usuario, $cinemaId);
        return $cinemaId;
    }

    private function exigirPodeGerenciar(Usuario $usuario, int $cinemaId): void
    {
        if (!$usuario->podeGerenciar($cinemaId)) {
            throw new HttpErro(403, 'Você não gerencia este cinema');
        }
    }

    /** O login vem antes do 404: sem token, o cliente nem descobre se o recurso existe. */
    private function naoEncontrado(Requisicao $req, string $recurso): HttpErro
    {
        $this->autenticador->exigir($req);
        return HttpErro::naoEncontrado("$recurso não encontrada");
    }

    private function erroDeSala(PDOException $e): HttpErro|PDOException
    {
        return Erros::duplicado($e)
            ? new HttpErro(422, 'Alguns campos estão inválidos', ['nome' => 'Já existe uma sala com este nome.'])
            : $e;
    }

    /** @return array{nome: string, fileiras: int, assentosPorFileira: int} */
    private function validarSala(Requisicao $req): array
    {
        $v = new Validador($req->json());
        $dados = [
            'nome' => $v->texto('nome', 1, 30),
            'fileiras' => $v->inteiro('fileiras', 1, 26),
            'assentosPorFileira' => $v->inteiro('assentosPorFileira', 1, 30),
        ];
        $v->validar();
        return $dados;
    }

    /** @return array{filmeId: int, salaId: int, iniciaEm: \DateTimeImmutable, precoInteira: float, idioma: string, formato: string} */
    private function validarExibicao(Requisicao $req, int $cinemaId, int $ignorarId): array
    {
        $v = new Validador($req->json());
        $dados = [
            'filmeId' => $v->inteiro('filmeId', 1, PHP_INT_MAX),
            'salaId' => $v->inteiro('salaId', 1, PHP_INT_MAX),
            'iniciaEm' => $v->dataHora('iniciaEm'),
            'precoInteira' => $v->numero('precoInteira', 5, 200),
            'idioma' => $v->opcao('idioma', ['Dublado', 'Legendado']),
            'formato' => $v->opcao('formato', ['2D', '3D']),
        ];

        $filme = $v->temErro('filmeId') ? null : $this->filmes->buscarPorId($dados['filmeId']);
        if (!$v->temErro('filmeId') && $filme === null) {
            $v->erro('filmeId', 'Este filme não existe.');
        }
        $sala = $v->temErro('salaId') ? null : $this->salas->buscarPorId($dados['salaId']);
        if (!$v->temErro('salaId') && ($sala === null || $sala->cinemaId !== $cinemaId)) {
            $v->erro('salaId', 'Esta sala não existe neste cinema.');
        }
        if (!$v->temErro('iniciaEm') && $dados['iniciaEm'] <= new \DateTimeImmutable()) {
            $v->erro('iniciaEm', 'A exibição precisa ser no futuro.');
        }
        if (!$v->temErro() && $filme !== null && $sala !== null
            && $this->exibicoes->temConflito($sala->id, $dados['iniciaEm'], $filme->duracaoMin, $ignorarId)) {
            $v->erro('iniciaEm', 'A sala já está ocupada nesse horário.');
        }
        $v->validar();
        return $dados;
    }

    /** @return array{nome: string, descricao: string, categoria: string, preco: float, imagem: string, ativo: bool} */
    private function validarProduto(Requisicao $req): array
    {
        $v = new Validador($req->json());
        $dados = [
            'nome' => $v->texto('nome', 2, 60),
            'descricao' => $v->texto('descricao', 2, 120),
            'categoria' => $v->opcao('categoria', ['pipoca', 'bebida', 'lanche', 'doce', 'combo']),
            'preco' => $v->numero('preco', 1, 500),
            'imagem' => $v->texto('imagem', 1, 120),
            'ativo' => $v->booleano('ativo', true),
        ];
        $v->validar();
        return $dados;
    }
}
