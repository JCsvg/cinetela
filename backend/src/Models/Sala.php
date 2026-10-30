<?php

declare(strict_types=1);

namespace Cine\Models;

use JsonSerializable;

/** Uma sala de cinema: quantas fileiras e quantos assentos por fileira. */
final class Sala implements JsonSerializable
{
    public function __construct(
        public readonly int $id,
        public readonly int $cinemaId,
        public readonly string $nome,
        public readonly int $fileiras,
        public readonly int $assentosPorFileira,
    ) {
    }

    /** @param array<string, mixed> $linha */
    public static function daLinha(array $linha): self
    {
        return new self($linha['id'], $linha['cinema_id'], $linha['nome'], $linha['fileiras'], $linha['assentos_por_fileira']);
    }

    /** Letras das fileiras: 3 fileiras dão ['A', 'B', 'C']. */
    public function letrasDasFileiras(): array
    {
        return array_map(chr(...), range(65, 64 + $this->fileiras));
    }

    public function jsonSerialize(): array
    {
        return get_object_vars($this) + ['capacidade' => $this->fileiras * $this->assentosPorFileira];
    }
}
