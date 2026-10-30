<?php

declare(strict_types=1);

namespace Cine\Http;

use JsonSerializable;

/**
 * O que um controller devolve: um status e, quando há, os dados.
 *
 * O controller só decide o que responder. Quem escreve na saída é o index.php, uma vez
 * só e no fim, de modo que sucesso e erro saem pelo mesmo caminho.
 */
final class Resposta
{
    /** Construtor privado: uma Resposta só nasce pelas fábricas json() e semConteudo(). */
    private function __construct(
        public readonly int $status,
        public readonly array|JsonSerializable|null $dados,
    ) {
    }

    /**
     * Resposta com corpo JSON.
     *
     * @param array<mixed>|JsonSerializable $dados
     */
    public static function json(array|JsonSerializable $dados, int $status = 200): self
    {
        return new self($status, $dados);
    }

    /** 204: deu certo e não há corpo (DELETE, logout). */
    public static function semConteudo(): self
    {
        return new self(204, null);
    }

    /**
     * Escreve a resposta na saída: status, cabeçalho e corpo JSON.
     *
     * Sem dados (204), envia só o status, sem Content-Type nem corpo. Deve ser chamado
     * antes de qualquer outra saída, porque header() não funciona depois dela.
     */
    public function enviar(): void
    {
        http_response_code($this->status);
        if ($this->dados === null) {
            return;
        }
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($this->dados, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    }
}
