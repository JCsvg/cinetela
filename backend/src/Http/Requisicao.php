<?php

declare(strict_types=1);

namespace Cine\Http;

/**
 * Tudo que o PHP sabe sobre a requisição atual, num objeto só.
 *
 * O PHP espalha a requisição em $_SERVER, $_GET e php://input. Os controllers leem daqui,
 * por métodos com nome e tipo, e nunca tocam nas superglobais.
 *
 * Estudar antes: 04-php §4 (arrays), §6 (filter_var, str_starts_with) e §10 (superglobais, json_decode).
 */
final class Requisicao
{
    /**
     * @param array<string, mixed>  $query      query string já separada ($_GET)
     * @param array<string, string> $cabecalhos nomes em minúsculas, ex.: 'authorization'
     */
    public function __construct(
        public readonly string $metodo,
        public readonly string $caminho,
        public readonly array $query,
        public readonly array $cabecalhos,
        private readonly string $corpoBruto,
    ) {
    }

    /**
     * Monta a Requisicao a partir das superglobais do PHP.
     *
     * O método vem em maiúsculas ('GET' se faltar). O caminho é só o path da URL, sem a query
     * string nem a barra final ('/api/filmes/?x=1' vira '/api/filmes'; vazio vira '/'). Os
     * cabeçalhos são as chaves HTTP_* de $_SERVER, em minúsculas e com hífen
     * ('HTTP_USER_AGENT' vira 'user-agent').
     */
    public static function doServidor(): self
    {
        # Cabeçalhos
        $cabList = [];
        foreach ($_SERVER as $key => $value) {
            if(\str_starts_with($key, 'HTTP_')){
                $chaveFormatada = substr($key, 5);
                $chaveFormatada = strtolower($chaveFormatada);
                $chaveFormatada = str_replace('_', '-', $chaveFormatada);
                $cabList[$chaveFormatada] = $value;
            }
        }

        # Caminho
        $caminho = $_SERVER['REQUEST_URI'] ?? '/';
        $caminho = parse_url($caminho, PHP_URL_PATH)?: '/';
        $caminho = rtrim($caminho, '/');
        $caminho = ($caminho === '')? '/' : $caminho;

        # Montador
        return new self(
            metodo: strtoupper($_SERVER['REQUEST_METHOD']?:'GET'),
            caminho: $caminho,
            query: $_GET,
            cabecalhos: $cabList,
            corpoBruto: file_get_contents('php://input')?: ''
        );
    }

    /** Valor de um cabeçalho (o nome não diferencia maiúsculas), ou null se não existir. */
    public function cabecalho(string $nome): ?string
    {
        return $this->cabecalhos[strtolower($nome)] ?? null;
    }

    /**
     * O corpo JSON como array associativo.
     *
     * Corpo vazio (ou só espaços) devolve []. JSON quebrado e JSON que não seja um objeto
     * (número, texto ou lista como [1, 2]) viram HttpErro 400. O objeto vazio {} é aceito
     * e também devolve [].
     *
     * @return array<string, mixed>
     * @throws HttpErro
     */
    public function json(): array
    {
        # Caso 1: corpo vazio;
        $corpoFormatado = trim($this->corpoBruto);
        if($corpoFormatado === ''){
            return [];
        }

        # Caso 2: Json Inválido;
        try{
            $jsonDados = json_decode($this->corpoBruto, true, 512, JSON_THROW_ON_ERROR);
        }catch (\JsonException){
            throw new HttpErro(400, 'O corpo da requisição não é um JSON válido');
        }

        # Caso 3: Json válido que não e um obj;
        $valido = true;
        if(!is_array($jsonDados)){
            $valido = false;
        }else if(array_is_list($jsonDados) and $jsonDados !== []) {
            $valido = false;
        }

        if(!$valido) throw new HttpErro(400, 'O corpo da requisição deve ser um objeto JSON');

        # Return
        return $jsonDados;
    }

    /**
     * Parâmetro de texto da query string, sem espaços nas pontas, ou $padrao se ausente.
     * Só aceita texto: `?genero[]=x` chega como array e também cai no $padrao.
     */
    public function texto(string $nome, string $padrao = ''): string
    {
        $valor = $this->query[$nome] ?? null;
        
        if (is_string($valor)){
            return trim($valor);
        }
        return $padrao;
    }

    /**
     * Parâmetro inteiro da query string, entre $min e $max, ou $padrao se ausente, não
     * inteiro ou fora da faixa. Usa filter_var em vez de (int), que transformaria "abc" em 0
     * sem avisar.
     */
    public function inteiro(string $nome, int $padrao, int $min = 1, int $max = PHP_INT_MAX): int
    {
        $valor = $this->query[$nome] ?? null;
        
        $validacao = filter_var(
            $valor,
            FILTER_VALIDATE_INT,
            ['options' => ['min_range' => $min, 'max_range' => $max]]
        );

        if (is_int($validacao)){
            return $validacao;
        }
        return $padrao;
    }
}
