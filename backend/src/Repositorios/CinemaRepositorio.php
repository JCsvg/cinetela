<?php

declare(strict_types=1);

namespace Cine\Repositorios;

use Cine\Models\Cinema;
use PDO;

final class CinemaRepositorio
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /** @return list<Cinema> */
    public function listar(string $cidade = ''): array
    {
        $sql = 'SELECT * FROM cinemas';
        $params = [];
        if ($cidade !== '') {
            $sql .= ' WHERE lower(cidade) = lower(:cidade)';
            $params['cidade'] = $cidade;
        }
        $stmt = $this->pdo->prepare($sql . ' ORDER BY cidade, nome');
        $stmt->execute($params);
        return array_map(Cinema::daLinha(...), $stmt->fetchAll());
    }

    public function buscarPorId(int $id): ?Cinema
    {
        $stmt = $this->pdo->prepare('SELECT * FROM cinemas WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $linha = $stmt->fetch();
        return $linha === false ? null : Cinema::daLinha($linha);
    }

    /** @return list<string> */
    public function cidades(): array
    {
        return $this->pdo->query('SELECT DISTINCT cidade FROM cinemas ORDER BY cidade')->fetchAll(PDO::FETCH_COLUMN);
    }

    /** @param array{nome: string, cidade: string, endereco: string, imagem: string} $d */
    public function criar(array $d): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO cinemas (nome, cidade, endereco, imagem)
             VALUES (:nome, :cidade, :endereco, :imagem) RETURNING id',
        );
        $stmt->execute($d);
        return (int) $stmt->fetchColumn();
    }

    /** @param array{nome: string, cidade: string, endereco: string, imagem: string} $d */
    public function atualizar(int $id, array $d): void
    {
        $stmt = $this->pdo->prepare(
            'UPDATE cinemas SET nome = :nome, cidade = :cidade, endereco = :endereco, imagem = :imagem WHERE id = :id',
        );
        $stmt->execute($d + ['id' => $id]);
    }

    /** Lança PDOException (SQLSTATE 23503) se o cinema ainda tem salas, gerentes ou produtos. */
    public function apagar(int $id): void
    {
        $this->pdo->prepare('DELETE FROM cinemas WHERE id = :id')->execute(['id' => $id]);
    }
}
