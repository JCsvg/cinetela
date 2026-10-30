<?php

declare(strict_types=1);

namespace Cine\Http;

use RuntimeException;

/**
 * Erro que carrega o status HTTP da resposta.
 *
 * Pode ser lançado de qualquer camada (`throw new HttpErro(404, 'Filme não encontrado')`).
 * O index.php o captura e o converte em resposta JSON com o status correspondente, assim
 * nenhum controller precisa montar a resposta de erro por conta própria.
 */
final class HttpErro extends RuntimeException
{
    /**
     * @param int                   $status   código HTTP da resposta
     * @param string                $mensagem texto do erro, devolvido por getMessage()
     * @param array<string, string> $campos   erros por campo, usado no 422 (validação)
     */
    public function __construct(
        public readonly int $status,
        string $mensagem,
        public readonly array $campos = [],
    ) {
        parent::__construct($mensagem);
    }

    /** Atalho para o 404. */
    public static function naoEncontrado(string $mensagem = 'Recurso não encontrado'): self
    {
        return new self(404, $mensagem);
    }

    /**
     * Corpo JSON do erro. A chave `campos` só aparece quando há erros por campo:
     *   ['erro' => 'mensagem']
     *   ['erro' => 'mensagem', 'campos' => ['titulo' => 'Campo obrigatório.']]
     *
     * @return array<string, mixed>
     */
    public function corpo(): array
    {
        $corpo = ['erro' => $this->getMessage()];
        if ($this->campos !== []) {
            $corpo['campos'] = $this->campos;
        }
        return $corpo;
    }
}
