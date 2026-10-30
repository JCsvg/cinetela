<?php

declare(strict_types=1);

namespace Cine\Controllers;

use Cine\Http\HttpErro;
use Cine\Http\Requisicao;
use Cine\Http\Resposta;
use Cine\Repositorios\ExibicaoRepositorio;

final class ExibicaoController
{
    public function __construct(private readonly ExibicaoRepositorio $exibicoes)
    {
    }

    /**
     * GET /api/exibicoes/{id}/assentos
     * Tudo que o mapa de assentos precisa: a exibição, as letras das fileiras
     * e os assentos já ocupados, como "D5".
     */
    public function assentos(Requisicao $req, array $params): Resposta
    {
        $exibicao = $this->exibicoes->buscarPorId((int) $params['id'])
            ?? throw HttpErro::naoEncontrado('Exibição não encontrada');

        return Resposta::json([
            'exibicao' => $exibicao,
            'fileiras' => array_map(chr(...), range(65, 64 + $exibicao->fileiras)),
            'ocupados' => $this->exibicoes->assentosOcupados($exibicao->id),
        ]);
    }
}
