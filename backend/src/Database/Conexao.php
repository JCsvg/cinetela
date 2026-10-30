<?php

declare(strict_types=1);

namespace Cine\Database;

use PDO;

/**
 * Abre a conexão com o PostgreSQL.
 *
 * Cria-se um PDO por requisição e ele é passado a quem precisa (os repositórios). Os dados de
 * acesso vêm das variáveis de ambiente definidas no docker-compose.yml, não do código.
 */
final class Conexao
{
    public static function criar(): PDO
    {
        $dsn = sprintf(
            'pgsql:host=%s;port=%s;dbname=%s',
            getenv('DB_HOST') ?: 'db',
            getenv('DB_PORT') ?: '5432',
            getenv('DB_NAME') ?: 'cine',
        );
        // Bancos hospedados (Neon, Render) exigem SSL: DB_SSLMODE=require. Local, a variável não existe.
        if (getenv('DB_SSLMODE')) {
            $dsn .= ';sslmode=' . getenv('DB_SSLMODE');
        }

        $pdo = new PDO($dsn, getenv('DB_USER') ?: 'cine', getenv('DB_PASS') ?: 'cine', [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);

        // Os horários do app são de Brasília, qualquer que seja a configuração do banco
        $pdo->exec("SET TIME ZONE 'America/Sao_Paulo'");

        return $pdo;
    }
}
