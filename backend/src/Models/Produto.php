<?php

declare(strict_types=1);

namespace Cine\Models;

use JsonSerializable;

final class Produto implements JsonSerializable
{
    public function __construct(
        public readonly int $id,
        public readonly int $cinemaId,
        public readonly string $nome,
        public readonly string $descricao,
        public readonly string $categoria,
        public readonly float $preco,
        public readonly string $imagem,
        public readonly bool $ativo,
    ) {
    }

    /** @param array<string, mixed> $linha */
    public static function daLinha(array $linha): self
    {
        return new self(
            id: $linha['id'],
            cinemaId: $linha['cinema_id'],
            nome: $linha['nome'],
            descricao: $linha['descricao'],
            categoria: $linha['categoria'],
            preco: (float) $linha['preco'],
            imagem: $linha['imagem'],
            ativo: $linha['ativo'],
        );
    }

    public function jsonSerialize(): array
    {
        return get_object_vars($this);
    }
}
