<?php

declare(strict_types=1);

namespace Cine\Controllers;

use Cine\Http\HttpErro;
use Cine\Http\Requisicao;
use Cine\Http\Resposta;
use Cine\Repositorios\CinemaRepositorio;
use Cine\Repositorios\ProdutoRepositorio;

final class CinemaController
{
    public function __construct(
        private readonly CinemaRepositorio $cinemas,
        private readonly ProdutoRepositorio $produtos,
    ) {
    }

    /** GET /api/cinemas?cidade= */
    public function listar(Requisicao $req): Resposta
    {
        return Resposta::json($this->cinemas->listar($req->texto('cidade')));
    }

    /** GET /api/cidades -> ["Curitiba", "Londrina"] */
    public function cidades(): Resposta
    {
        return Resposta::json($this->cinemas->cidades());
    }

    /** GET /api/cinemas/{id}/produtos -> só os produtos ativos da lanchonete */
    public function produtos(Requisicao $req, array $params): Resposta
    {
        $id = (int) $params['id'];
        if ($this->cinemas->buscarPorId($id) === null) {
            throw HttpErro::naoEncontrado('Cinema não encontrado');
        }
        return Resposta::json($this->produtos->listarDoCinema($id, true));
    }
}
