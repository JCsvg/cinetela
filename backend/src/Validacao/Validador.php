<?php

declare(strict_types=1);

namespace Cine\Validacao;

use Cine\Http\HttpErro;
use DateTimeImmutable;
use DateTimeZone;
use Exception;

/**
 * Lê os campos de um corpo JSON acumulando os erros, para devolver todos
 * de uma vez num 422 em vez de parar no primeiro.
 *
 *     $v = new Validador($req->json());
 *     $titulo = $v->texto('titulo', 3, 120);
 *     $v->validar(); // lança 422 se algum campo falhou
 */
final class Validador
{
    /** @var array<string, string> campo => mensagem */
    private array $erros = [];

    /** @param array<string, mixed> $dados */
    public function __construct(private readonly array $dados)
    {
    }

    /** Texto obrigatório, sem espaços nas pontas, com $min a $max caracteres. */
    public function texto(string $campo, int $min, int $max): string
    {
        $valor = $this->dados[$campo] ?? '';
        if (!is_string($valor)) {
            $this->erros[$campo] = 'Precisa ser um texto.';
            return '';
        }

        $valor = trim($valor);
        $tamanho = mb_strlen($valor);
        if ($tamanho === 0) {
            $this->erros[$campo] = 'Campo obrigatório.';
        } elseif ($tamanho < $min) {
            $this->erros[$campo] = "Use pelo menos $min caracteres.";
        } elseif ($tamanho > $max) {
            $this->erros[$campo] = "Use no máximo $max caracteres.";
        }
        return $valor;
    }

    /** E-mail em minúsculas, no formato nome@dominio. */
    public function email(string $campo): string
    {
        $valor = mb_strtolower($this->texto($campo, 5, 120));
        if (!isset($this->erros[$campo]) && filter_var($valor, FILTER_VALIDATE_EMAIL) === false) {
            $this->erros[$campo] = 'E-mail inválido.';
        }
        return $valor;
    }

    /** Número inteiro (do JSON, não texto) entre $min e $max. */
    public function inteiro(string $campo, int $min, int $max): int
    {
        $valor = $this->dados[$campo] ?? null;
        if (!is_int($valor)) {
            $this->erros[$campo] = $valor === null ? 'Campo obrigatório.' : 'Precisa ser um número inteiro.';
            return 0;
        }
        if ($valor < $min || $valor > $max) {
            $this->erros[$campo] = "Use um valor entre $min e $max.";
        }
        return $valor;
    }

    /** Número com casas decimais (preço), entre $min e $max, com no máximo 2 casas. */
    public function numero(string $campo, float $min, float $max): float
    {
        $valor = $this->dados[$campo] ?? null;
        if (!is_int($valor) && !is_float($valor)) {
            $this->erros[$campo] = $valor === null ? 'Campo obrigatório.' : 'Precisa ser um número.';
            return 0.0;
        }
        $valor = round((float) $valor, 2);
        if ($valor < $min || $valor > $max) {
            $this->erros[$campo] = "Use um valor entre $min e $max.";
        }
        return $valor;
    }

    /**
     * Um valor de uma lista fixa.
     *
     * @param list<string> $permitidas
     */
    public function opcao(string $campo, array $permitidas): string
    {
        $valor = $this->dados[$campo] ?? '';
        if (!is_string($valor) || !in_array($valor, $permitidas, true)) {
            $this->erros[$campo] = 'Escolha uma opção válida: ' . implode(', ', $permitidas) . '.';
            return '';
        }
        return $valor;
    }

    /** Data no formato 2026-10-30. Devolve o próprio texto. */
    public function data(string $campo): string
    {
        $valor = $this->dados[$campo] ?? '';
        $data = is_string($valor) ? DateTimeImmutable::createFromFormat('!Y-m-d', $valor) : false;
        if ($data === false || $data->format('Y-m-d') !== $valor) {
            $this->erros[$campo] = 'Use uma data no formato AAAA-MM-DD.';
            return '';
        }
        return $valor;
    }

    /** Data e hora, como "2026-10-30T19:00", no horário de Brasília. */
    public function dataHora(string $campo): DateTimeImmutable
    {
        $valor = $this->dados[$campo] ?? '';
        try {
            if (!is_string($valor) || $valor === '') {
                throw new Exception('vazio');
            }
            return new DateTimeImmutable($valor, new DateTimeZone('America/Sao_Paulo'));
        } catch (Exception) {
            $this->erros[$campo] = 'Use uma data e hora válidas, como 2026-10-30T19:00.';
            return new DateTimeImmutable();
        }
    }

    public function booleano(string $campo, bool $padrao): bool
    {
        $valor = $this->dados[$campo] ?? $padrao;
        if (!is_bool($valor)) {
            $this->erros[$campo] = 'Precisa ser verdadeiro ou falso.';
            return $padrao;
        }
        return $valor;
    }

    /**
     * A lista de objetos de um campo, ainda sem validar o conteúdo.
     *
     * @return list<array<string, mixed>>
     */
    public function lista(string $campo, int $maximo): array
    {
        $valor = $this->dados[$campo] ?? [];
        if (!is_array($valor) || !array_is_list($valor) || count($valor) > $maximo) {
            $this->erros[$campo] = "Envie uma lista com no máximo $maximo itens.";
            return [];
        }
        foreach ($valor as $item) {
            if (!is_array($item)) {
                $this->erros[$campo] = 'Cada item precisa ser um objeto.';
                return [];
            }
        }
        return $valor;
    }

    /** Registra um erro que só o controller sabe checar (ex.: e-mail já usado). */
    public function erro(string $campo, string $mensagem): void
    {
        $this->erros[$campo] = $mensagem;
    }

    public function temErro(string $campo = ''): bool
    {
        return $campo === '' ? $this->erros !== [] : isset($this->erros[$campo]);
    }

    /** @throws HttpErro 422 com {"erro": ..., "campos": {...}} se houve erro */
    public function validar(): void
    {
        if ($this->erros !== []) {
            throw new HttpErro(422, 'Alguns campos estão inválidos', $this->erros);
        }
    }
}
