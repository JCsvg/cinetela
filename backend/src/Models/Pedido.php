<?php

declare(strict_types=1);

namespace Cine\Models;

use DateTimeImmutable;
use JsonSerializable;

final class Pedido implements JsonSerializable
{
    /**
     * @param list<array{fileira: string, numero: int, tipo: string, preco: float}> $ingressos
     * @param list<array{produtoId: int, nome: string, quantidade: int, precoUnit: float}> $itens
     */
    public function __construct(
        public readonly int $id,
        public readonly int $usuarioId,
        public readonly int $exibicaoId,
        public readonly string $filmeTitulo,
        public readonly string $poster,
        public readonly string $cinemaNome,
        public readonly string $salaNome,
        public readonly DateTimeImmutable $iniciaEm,
        public readonly float $total,
        public readonly string $status,
        public readonly DateTimeImmutable $criadoEm,
        public readonly array $ingressos,
        public readonly array $itens,
    ) {
    }

    /**
     * @param array<string, mixed> $linha pedido + exibição + filme + sala + cinema
     * @param list<array<string, mixed>> $ingressos linhas de ingressos
     * @param list<array<string, mixed>> $itens linhas de pedido_itens com o nome do produto
     */
    public static function daLinha(array $linha, array $ingressos, array $itens): self
    {
        return new self(
            id: $linha['id'],
            usuarioId: $linha['usuario_id'],
            exibicaoId: $linha['exibicao_id'],
            filmeTitulo: $linha['filme_titulo'],
            poster: $linha['poster'],
            cinemaNome: $linha['cinema_nome'],
            salaNome: $linha['sala_nome'],
            iniciaEm: new DateTimeImmutable($linha['inicia_em']),
            total: (float) $linha['total'],
            status: $linha['status'],
            criadoEm: new DateTimeImmutable($linha['criado_em']),
            ingressos: array_map(fn (array $i): array => [
                'fileira' => $i['fileira'],
                'numero' => $i['numero'],
                'tipo' => $i['tipo'],
                'preco' => (float) $i['preco'],
            ], $ingressos),
            itens: array_map(fn (array $i): array => [
                'produtoId' => $i['produto_id'],
                'nome' => $i['nome'],
                'quantidade' => $i['quantidade'],
                'precoUnit' => (float) $i['preco_unit'],
            ], $itens),
        );
    }

    /** Dá para cancelar até 2 horas antes do começo, e só se ainda estiver pago. */
    public function podeCancelar(): bool
    {
        $limite = $this->iniciaEm->modify('-2 hours');
        return $this->status === 'pago' && new DateTimeImmutable() < $limite;
    }

    public function jsonSerialize(): array
    {
        return [
            'id' => $this->id,
            'exibicaoId' => $this->exibicaoId,
            'filme' => ['titulo' => $this->filmeTitulo, 'poster' => $this->poster],
            'cinema' => $this->cinemaNome,
            'sala' => $this->salaNome,
            'iniciaEm' => $this->iniciaEm->format(DATE_ATOM),
            'total' => $this->total,
            'status' => $this->status,
            'criadoEm' => $this->criadoEm->format(DATE_ATOM),
            'ingressos' => $this->ingressos,
            'itens' => $this->itens,
            'podeCancelar' => $this->podeCancelar(),
        ];
    }
}
