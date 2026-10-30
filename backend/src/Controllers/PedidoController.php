<?php

declare(strict_types=1);

namespace Cine\Controllers;

use Cine\Auth\Autenticador;
use Cine\Http\HttpErro;
use Cine\Http\Requisicao;
use Cine\Http\Resposta;
use Cine\Models\AssentoOcupado;
use Cine\Models\Pedido;
use Cine\Repositorios\ExibicaoRepositorio;
use Cine\Repositorios\PedidoRepositorio;
use Cine\Repositorios\ProdutoRepositorio;
use Cine\Validacao\Validador;
use DateTimeImmutable;

final class PedidoController
{
    private const MAX_INGRESSOS = 8;

    public function __construct(
        private readonly PedidoRepositorio $pedidos,
        private readonly ExibicaoRepositorio $exibicoes,
        private readonly ProdutoRepositorio $produtos,
        private readonly Autenticador $autenticador,
    ) {
    }

    /**
     * POST /api/pedidos
     * {
     *   "exibicaoId": 12,
     *   "ingressos": [{"fileira": "D", "numero": 5, "tipo": "inteira"}],
     *   "itens": [{"produtoId": 3, "quantidade": 2}],
     *   "pagamento": {"titular": "...", "numero": "4111 1111 1111 1111", "validade": "12/30", "cvv": "123"}
     * }
     * O preço NUNCA vem do front: o total é calculado aqui.
     */
    public function criar(Requisicao $req): Resposta
    {
        $usuario = $this->autenticador->exigir($req);
        $corpo = $req->json();
        $v = new Validador($corpo);

        $exibicaoId = $v->inteiro('exibicaoId', 1, PHP_INT_MAX);
        $ingressosBrutos = $v->lista('ingressos', self::MAX_INGRESSOS);
        $itensBrutos = $v->lista('itens', 20);
        if (!$v->temErro('ingressos') && $ingressosBrutos === []) {
            $v->erro('ingressos', 'Escolha pelo menos 1 assento.');
        }
        $this->validarPagamento($corpo['pagamento'] ?? null, $v);
        $v->validar();

        $exibicao = $this->exibicoes->buscarPorId($exibicaoId) ?? throw HttpErro::naoEncontrado('Exibição não encontrada');
        if ($exibicao->jaComecou()) {
            throw new HttpErro(409, 'Esta exibição já começou');
        }

        // Cada assento: existe na sala? tipo válido? repetido no pedido?
        $letras = array_map(chr(...), range(65, 64 + $exibicao->fileiras));
        $ingressos = [];
        $vistos = [];
        foreach ($ingressosBrutos as $bruto) {
            $fileira = $bruto['fileira'] ?? null;
            $numero = $bruto['numero'] ?? null;
            $tipo = $bruto['tipo'] ?? null;
            if (!in_array($fileira, $letras, true) || !is_int($numero) || $numero < 1 || $numero > $exibicao->assentosPorFileira) {
                $v->erro('ingressos', 'Há um assento que não existe nesta sala.');
                break;
            }
            if (!in_array($tipo, ['inteira', 'meia'], true)) {
                $v->erro('ingressos', 'O tipo do ingresso é inteira ou meia.');
                break;
            }
            if (isset($vistos["$fileira$numero"])) {
                $v->erro('ingressos', "O assento $fileira$numero apareceu duas vezes.");
                break;
            }
            $vistos["$fileira$numero"] = true;
            $ingressos[] = [
                'fileira' => $fileira,
                'numero' => $numero,
                'tipo' => $tipo,
                'preco' => $tipo === 'meia' ? $exibicao->precoMeia() : $exibicao->precoInteira,
            ];
        }

        // Cada item da lanchonete: existe, é deste cinema e está ativo?
        $itens = [];
        foreach ($itensBrutos as $bruto) {
            $produtoId = $bruto['produtoId'] ?? null;
            $quantidade = $bruto['quantidade'] ?? null;
            $produto = is_int($produtoId) ? $this->produtos->buscarPorId($produtoId) : null;
            if ($produto === null || $produto->cinemaId !== $exibicao->cinemaId || !$produto->ativo) {
                $v->erro('itens', 'Há um item da lanchonete que não está disponível neste cinema.');
                break;
            }
            if (!is_int($quantidade) || $quantidade < 1 || $quantidade > 10) {
                $v->erro('itens', 'A quantidade de cada item vai de 1 a 10.');
                break;
            }
            $itens[] = ['produtoId' => $produto->id, 'quantidade' => $quantidade, 'precoUnit' => $produto->preco];
        }
        $v->validar();

        $total = array_sum(array_column($ingressos, 'preco'))
            + array_sum(array_map(fn (array $i): float => $i['quantidade'] * $i['precoUnit'], $itens));

        // Confere antes (resposta rápida e amigável)...
        $ocupados = $this->exibicoes->assentosOcupados($exibicao->id);
        foreach ($ingressos as $ingresso) {
            if (in_array($ingresso['fileira'] . $ingresso['numero'], $ocupados, true)) {
                throw new HttpErro(409, "O assento {$ingresso['fileira']}{$ingresso['numero']} já foi vendido");
            }
        }

        // ...e grava de verdade. Se duas pessoas chegarem juntas, o índice único do banco decide.
        try {
            $pedidoId = $this->pedidos->criar($usuario->id, $exibicao, $ingressos, $itens, round($total, 2));
        } catch (AssentoOcupado $e) {
            throw new HttpErro(409, $e->getMessage());
        }

        return Resposta::json($this->pedidos->buscarPorId($pedidoId), 201);
    }

    /** GET /api/meus-pedidos */
    public function meus(Requisicao $req): Resposta
    {
        $usuario = $this->autenticador->exigir($req);
        return Resposta::json($this->pedidos->listarDoUsuario($usuario->id));
    }

    /** GET /api/pedidos/{id}: só o dono (ou o admin) */
    public function mostrar(Requisicao $req, array $params): Resposta
    {
        return Resposta::json($this->buscarDoDono($req, (int) $params['id']));
    }

    /** DELETE /api/pedidos/{id} -> 200 com o pedido cancelado, até 2 horas antes */
    public function cancelar(Requisicao $req, array $params): Resposta
    {
        $pedido = $this->buscarDoDono($req, (int) $params['id']);
        if (!$pedido->podeCancelar()) {
            throw new HttpErro(409, 'Só dá para cancelar pedidos pagos, até 2 horas antes da exibição');
        }
        $this->pedidos->cancelar($pedido->id);
        return Resposta::json($this->pedidos->buscarPorId($pedido->id));
    }

    /** 401 sem login, 404 se não existe, 403 se é de outro cliente. */
    private function buscarDoDono(Requisicao $req, int $id): Pedido
    {
        $usuario = $this->autenticador->exigir($req);
        $pedido = $this->pedidos->buscarPorId($id) ?? throw HttpErro::naoEncontrado('Pedido não encontrado');
        if ($pedido->usuarioId !== $usuario->id && !$usuario->ehAdmin()) {
            throw new HttpErro(403, 'Este pedido é de outra pessoa');
        }
        return $pedido;
    }

    /**
     * Pagamento simulado: só confere o formato do cartão. Nada é guardado.
     * Os erros entram no mesmo Validador, com chaves como "pagamento.numero".
     */
    private function validarPagamento(mixed $pagamento, Validador $v): void
    {
        if (!is_array($pagamento)) {
            $v->erro('pagamento', 'Informe os dados do cartão.');
            return;
        }
        $titular = $pagamento['titular'] ?? '';
        $numero = preg_replace('/\s+/', '', (string) ($pagamento['numero'] ?? ''));
        $validade = (string) ($pagamento['validade'] ?? '');
        $cvv = (string) ($pagamento['cvv'] ?? '');

        if (!is_string($titular) || mb_strlen(trim($titular)) < 3) {
            $v->erro('pagamento.titular', 'Informe o nome como está no cartão.');
        }
        if (preg_match('/^\d{16}$/', $numero) !== 1) {
            $v->erro('pagamento.numero', 'O número do cartão tem 16 dígitos.');
        }
        if (preg_match('/^(0[1-9]|1[0-2])\/(\d{2})$/', $validade, $m) !== 1) {
            $v->erro('pagamento.validade', 'Use o formato MM/AA.');
        } elseif (DateTimeImmutable::createFromFormat('!m/y', $validade)->modify('last day of this month 23:59:59') < new DateTimeImmutable()) {
            $v->erro('pagamento.validade', 'Cartão vencido.');
        }
        if (preg_match('/^\d{3,4}$/', $cvv) !== 1) {
            $v->erro('pagamento.cvv', 'O código de segurança tem 3 ou 4 dígitos.');
        }
    }
}
