<?php

declare(strict_types=1);

namespace Cine\Models;

use JsonSerializable;

final class Usuario implements JsonSerializable
{
    public function __construct(
        public readonly int $id,
        public readonly string $nome,
        public readonly string $email,
        public readonly string $senhaHash,
        public readonly string $papel,
        public readonly ?int $cinemaId,
    ) {
    }

    /** @param array<string, mixed> $linha linha da tabela usuarios */
    public static function daLinha(array $linha): self
    {
        return new self(
            id: $linha['id'],
            nome: $linha['nome'],
            email: $linha['email'],
            senhaHash: $linha['senha_hash'],
            papel: $linha['papel'],
            cinemaId: $linha['cinema_id'],
        );
    }

    public function ehAdmin(): bool
    {
        return $this->papel === 'admin';
    }

    /** Admin gerencia qualquer cinema; gerente, só o dele. */
    public function podeGerenciar(int $cinemaId): bool
    {
        return $this->ehAdmin() || ($this->papel === 'cinema' && $this->cinemaId === $cinemaId);
    }

    /** O hash da senha nunca sai no JSON. */
    public function jsonSerialize(): array
    {
        return [
            'id' => $this->id,
            'nome' => $this->nome,
            'email' => $this->email,
            'papel' => $this->papel,
            'cinemaId' => $this->cinemaId,
        ];
    }
}
