<?php

declare(strict_types=1);

namespace Cine\Controllers;

use Cine\Http\HttpErro;
use Cine\Http\Requisicao;
use Cine\Http\Resposta;
use Cine\Models\Filme;
use Cine\Repositorios\CinemaRepositorio;
use Cine\Repositorios\ExibicaoRepositorio;
use Cine\Repositorios\FilmeRepositorio;

final class FilmeController
{
    public function __construct(
        private readonly FilmeRepositorio $filmes,
        private readonly ExibicaoRepositorio $exibicoes,
        private readonly CinemaRepositorio $cinemas,
    ) {
    }

    /** GET /api/filmes?genero=&busca=&emCartaz=1&pagina=&porPagina= */
    public function listar(Requisicao $req): Resposta
    {
        $genero = $req->texto('genero');
        $busca = $req->texto('busca');
        $emCartaz = in_array($req->texto('emCartaz'), ['1', 'true'], true);
        $pagina = $req->inteiro('pagina', 1);
        $porPagina = $req->inteiro('porPagina', 8, 1, 50);

        $total = $this->filmes->contar($genero, $busca, $emCartaz);
        $filmes = $this->filmes->listar($genero, $busca, $emCartaz, $porPagina, ($pagina - 1) * $porPagina);

        return Resposta::json([
            'dados' => $filmes,
            'pagina' => $pagina,
            'porPagina' => $porPagina,
            'total' => $total,
            'totalPaginas' => max(1, (int) ceil($total / $porPagina)),
        ]);
    }

    /** GET /api/filmes/{id} */
    public function mostrar(Requisicao $req, array $params): Resposta
    {
        return Resposta::json($this->buscarOu404((int) $params['id']));
    }

    /** GET /api/generos -> ["Ação", "Aventura", ...] */
    public function generos(): Resposta
    {
        return Resposta::json($this->filmes->generos());
    }

    /**
     * GET /api/filmes/{id}/exibicoes?cidade=&data=2026-10-30
     * As exibições futuras do filme, agrupadas por cinema.
     */
    public function exibicoes(Requisicao $req, array $params): Resposta
    {
        $filme = $this->buscarOu404((int) $params['id']);
        $data = $req->texto('data');
        if ($data !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $data) !== 1) {
            throw new HttpErro(422, 'Alguns campos estão inválidos', ['data' => 'Use uma data no formato AAAA-MM-DD.']);
        }

        $grupos = [];
        foreach ($this->exibicoes->listarDoFilme($filme->id, $req->texto('cidade'), $data) as $exibicao) {
            // ??= só atribui se a chave ainda não existe
            $grupos[$exibicao->cinemaId] ??= ['cinema' => $this->cinemas->buscarPorId($exibicao->cinemaId), 'exibicoes' => []];
            $grupos[$exibicao->cinemaId]['exibicoes'][] = [
                'id' => $exibicao->id,
                'iniciaEm' => $exibicao->iniciaEm->format(DATE_ATOM),
                'sala' => $exibicao->salaNome,
                'idioma' => $exibicao->idioma,
                'formato' => $exibicao->formato,
                'precoInteira' => $exibicao->precoInteira,
                'assentosLivres' => $exibicao->assentosLivres,
            ];
        }

        return Resposta::json(array_values($grupos));
    }

    private function buscarOu404(int $id): Filme
    {
        return $this->filmes->buscarPorId($id) ?? throw HttpErro::naoEncontrado('Filme não encontrado');
    }
}
