<?php

declare(strict_types=1);

namespace Cine\Models;

use JsonSerializable;

/**
 * Um filme. A coluna duracao_min do banco (snake_case) vira a propriedade e o campo JSON
 * duracaoMin (camelCase).
 */
final class Filme implements JsonSerializable
{
    /**
     * @param string $estreia texto "2026-11-02" (o Postgres entrega DATE como texto)
     * @param bool   $emCartaz true se existe alguma exibição futura
     */
    public function __construct(
        public readonly int $id,
        public readonly string $titulo,
        public readonly string $sinopse,
        public readonly string $genero,
        public readonly int $duracaoMin,
        public readonly string $classificacao,
        public readonly string $estreia,
        public readonly string $poster,
        public readonly string $fundo,
        public readonly bool $emCartaz,
    ) {
    }

    /** @param array<string, mixed> $linha */
    public static function daLinha(array $linha): self
    {
        return new self(
            id: $linha['id'],
            titulo: $linha['titulo'],
            sinopse: $linha['sinopse'],
            genero: $linha['genero'],
            duracaoMin: $linha['duracao_min'],
            classificacao: $linha['classificacao'],
            estreia: $linha['estreia'],
            poster: $linha['poster'],
            fundo: $linha['fundo'],
            emCartaz: $linha['em_cartaz'] ?? false,
        );
    }

    public function jsonSerialize(): array
    {
        return get_object_vars($this);
    }
}
