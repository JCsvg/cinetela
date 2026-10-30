<?php

declare(strict_types=1);

namespace Cine\Http;

use Closure;

/**
 * Liga (método + caminho) a uma função. O caminho aceita parâmetros numéricos entre chaves:
 * '/api/filmes/{id}' casa com '/api/filmes/42' e entrega ['id' => '42'] ao handler.
 *
 * O handler é uma função (Requisicao $req, array $params): Resposta.
 *
 * Registrar uma rota é GUARDAR um item numa lista; despachar é PERCORRER a lista até achar
 * a primeira rota que combina com a requisição.
 *
 * Estudar antes: 04-php §5 (Closure), §6 (preg_match, preg_replace, grupos com nome) e §11 (roteamento).
 */
final class Router
{
    /** @var list<array{metodo: string, regex: string, handler: Closure}> */
    private array $rotas = [];

    public function get(string $caminho, Closure $handler): void
    {
        $this->adicionar('GET', $caminho, $handler);
    }

    public function post(string $caminho, Closure $handler): void
    {
        $this->adicionar('POST', $caminho, $handler);
    }

    public function put(string $caminho, Closure $handler): void
    {
        $this->adicionar('PUT', $caminho, $handler);
    }

    public function delete(string $caminho, Closure $handler): void
    {
        $this->adicionar('DELETE', $caminho, $handler);
    }

    /**
     * Acha a rota da requisição e chama o handler com ($req, $params).
     *
     * Percorre as rotas na ordem de registro e usa a primeira em que caminho e método casam.
     * $params traz só os grupos com nome do caminho (['id' => '42']). Se o caminho existe mas
     * com outro método, lança 405; se não existe, lança 404.
     *
     * @throws HttpErro 404 se nenhum caminho casar; 405 se casar com outro método
     */
    public function despachar(Requisicao $req): Resposta
    {
        $caminhoExiste = false;

        foreach ($this->rotas as $rota) {
            if (preg_match($rota['regex'], $req->caminho, $casou) !== 1) {
                continue;
            }
            $caminhoExiste = true;
            if ($rota['metodo'] !== $req->metodo) {
                continue;
            }
            $params = array_filter($casou, 'is_string', ARRAY_FILTER_USE_KEY);
            return ($rota['handler'])($req, $params);
        }

        if ($caminhoExiste) {
            throw new HttpErro(405, 'Método não permitido nesta rota');
        }
        throw HttpErro::naoEncontrado('Rota não encontrada');
    }

    /**
     * Guarda a rota, convertendo o caminho em expressão regular: cada {nome} vira um grupo
     * com nome que aceita só dígitos, e o padrão é ancorado no começo e no fim.
     * '/api/filmes/{id}' vira '#^/api/filmes/(?P<id>\d+)$#' ('#' é só o delimitador, para
     * não confundir com as barras do caminho).
     */
    private function adicionar(string $metodo, string $caminho, Closure $handler): void
    {
        $padrao = preg_replace('#\{(\w+)\}#', '(?P<$1>\d+)', $caminho);
        $this->rotas[] = [
            'metodo' => $metodo,
            'regex' => '#^' . $padrao . '$#',
            'handler' => $handler,
        ];
    }
}
