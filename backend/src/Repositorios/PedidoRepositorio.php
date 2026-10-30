<?php

declare(strict_types=1);

namespace Cine\Repositorios;

use Cine\Models\AssentoOcupado;
use Cine\Models\Exibicao;
use Cine\Models\Pedido;
use PDO;
use PDOException;
use Throwable;

final class PedidoRepositorio
{
    private const SELECT = <<<'SQL'
        SELECT p.id, p.usuario_id, p.exibicao_id, p.total, p.status, p.criado_em,
               f.titulo AS filme_titulo, f.poster, c.nome AS cinema_nome, s.nome AS sala_nome, e.inicia_em
          FROM pedidos p
          JOIN exibicoes e ON e.id = p.exibicao_id
          JOIN filmes f ON f.id = e.filme_id
          JOIN salas s ON s.id = e.sala_id
          JOIN cinemas c ON c.id = s.cinema_id
        SQL;

    public function __construct(private readonly PDO $pdo)
    {
    }

    /**
     * Grava o pedido, os ingressos e os itens da lanchonete numa transação:
     * ou entra tudo, ou nada.
     *
     * @param list<array{fileira: string, numero: int, tipo: string, preco: float}> $ingressos
     * @param list<array{produtoId: int, quantidade: int, precoUnit: float}> $itens
     * @return int id do pedido
     * @throws AssentoOcupado se algum assento foi vendido no meio tempo
     */
    public function criar(int $usuarioId, Exibicao $exibicao, array $ingressos, array $itens, float $total): int
    {
        $this->pdo->beginTransaction();
        try {
            $stmt = $this->pdo->prepare(
                'INSERT INTO pedidos (usuario_id, exibicao_id, total) VALUES (:usuario, :exibicao, :total) RETURNING id',
            );
            $stmt->execute(['usuario' => $usuarioId, 'exibicao' => $exibicao->id, 'total' => $total]);
            $pedidoId = (int) $stmt->fetchColumn();

            $inserirIngresso = $this->pdo->prepare(
                'INSERT INTO ingressos (pedido_id, exibicao_id, fileira, numero, tipo, preco)
                 VALUES (:pedido, :exibicao, :fileira, :numero, :tipo, :preco)',
            );
            foreach ($ingressos as $ingresso) {
                try {
                    $inserirIngresso->execute([
                        'pedido' => $pedidoId,
                        'exibicao' => $exibicao->id,
                        'fileira' => $ingresso['fileira'],
                        'numero' => $ingresso['numero'],
                        'tipo' => $ingresso['tipo'],
                        'preco' => $ingresso['preco'],
                    ]);
                } catch (PDOException $e) {
                    // 23505 = unique_violation: o índice ingressos_assento_unico barrou
                    if ($e->getCode() === '23505') {
                        throw new AssentoOcupado("O assento {$ingresso['fileira']}{$ingresso['numero']} acabou de ser vendido");
                    }
                    throw $e;
                }
            }

            $inserirItem = $this->pdo->prepare(
                'INSERT INTO pedido_itens (pedido_id, produto_id, quantidade, preco_unit)
                 VALUES (:pedido, :produto, :quantidade, :preco)',
            );
            foreach ($itens as $item) {
                $inserirItem->execute([
                    'pedido' => $pedidoId,
                    'produto' => $item['produtoId'],
                    'quantidade' => $item['quantidade'],
                    'preco' => $item['precoUnit'],
                ]);
            }

            $this->pdo->commit();
            return $pedidoId;
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    public function buscarPorId(int $id): ?Pedido
    {
        $stmt = $this->pdo->prepare(self::SELECT . ' WHERE p.id = :id');
        $stmt->execute(['id' => $id]);
        $linha = $stmt->fetch();
        return $linha === false ? null : $this->hidratar($linha);
    }

    /**
     * Pedidos do cliente, do mais novo para o mais antigo.
     *
     * @return list<Pedido>
     */
    public function listarDoUsuario(int $usuarioId): array
    {
        $stmt = $this->pdo->prepare(self::SELECT . ' WHERE p.usuario_id = :usuario ORDER BY p.criado_em DESC, p.id DESC');
        $stmt->execute(['usuario' => $usuarioId]);
        return array_map($this->hidratar(...), $stmt->fetchAll());
    }

    /** Marca o pedido como cancelado e libera os assentos (ativo = false). */
    public function cancelar(int $id): void
    {
        $this->pdo->beginTransaction();
        try {
            $this->pdo->prepare("UPDATE pedidos SET status = 'cancelado' WHERE id = :id")->execute(['id' => $id]);
            $this->pdo->prepare('UPDATE ingressos SET ativo = false WHERE pedido_id = :id')->execute(['id' => $id]);
            $this->pdo->commit();
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    /**
     * Números do painel do gerente: tudo de UM cinema, só pedidos pagos.
     *
     * @return array<string, mixed>
     */
    public function vendasDoCinema(int $cinemaId): array
    {
        $parametros = ['cinema' => $cinemaId];
        $juncao = 'FROM pedidos p
                   JOIN exibicoes e ON e.id = p.exibicao_id
                   JOIN salas s ON s.id = e.sala_id';

        $stmt = $this->pdo->prepare("SELECT COUNT(*) AS pedidos, COALESCE(SUM(p.total), 0) AS receita $juncao
                                      WHERE s.cinema_id = :cinema AND p.status = 'pago'");
        $stmt->execute($parametros);
        $totais = $stmt->fetch();

        $stmt = $this->pdo->prepare("SELECT COALESCE(SUM(i.preco), 0) AS receita, COUNT(i.id) AS ingressos
                                       FROM ingressos i
                                       JOIN exibicoes e ON e.id = i.exibicao_id
                                       JOIN salas s ON s.id = e.sala_id
                                      WHERE s.cinema_id = :cinema AND i.ativo");
        $stmt->execute($parametros);
        $ingressos = $stmt->fetch();

        $stmt = $this->pdo->prepare("SELECT COALESCE(SUM(pi.quantidade * pi.preco_unit), 0)
                                       FROM pedido_itens pi
                                       JOIN pedidos p ON p.id = pi.pedido_id
                                       JOIN exibicoes e ON e.id = p.exibicao_id
                                       JOIN salas s ON s.id = e.sala_id
                                      WHERE s.cinema_id = :cinema AND p.status = 'pago'");
        $stmt->execute($parametros);
        $lanchonete = (float) $stmt->fetchColumn();

        $stmt = $this->pdo->prepare("SELECT f.titulo, COUNT(i.id) AS ingressos, SUM(i.preco) AS receita
                                       FROM ingressos i
                                       JOIN exibicoes e ON e.id = i.exibicao_id
                                       JOIN filmes f ON f.id = e.filme_id
                                       JOIN salas s ON s.id = e.sala_id
                                      WHERE s.cinema_id = :cinema AND i.ativo
                                      GROUP BY f.titulo
                                      ORDER BY receita DESC, f.titulo");
        $stmt->execute($parametros);
        $porFilme = array_map(fn (array $l): array => [
            'filme' => $l['titulo'],
            'ingressos' => $l['ingressos'],
            'receita' => (float) $l['receita'],
        ], $stmt->fetchAll());

        $stmt = $this->pdo->prepare("SELECT to_char(p.criado_em, 'YYYY-MM-DD') AS dia, COUNT(*) AS pedidos, SUM(p.total) AS receita
                                      $juncao
                                      WHERE s.cinema_id = :cinema AND p.status = 'pago'
                                      GROUP BY dia
                                      ORDER BY dia DESC
                                      LIMIT 7");
        $stmt->execute($parametros);
        $porDia = array_map(fn (array $l): array => [
            'dia' => $l['dia'],
            'pedidos' => $l['pedidos'],
            'receita' => (float) $l['receita'],
        ], $stmt->fetchAll());

        return [
            'pedidos' => $totais['pedidos'],
            'receitaTotal' => (float) $totais['receita'],
            'receitaIngressos' => (float) $ingressos['receita'],
            'receitaLanchonete' => $lanchonete,
            'ingressosVendidos' => $ingressos['ingressos'],
            'porFilme' => $porFilme,
            'porDia' => $porDia,
        ];
    }

    /**
     * Números do painel do administrador, de todos os cinemas.
     *
     * @return array<string, mixed>
     */
    public function relatorioGeral(): array
    {
        $totais = $this->pdo->query("SELECT COUNT(*) AS pedidos, COALESCE(SUM(total), 0) AS receita
                                       FROM pedidos WHERE status = 'pago'")->fetch();
        $ingressos = (int) $this->pdo->query('SELECT COUNT(*) FROM ingressos WHERE ativo')->fetchColumn();

        $porCinema = $this->pdo->query("SELECT c.id, c.nome, COUNT(p.id) AS pedidos, COALESCE(SUM(p.total), 0) AS receita
                                          FROM cinemas c
                                          LEFT JOIN salas s ON s.cinema_id = c.id
                                          LEFT JOIN exibicoes e ON e.sala_id = s.id
                                          LEFT JOIN pedidos p ON p.exibicao_id = e.id AND p.status = 'pago'
                                         GROUP BY c.id, c.nome
                                         ORDER BY receita DESC, c.nome")->fetchAll();

        $topFilmes = $this->pdo->query("SELECT f.titulo, COUNT(i.id) AS ingressos
                                          FROM ingressos i
                                          JOIN exibicoes e ON e.id = i.exibicao_id
                                          JOIN filmes f ON f.id = e.filme_id
                                         WHERE i.ativo
                                         GROUP BY f.titulo
                                         ORDER BY ingressos DESC, f.titulo
                                         LIMIT 5")->fetchAll();

        $usuarios = $this->pdo->query('SELECT papel, COUNT(*) AS total FROM usuarios GROUP BY papel ORDER BY papel')->fetchAll();

        return [
            'pedidos' => $totais['pedidos'],
            'receitaTotal' => (float) $totais['receita'],
            'ingressosVendidos' => $ingressos,
            'porCinema' => array_map(fn (array $l): array => [
                'cinemaId' => $l['id'],
                'cinema' => $l['nome'],
                'pedidos' => $l['pedidos'],
                'receita' => (float) $l['receita'],
            ], $porCinema),
            'topFilmes' => array_map(fn (array $l): array => ['filme' => $l['titulo'], 'ingressos' => $l['ingressos']], $topFilmes),
            'usuarios' => array_map(fn (array $l): array => ['papel' => $l['papel'], 'total' => $l['total']], $usuarios),
        ];
    }

    /** @param array<string, mixed> $linha */
    private function hidratar(array $linha): Pedido
    {
        $stmt = $this->pdo->prepare('SELECT fileira, numero, tipo, preco FROM ingressos WHERE pedido_id = :id ORDER BY fileira, numero');
        $stmt->execute(['id' => $linha['id']]);
        $ingressos = $stmt->fetchAll();

        $stmt = $this->pdo->prepare(
            'SELECT pi.produto_id, pr.nome, pi.quantidade, pi.preco_unit
               FROM pedido_itens pi
               JOIN produtos pr ON pr.id = pi.produto_id
              WHERE pi.pedido_id = :id
              ORDER BY pi.id',
        );
        $stmt->execute(['id' => $linha['id']]);

        return Pedido::daLinha($linha, $ingressos, $stmt->fetchAll());
    }
}
