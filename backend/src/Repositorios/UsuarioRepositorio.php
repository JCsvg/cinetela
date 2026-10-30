<?php

declare(strict_types=1);

namespace Cine\Repositorios;

use Cine\Models\Usuario;
use PDO;

final class UsuarioRepositorio
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    public function buscarPorEmail(string $email): ?Usuario
    {
        $stmt = $this->pdo->prepare('SELECT * FROM usuarios WHERE lower(email) = lower(:email)');
        $stmt->execute(['email' => $email]);
        $linha = $stmt->fetch();
        return $linha === false ? null : Usuario::daLinha($linha);
    }

    public function buscarPorId(int $id): ?Usuario
    {
        $stmt = $this->pdo->prepare('SELECT * FROM usuarios WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $linha = $stmt->fetch();
        return $linha === false ? null : Usuario::daLinha($linha);
    }

    /** O cadastro público sempre cria cliente; só o admin muda o papel depois. */
    public function criarCliente(string $nome, string $email, string $senhaHash): Usuario
    {
        $stmt = $this->pdo->prepare(
            "INSERT INTO usuarios (nome, email, senha_hash, papel)
             VALUES (:nome, :email, :hash, 'cliente')
             RETURNING *",
        );
        $stmt->execute(['nome' => $nome, 'email' => $email, 'hash' => $senhaHash]);
        return Usuario::daLinha($stmt->fetch());
    }

    /** @return list<Usuario> */
    public function listar(): array
    {
        $linhas = $this->pdo->query('SELECT * FROM usuarios ORDER BY papel, nome')->fetchAll();
        return array_map(Usuario::daLinha(...), $linhas);
    }

    public function atualizarPapel(int $id, string $papel, ?int $cinemaId): void
    {
        $stmt = $this->pdo->prepare('UPDATE usuarios SET papel = :papel, cinema_id = :cinema WHERE id = :id');
        $stmt->bindValue('papel', $papel);
        $stmt->bindValue('cinema', $cinemaId, $cinemaId === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
        $stmt->bindValue('id', $id, PDO::PARAM_INT);
        $stmt->execute();
    }
}
