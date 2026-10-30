<?php

declare(strict_types=1);

namespace Cine\Database;

use PDOException;

/** Reconhece, pelo código SQLSTATE do Postgres, o que deu errado numa consulta. */
final class Erros
{
    /** 23503: tentou apagar (ou ligar a) algo que outra tabela ainda referencia. */
    public static function chaveEstrangeira(PDOException $e): bool
    {
        return $e->getCode() === '23503';
    }

    /** 23505: valor repetido numa coluna UNIQUE. */
    public static function duplicado(PDOException $e): bool
    {
        return $e->getCode() === '23505';
    }
}
