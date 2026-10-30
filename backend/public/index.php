<?php

declare(strict_types=1);

// Front controller: o servidor manda TODA requisição para este arquivo
// (php -S ... public/index.php), e o Router decide o que fazer.

require __DIR__ . '/../vendor/autoload.php';

use Cine\Auth\Autenticador;
use Cine\Controllers\AdminController;
use Cine\Controllers\AuthController;
use Cine\Controllers\CinemaController;
use Cine\Controllers\ExibicaoController;
use Cine\Controllers\FilmeController;
use Cine\Controllers\GerenciaController;
use Cine\Controllers\PedidoController;
use Cine\Database\Conexao;
use Cine\Http\Cors;
use Cine\Http\HttpErro;
use Cine\Http\Requisicao;
use Cine\Http\Resposta;
use Cine\Http\Router;
use Cine\Repositorios\CinemaRepositorio;
use Cine\Repositorios\ExibicaoRepositorio;
use Cine\Repositorios\FilmeRepositorio;
use Cine\Repositorios\PedidoRepositorio;
use Cine\Repositorios\ProdutoRepositorio;
use Cine\Repositorios\SalaRepositorio;
use Cine\Repositorios\TokenRepositorio;
use Cine\Repositorios\UsuarioRepositorio;

// Aviso do PHP (índice inexistente, variável indefinida) vira exceção, e daí um 500
set_error_handler(function (int $nivel, string $mensagem, string $arquivo, int $linha): bool {
    throw new ErrorException($mensagem, 0, $nivel, $arquivo, $linha);
});

Cors::aplicar();

try {
    $pdo = Conexao::criar();

    // Montagem das dependências: cada classe recebe o que usa pelo construtor
    $tokens = new TokenRepositorio($pdo);
    $usuarios = new UsuarioRepositorio($pdo);
    $cinemas = new CinemaRepositorio($pdo);
    $salas = new SalaRepositorio($pdo);
    $filmes = new FilmeRepositorio($pdo);
    $exibicoes = new ExibicaoRepositorio($pdo);
    $produtos = new ProdutoRepositorio($pdo);
    $pedidos = new PedidoRepositorio($pdo);
    $autenticador = new Autenticador($tokens);

    $auth = new AuthController($usuarios, $tokens, $autenticador);
    $filmeController = new FilmeController($filmes, $exibicoes, $cinemas);
    $cinemaController = new CinemaController($cinemas, $produtos);
    $exibicaoController = new ExibicaoController($exibicoes);
    $pedidoController = new PedidoController($pedidos, $exibicoes, $produtos, $autenticador);
    $gerencia = new GerenciaController($cinemas, $salas, $exibicoes, $filmes, $produtos, $pedidos, $autenticador);
    $admin = new AdminController($filmes, $cinemas, $usuarios, $pedidos, $autenticador);

    $router = new Router();

    $router->get('/api/saude', function () use ($pdo): Resposta {
        $pdo->query('SELECT 1');
        return Resposta::json(['status' => 'ok', 'banco' => 'ok']);
    });

    // Conta
    $router->post('/api/auth/cadastro', $auth->cadastro(...));
    $router->post('/api/auth/login', $auth->login(...));
    $router->get('/api/auth/eu', $auth->eu(...));
    $router->post('/api/auth/logout', $auth->logout(...));

    // Vitrine (público)
    $router->get('/api/filmes', $filmeController->listar(...));
    $router->get('/api/filmes/{id}', $filmeController->mostrar(...));
    $router->get('/api/filmes/{id}/exibicoes', $filmeController->exibicoes(...));
    $router->get('/api/generos', $filmeController->generos(...));
    $router->get('/api/cinemas', $cinemaController->listar(...));
    $router->get('/api/cidades', $cinemaController->cidades(...));
    $router->get('/api/cinemas/{id}/produtos', $cinemaController->produtos(...));
    $router->get('/api/exibicoes/{id}/assentos', $exibicaoController->assentos(...));

    // Compra (cliente logado)
    $router->post('/api/pedidos', $pedidoController->criar(...));
    $router->get('/api/meus-pedidos', $pedidoController->meus(...));
    $router->get('/api/pedidos/{id}', $pedidoController->mostrar(...));
    $router->delete('/api/pedidos/{id}', $pedidoController->cancelar(...));

    // Painel do cinema (gerente do cinema ou admin)
    $router->get('/api/gerencia/cinemas/{id}/salas', $gerencia->salas(...));
    $router->post('/api/gerencia/cinemas/{id}/salas', $gerencia->criarSala(...));
    $router->put('/api/gerencia/salas/{id}', $gerencia->atualizarSala(...));
    $router->delete('/api/gerencia/salas/{id}', $gerencia->apagarSala(...));
    $router->get('/api/gerencia/cinemas/{id}/exibicoes', $gerencia->exibicoes(...));
    $router->post('/api/gerencia/cinemas/{id}/exibicoes', $gerencia->criarExibicao(...));
    $router->put('/api/gerencia/exibicoes/{id}', $gerencia->atualizarExibicao(...));
    $router->delete('/api/gerencia/exibicoes/{id}', $gerencia->apagarExibicao(...));
    $router->get('/api/gerencia/cinemas/{id}/produtos', $gerencia->produtos(...));
    $router->post('/api/gerencia/cinemas/{id}/produtos', $gerencia->criarProduto(...));
    $router->put('/api/gerencia/produtos/{id}', $gerencia->atualizarProduto(...));
    $router->delete('/api/gerencia/produtos/{id}', $gerencia->apagarProduto(...));
    $router->get('/api/gerencia/cinemas/{id}/vendas', $gerencia->vendas(...));

    // Painel do administrador
    $router->post('/api/admin/filmes', $admin->criarFilme(...));
    $router->put('/api/admin/filmes/{id}', $admin->atualizarFilme(...));
    $router->delete('/api/admin/filmes/{id}', $admin->apagarFilme(...));
    $router->post('/api/admin/cinemas', $admin->criarCinema(...));
    $router->put('/api/admin/cinemas/{id}', $admin->atualizarCinema(...));
    $router->delete('/api/admin/cinemas/{id}', $admin->apagarCinema(...));
    $router->get('/api/admin/usuarios', $admin->usuarios(...));
    $router->put('/api/admin/usuarios/{id}', $admin->atualizarUsuario(...));
    $router->get('/api/admin/relatorio', $admin->relatorio(...));

    $resposta = $router->despachar(Requisicao::doServidor());
} catch (HttpErro $e) {
    $resposta = Resposta::json($e->corpo(), $e->status);
} catch (Throwable $e) {
    // Detalhe só no log (docker compose logs backend), nunca para o cliente
    error_log((string) $e);
    $resposta = Resposta::json(['erro' => 'Erro interno no servidor'], 500);
}

$resposta->enviar();
