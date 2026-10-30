<?php

declare(strict_types=1);

namespace Cine\Http;

/**
 * Libera o front hospedado em outro endereço (por exemplo, o GitHub Pages) a chamar a API.
 *
 * Só age se a variável CORS_ORIGIN estiver definida, com um ou mais endereços separados por vírgula
 * (ex.: https://usuario.github.io). Em desenvolvimento ela não existe: o front e a API usam o mesmo
 * endereço (proxy do Vite) e nada muda.
 */
final class Cors
{
    public static function aplicar(): void
    {
        $permitidas = array_filter(array_map('trim', explode(',', getenv('CORS_ORIGIN') ?: '')));
        $origem = $_SERVER['HTTP_ORIGIN'] ?? '';
        if ($origem === '' || !in_array($origem, $permitidas, true)) {
            return;
        }

        header('Access-Control-Allow-Origin: ' . $origem);
        header('Vary: Origin');
        header('Access-Control-Allow-Headers: Authorization, Content-Type, Accept');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Max-Age: 600');

        // Pré-voo: o navegador pergunta se pode antes de mandar um pedido com Authorization
        if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }
}
