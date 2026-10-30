<?php

declare(strict_types=1);

namespace Cine\Models;

use JsonSerializable;

/**
 * Um cinema, como sai do banco e como vai para o JSON.
 *
 * Guarda só os dados: a linha do banco (array) vira um objeto com tipos, e o
 * JsonSerializable diz ao json_encode como transformá-lo em JSON.
 */
final class Cinema implements JsonSerializable
{
    public function __construct(
        public readonly int $id,
        public readonly string $nome,
        public readonly string $cidade,
        public readonly string $endereco,
        public readonly string $imagem,
    ) {
    }

    /** @param array<string, mixed> $linha */
    public static function daLinha(array $linha): self
    {
        return new self($linha['id'], $linha['nome'], $linha['cidade'], $linha['endereco'], $linha['imagem']);
    }

    public function jsonSerialize(): array
    {
        return get_object_vars($this);
    }
}
