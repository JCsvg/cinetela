<?php

declare(strict_types=1);

namespace Cine\Repositorios;

use Cine\Models\Exibicao;
use DateTimeImmutable;
use PDO;

final class ExibicaoRepositorio
{
    // Exibição com filme, sala, cinema e o número de assentos ainda livres
    private const SELECT = <<<'SQL'
        SELECT e.id, e.filme_id, f.titulo AS filme_titulo, f.poster, f.duracao_min, f.classificacao,
               e.sala_id, s.nome AS sala_nome, s.fileiras, s.assentos_por_fileira,
               s.cinema_id, c.nome AS cinema_nome, c.cidade,
               e.inicia_em, e.preco_inteira, e.idioma, e.formato,
               s.fileiras * s.assentos_por_fileira
                 - (SELECT COUNT(*) FROM ingressos i WHERE i.exibicao_id = e.id AND i.ativo) AS assentos_livres
          FROM exibicoes e
          JOIN filmes f ON f.id = e.filme_id
          JOIN salas s ON s.id = e.sala_id
          JOIN cinemas c ON c.id = s.cinema_id
        SQL;

    public function __construct(private readonly PDO $pdo)
    {
    }

    /**
     * Exibições futuras de um filme, por cinema e horário.
     * $cidade e $data ('2026-10-30') são opcionais.
     *
     * @return list<Exibicao>
     */
    public function listarDoFilme(int $filmeId, string $cidade, string $data): array
    {
        $sql = self::SELECT . ' WHERE e.filme_id = :filme AND e.inicia_em > now()';
        $params = ['filme' => $filmeId];
        if ($cidade !== '') {
            $sql .= ' AND lower(c.cidade) = lower(:cidade)';
            $params['cidade'] = $cidade;
        }
        if ($data !== '') {
            $sql .= ' AND CAST(e.inicia_em AS date) = CAST(:data AS date)';
            $params['data'] = $data;
        }
        $stmt = $this->pdo->prepare($sql . ' ORDER BY c.nome, e.inicia_em');
        $stmt->execute($params);
        return array_map(Exibicao::daLinha(...), $stmt->fetchAll());
    }

    /**
     * Exibições de hoje em diante de um cinema, para o painel do gerente.
     *
     * @return list<Exibicao>
     */
    public function listarDoCinema(int $cinemaId): array
    {
        $stmt = $this->pdo->prepare(
            self::SELECT . ' WHERE s.cinema_id = :cinema AND e.inicia_em >= current_date ORDER BY e.inicia_em, s.nome',
        );
        $stmt->execute(['cinema' => $cinemaId]);
        return array_map(Exibicao::daLinha(...), $stmt->fetchAll());
    }

    public function buscarPorId(int $id): ?Exibicao
    {
        $stmt = $this->pdo->prepare(self::SELECT . ' WHERE e.id = :id');
        $stmt->execute(['id' => $id]);
        $linha = $stmt->fetch();
        return $linha === false ? null : Exibicao::daLinha($linha);
    }

    /**
     * Assentos com ingresso ativo, no formato "D5".
     *
     * @return list<string>
     */
    public function assentosOcupados(int $exibicaoId): array
    {
        $stmt = $this->pdo->prepare(
            "SELECT fileira || numero FROM ingressos WHERE exibicao_id = :id AND ativo ORDER BY fileira, numero",
        );
        $stmt->execute(['id' => $exibicaoId]);
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    /**
     * Já existe outra exibição na mesma sala que se sobreponha ao intervalo
     * [$inicio, $inicio + $duracaoMin)? Passe $ignorarId ao editar.
     */
    public function temConflito(int $salaId, DateTimeImmutable $inicio, int $duracaoMin, int $ignorarId = 0): bool
    {
        $stmt = $this->pdo->prepare(
            "SELECT EXISTS (
                SELECT 1
                  FROM exibicoes e
                  JOIN filmes f ON f.id = e.filme_id
                 WHERE e.sala_id = :sala
                   AND e.id <> :ignorar
                   AND e.inicia_em < CAST(:fim AS timestamptz)
                   AND e.inicia_em + make_interval(mins => f.duracao_min) > CAST(:inicio AS timestamptz)
            )",
        );
        $stmt->execute([
            'sala' => $salaId,
            'ignorar' => $ignorarId,
            'inicio' => $inicio->format(DATE_ATOM),
            'fim' => $inicio->modify("+$duracaoMin minutes")->format(DATE_ATOM),
        ]);
        return (bool) $stmt->fetchColumn();
    }

    /** @param array{filmeId: int, salaId: int, iniciaEm: DateTimeImmutable, precoInteira: float, idioma: string, formato: string} $d */
    public function criar(array $d): int
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO exibicoes (filme_id, sala_id, inicia_em, preco_inteira, idioma, formato)
             VALUES (:filme, :sala, :inicia, :preco, :idioma, :formato) RETURNING id',
        );
        $stmt->execute($this->params($d));
        return (int) $stmt->fetchColumn();
    }

    /** @param array{filmeId: int, salaId: int, iniciaEm: DateTimeImmutable, precoInteira: float, idioma: string, formato: string} $d */
    public function atualizar(int $id, array $d): void
    {
        $stmt = $this->pdo->prepare(
            'UPDATE exibicoes
                SET filme_id = :filme, sala_id = :sala, inicia_em = :inicia,
                    preco_inteira = :preco, idioma = :idioma, formato = :formato
              WHERE id = :id',
        );
        $stmt->execute($this->params($d) + ['id' => $id]);
    }

    /** Lança PDOException (SQLSTATE 23503) se já houver pedidos para a exibição. */
    public function apagar(int $id): void
    {
        $this->pdo->prepare('DELETE FROM exibicoes WHERE id = :id')->execute(['id' => $id]);
    }

    /**
     * @param array<string, mixed> $d
     * @return array<string, mixed>
     */
    private function params(array $d): array
    {
        return [
            'filme' => $d['filmeId'],
            'sala' => $d['salaId'],
            'inicia' => $d['iniciaEm']->format(DATE_ATOM),
            'preco' => $d['precoInteira'],
            'idioma' => $d['idioma'],
            'formato' => $d['formato'],
        ];
    }
}
