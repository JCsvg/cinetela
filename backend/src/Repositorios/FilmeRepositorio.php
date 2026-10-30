<?php

declare(strict_types=1);

namespace Cine\Repositorios;

use Cine\Models\Filme;
use PDO;

final class FilmeRepositorio
{
    // em_cartaz: o filme tem pelo menos uma exibição que ainda não começou
    private const SELECT = <<<'SQL'
        SELECT f.*,
               EXISTS (SELECT 1 FROM exibicoes e WHERE e.filme_id = f.id AND e.inicia_em > now()) AS em_cartaz
          FROM filmes f
        SQL;

    public function __construct(private readonly PDO $pdo)
    {
    }

    /** @return list<Filme> */
    public function listar(string $genero, string $busca, bool $apenasEmCartaz, int $limite, int $deslocamento): array
    {
        [$where, $params] = $this->filtro($genero, $busca, $apenasEmCartaz);
        $stmt = $this->pdo->prepare(
            self::SELECT . " $where ORDER BY f.estreia DESC, f.id DESC LIMIT :limite OFFSET :deslocamento",
        );
        foreach ($params as $nome => $valor) {
            $stmt->bindValue($nome, $valor);
        }
        $stmt->bindValue('limite', $limite, PDO::PARAM_INT);
        $stmt->bindValue('deslocamento', $deslocamento, PDO::PARAM_INT);
        $stmt->execute();

        return array_map(Filme::daLinha(...), $stmt->fetchAll());
    }

    public function contar(string $genero, string $busca, bool $apenasEmCartaz): int
    {
        [$where, $params] = $this->filtro($genero, $busca, $apenasEmCartaz);
        $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM filmes f $where");
        $stmt->execute($params);
        return (int) $stmt->fetchColumn();
    }

    public function buscarPorId(int $id): ?Filme
    {
        $stmt = $this->pdo->prepare(self::SELECT . ' WHERE f.id = :id');
        $stmt->execute(['id' => $id]);
        $linha = $stmt->fetch();
        return $linha === false ? null : Filme::daLinha($linha);
    }

    /** @return list<string> */
    public function generos(): array
    {
        return $this->pdo->query('SELECT DISTINCT genero FROM filmes ORDER BY genero')->fetchAll(PDO::FETCH_COLUMN);
    }

    /** @param array<string, mixed> $d chaves: titulo, sinopse, genero, duracaoMin, classificacao, estreia, poster, fundo */
    public function criar(array $d): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO filmes (titulo, sinopse, genero, duracao_min, classificacao, estreia, poster, fundo)
             VALUES (:titulo, :sinopse, :genero, :duracao, :classificacao, :estreia, :poster, :fundo)
             RETURNING id',
        );
        $stmt->execute($this->params($d));
        return (int) $stmt->fetchColumn();
    }

    /** @param array<string, mixed> $d */
    public function atualizar(int $id, array $d): void
    {
        $stmt = $this->pdo->prepare(
            'UPDATE filmes
                SET titulo = :titulo, sinopse = :sinopse, genero = :genero, duracao_min = :duracao,
                    classificacao = :classificacao, estreia = :estreia, poster = :poster, fundo = :fundo
              WHERE id = :id',
        );
        $stmt->execute($this->params($d) + ['id' => $id]);
    }

    /** Lança PDOException (SQLSTATE 23503) se o filme ainda tem exibições. */
    public function apagar(int $id): void
    {
        $this->pdo->prepare('DELETE FROM filmes WHERE id = :id')->execute(['id' => $id]);
    }

    /**
     * @param array<string, mixed> $d
     * @return array<string, mixed>
     */
    private function params(array $d): array
    {
        return [
            'titulo' => $d['titulo'],
            'sinopse' => $d['sinopse'],
            'genero' => $d['genero'],
            'duracao' => $d['duracaoMin'],
            'classificacao' => $d['classificacao'],
            'estreia' => $d['estreia'],
            'poster' => $d['poster'],
            'fundo' => $d['fundo'],
        ];
    }

    /**
     * WHERE compartilhado por listar() e contar().
     *
     * @return array{0: string, 1: array<string, string>}
     */
    private function filtro(string $genero, string $busca, bool $apenasEmCartaz): array
    {
        $condicoes = [];
        $params = [];

        if ($genero !== '') {
            $condicoes[] = 'lower(f.genero) = lower(:genero)';
            $params['genero'] = $genero;
        }
        if ($busca !== '') {
            $condicoes[] = "(f.titulo || ' ' || f.sinopse) ILIKE :busca";
            $params['busca'] = '%' . addcslashes($busca, '%_\\') . '%';
        }
        if ($apenasEmCartaz) {
            $condicoes[] = 'EXISTS (SELECT 1 FROM exibicoes e WHERE e.filme_id = f.id AND e.inicia_em > now())';
        }

        $where = $condicoes === [] ? '' : 'WHERE ' . implode(' AND ', $condicoes);
        return [$where, $params];
    }
}
