<?php

declare(strict_types=1);

namespace Cine\Auth;

use Cine\Http\HttpErro;
use Cine\Http\Requisicao;
use Cine\Models\Usuario;
use Cine\Repositorios\TokenRepositorio;

/** Descobre quem está logado a partir do cabeçalho Authorization. */
final class Autenticador
{
    public function __construct(private readonly TokenRepositorio $tokens)
    {
    }

    /** Token de "Authorization: Bearer <token>", ou null se faltar ou vier malformado. */
    public function token(Requisicao $req): ?string
    {
        $cabecalho = $req->cabecalho('Authorization') ?? '';
        if (preg_match('/^Bearer\s+([a-f0-9]{64})$/i', $cabecalho, $casou) !== 1) {
            return null;
        }
        return strtolower($casou[1]);
    }

    /**
     * O usuário logado, seja qual for o papel.
     *
     * @throws HttpErro 401 sem token, com token inválido ou expirado
     */
    public function exigir(Requisicao $req): Usuario
    {
        $token = $this->token($req);
        $usuario = $token === null ? null : $this->tokens->usuarioDoToken($token);
        if ($usuario === null) {
            throw new HttpErro(401, 'Faça login para continuar');
        }
        return $usuario;
    }

    /** @throws HttpErro 401 sem login, 403 se o papel não é admin */
    public function exigirAdmin(Requisicao $req): Usuario
    {
        $usuario = $this->exigir($req);
        if (!$usuario->ehAdmin()) {
            throw new HttpErro(403, 'Só o administrador pode fazer isto');
        }
        return $usuario;
    }

    /**
     * Gerente do cinema (ou admin).
     *
     * @throws HttpErro 401 sem login, 403 se não for admin nem gerente deste cinema
     */
    public function exigirGerente(Requisicao $req, int $cinemaId): Usuario
    {
        $usuario = $this->exigir($req);
        if (!$usuario->podeGerenciar($cinemaId)) {
            throw new HttpErro(403, 'Você não gerencia este cinema');
        }
        return $usuario;
    }
}
