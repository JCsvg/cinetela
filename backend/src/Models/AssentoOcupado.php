<?php

declare(strict_types=1);

namespace Cine\Models;

use RuntimeException;

/** O assento já tem um ingresso ativo. O controller transforma em 409. */
final class AssentoOcupado extends RuntimeException
{
}
