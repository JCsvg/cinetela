<?php

declare(strict_types=1);

namespace Cine\Repositorios;

use Cine\Models\Usuario;
use PDO;

final class TokenRepositorio
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /** Abre uma sessão de 7 dias e devolve o token (64 caracteres hexadecimais). */
    public function criar(int $usuarioId): string
    {
        $token = bin2hex(random_bytes(32));
        $stmt = $this->pdo->prepare(
            "INSERT INTO tokens (token, usuario_id, expira_em)
             VALUES (:token, :usuario, now() + interval '7 days')",
        );
        $stmt->execute(['token' => $token, 'usuario' => $usuarioId]);
        return $token;
    }

    /** O usuário dono do token, se a sessão existir e não tiver expirado. */
    public function usuarioDoToken(string $token): ?Usuario
    {
        $stmt = $this->pdo->prepare(
            'SELECT u.*
               FROM tokens t
               JOIN usuarios u ON u.id = t.usuario_id
              WHERE t.token = :token AND t.expira_em > now()',
        );
        $stmt->execute(['token' => $token]);
        $linha = $stmt->fetch();
        return $linha === false ? null : Usuario::daLinha($linha);
    }

    public function apagar(string $token): void
    {
        $this->pdo->prepare('DELETE FROM tokens WHERE token = :token')->execute(['token' => $token]);
    }
}
