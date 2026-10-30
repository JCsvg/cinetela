<?php

declare(strict_types=1);

namespace Cine\Repositorios;

use Cine\Models\Produto;
use PDO;

final class ProdutoRepositorio
{
    public function __construct(private readonly PDO $pdo)
    {
    }

    /** @return list<Produto> */
    public function listarDoCinema(int $cinemaId, bool $apenasAtivos): array
    {
        $sql = 'SELECT * FROM produtos WHERE cinema_id = :cinema';
        if ($apenasAtivos) {
            $sql .= ' AND ativo';
        }
        $stmt = $this->pdo->prepare($sql . ' ORDER BY categoria, preco');
        $stmt->execute(['cinema' => $cinemaId]);
        return array_map(Produto::daLinha(...), $stmt->fetchAll());
    }

    public function buscarPorId(int $id): ?Produto
    {
        $stmt = $this->pdo->prepare('SELECT * FROM produtos WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $linha = $stmt->fetch();
        return $linha === false ? null : Produto::daLinha($linha);
    }

    /** @param array{nome: string, descricao: string, categoria: string, preco: float, imagem: string, ativo: bool} $d */
    public function criar(int $cinemaId, array $d): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO produtos (cinema_id, nome, descricao, categoria, preco, imagem, ativo)
             VALUES (:cinema, :nome, :descricao, :categoria, :preco, :imagem, :ativo) RETURNING id',
        );
        $stmt->bindValue('cinema', $cinemaId, PDO::PARAM_INT);
        $this->bindCampos($stmt, $d);
        $stmt->execute();
        return (int) $stmt->fetchColumn();
    }

    /** @param array{nome: string, descricao: string, categoria: string, preco: float, imagem: string, ativo: bool} $d */
    public function atualizar(int $id, array $d): void
    {
        $stmt = $this->pdo->prepare(
            'UPDATE produtos
                SET nome = :nome, descricao = :descricao, categoria = :categoria,
                    preco = :preco, imagem = :imagem, ativo = :ativo
              WHERE id = :id',
        );
        $stmt->bindValue('id', $id, PDO::PARAM_INT);
        $this->bindCampos($stmt, $d);
        $stmt->execute();
    }

    /** Lança PDOException (SQLSTATE 23503) se o produto já foi vendido: desative em vez de apagar. */
    public function apagar(int $id): void
    {
        $this->pdo->prepare('DELETE FROM produtos WHERE id = :id')->execute(['id' => $id]);
    }

    /** @param array<string, mixed> $d */
    private function bindCampos(\PDOStatement $stmt, array $d): void
    {
        $stmt->bindValue('nome', $d['nome']);
        $stmt->bindValue('descricao', $d['descricao']);
        $stmt->bindValue('categoria', $d['categoria']);
        $stmt->bindValue('preco', $d['preco']);
        $stmt->bindValue('imagem', $d['imagem']);
        $stmt->bindValue('ativo', $d['ativo'], PDO::PARAM_BOOL);
    }
}
