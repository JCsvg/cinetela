<?php

declare(strict_types=1);

namespace Cine\Models;

use DateTimeImmutable;
use JsonSerializable;

/** Uma sessão de cinema (filme + sala + horário), com os dados do filme, da sala e do cinema. */
final class Exibicao implements JsonSerializable
{
    public function __construct(
        public readonly int $id,
        public readonly int $filmeId,
        public readonly string $filmeTitulo,
        public readonly string $poster,
        public readonly int $duracaoMin,
        public readonly string $classificacao,
        public readonly int $salaId,
        public readonly string $salaNome,
        public readonly int $fileiras,
        public readonly int $assentosPorFileira,
        public readonly int $cinemaId,
        public readonly string $cinemaNome,
        public readonly string $cidade,
        public readonly DateTimeImmutable $iniciaEm,
        public readonly float $precoInteira,
        public readonly string $idioma,
        public readonly string $formato,
        public readonly int $assentosLivres,
    ) {
    }

    /**
     * Linha do SELECT do ExibicaoRepositorio (exibicoes + filme + sala + cinema
     * + assentos_livres calculado).
     *
     * @param array<string, mixed> $linha
     */
    public static function daLinha(array $linha): self
    {
        return new self(
            id: $linha['id'],
            filmeId: $linha['filme_id'],
            filmeTitulo: $linha['filme_titulo'],
            poster: $linha['poster'],
            duracaoMin: $linha['duracao_min'],
            classificacao: $linha['classificacao'],
            salaId: $linha['sala_id'],
            salaNome: $linha['sala_nome'],
            fileiras: $linha['fileiras'],
            assentosPorFileira: $linha['assentos_por_fileira'],
            cinemaId: $linha['cinema_id'],
            cinemaNome: $linha['cinema_nome'],
            cidade: $linha['cidade'],
            iniciaEm: new DateTimeImmutable($linha['inicia_em']),
            precoInteira: (float) $linha['preco_inteira'],
            idioma: $linha['idioma'],
            formato: $linha['formato'],
            assentosLivres: $linha['assentos_livres'],
        );
    }

    /** A meia-entrada custa metade da inteira. */
    public function precoMeia(): float
    {
        return round($this->precoInteira / 2, 2);
    }

    /** Já passou do horário de início? */
    public function jaComecou(): bool
    {
        return $this->iniciaEm <= new DateTimeImmutable();
    }

    public function jsonSerialize(): array
    {
        return [
            'id' => $this->id,
            'filme' => [
                'id' => $this->filmeId,
                'titulo' => $this->filmeTitulo,
                'poster' => $this->poster,
                'duracaoMin' => $this->duracaoMin,
                'classificacao' => $this->classificacao,
            ],
            'cinema' => ['id' => $this->cinemaId, 'nome' => $this->cinemaNome, 'cidade' => $this->cidade],
            'sala' => [
                'id' => $this->salaId,
                'nome' => $this->salaNome,
                'fileiras' => $this->fileiras,
                'assentosPorFileira' => $this->assentosPorFileira,
            ],
            'iniciaEm' => $this->iniciaEm->format(DATE_ATOM),
            'precoInteira' => $this->precoInteira,
            'precoMeia' => $this->precoMeia(),
            'idioma' => $this->idioma,
            'formato' => $this->formato,
            'assentosLivres' => $this->assentosLivres,
        ];
    }
}
