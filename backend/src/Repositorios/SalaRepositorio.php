<?php

declare(strict_types=1);

namespace Cine\Repositorios;

use Cine\Models\Sala;
use PDO;

final class SalaRepositorio
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /** @return list<Sala> */
    public function listarDoCinema(int $cinemaId): array
    {
        $stmt = $this->pdo->prepare('SELECT * FROM salas WHERE cinema_id = :cinema ORDER BY nome');
        $stmt->execute(['cinema' => $cinemaId]);
        return array_map(Sala::daLinha(...), $stmt->fetchAll());
    }

    public function buscarPorId(int $id): ?Sala
    {
        $stmt = $this->pdo->prepare('SELECT * FROM salas WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $linha = $stmt->fetch();
        return $linha === false ? null : Sala::daLinha($linha);
    }

    /** @param array{nome: string, fileiras: int, assentosPorFileira: int} $d */
    public function criar(int $cinemaId, array $d): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO salas (cinema_id, nome, fileiras, assentos_por_fileira)
             VALUES (:cinema, :nome, :fileiras, :assentos) RETURNING id',
        );
        $stmt->execute([
            'cinema' => $cinemaId,
            'nome' => $d['nome'],
            'fileiras' => $d['fileiras'],
            'assentos' => $d['assentosPorFileira'],
        ]);
        return (int) $stmt->fetchColumn();
    }

    /** @param array{nome: string, fileiras: int, assentosPorFileira: int} $d */
    public function atualizar(int $id, array $d): void
    {
        $stmt = $this->pdo->prepare(
            'UPDATE salas SET nome = :nome, fileiras = :fileiras, assentos_por_fileira = :assentos WHERE id = :id',
        );
        $stmt->execute([
            'id' => $id,
            'nome' => $d['nome'],
            'fileiras' => $d['fileiras'],
            'assentos' => $d['assentosPorFileira'],
        ]);
    }

    public function apagar(int $id): void
    {
        $this->pdo->prepare('DELETE FROM salas WHERE id = :id')->execute(['id' => $id]);
    }
}
