DO $$
BEGIN
    EXECUTE format('ALTER DATABASE %I SET timezone TO %L', current_database(), 'America/Sao_Paulo');
EXCEPTION WHEN insufficient_privilege THEN
    NULL; -- banco hospedado sem esse direito: a Conexao ajusta o fuso a cada conexão
END
$$;

CREATE TABLE cinemas (
    id       INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome     VARCHAR(80)  NOT NULL,
    cidade   VARCHAR(60)  NOT NULL,
    endereco VARCHAR(120) NOT NULL,
    imagem   VARCHAR(120) NOT NULL
);

CREATE TABLE filmes (
    id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    titulo        VARCHAR(100) NOT NULL,
    sinopse       TEXT         NOT NULL,
    genero        VARCHAR(30)  NOT NULL,
    duracao_min   INTEGER      NOT NULL CHECK (duracao_min > 0),
    classificacao VARCHAR(2)   NOT NULL CHECK (classificacao IN ('L', '10', '12', '14', '16', '18')),
    estreia       DATE         NOT NULL,
    poster        VARCHAR(120) NOT NULL,
    fundo         VARCHAR(120) NOT NULL
);

CREATE TABLE salas (
    id                   INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cinema_id            INTEGER     NOT NULL REFERENCES cinemas (id),
    nome                 VARCHAR(30) NOT NULL,
    fileiras             INTEGER     NOT NULL CHECK (fileiras BETWEEN 1 AND 26),
    assentos_por_fileira INTEGER     NOT NULL CHECK (assentos_por_fileira BETWEEN 1 AND 30),
    UNIQUE (cinema_id, nome)
);

CREATE TABLE exibicoes (
    id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    filme_id      INTEGER       NOT NULL REFERENCES filmes (id),
    sala_id       INTEGER       NOT NULL REFERENCES salas (id),
    inicia_em     TIMESTAMPTZ   NOT NULL,
    preco_inteira NUMERIC(6, 2) NOT NULL CHECK (preco_inteira > 0),
    idioma        VARCHAR(10)   NOT NULL CHECK (idioma IN ('Dublado', 'Legendado')),
    formato       VARCHAR(2)    NOT NULL CHECK (formato IN ('2D', '3D'))
);

CREATE INDEX exibicoes_filme_idx ON exibicoes (filme_id, inicia_em);
CREATE INDEX exibicoes_inicia_em_idx ON exibicoes (inicia_em);

CREATE TABLE usuarios (
    id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome       VARCHAR(80)  NOT NULL,
    email      VARCHAR(120) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    papel      VARCHAR(10)  NOT NULL DEFAULT 'cliente'
               CHECK (papel IN ('cliente', 'cinema', 'admin')),
    cinema_id  INTEGER REFERENCES cinemas (id),
    criado_em  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    -- gerente tem cinema, os outros não
    CHECK ((papel = 'cinema') = (cinema_id IS NOT NULL))
);

CREATE TABLE tokens (
    token      CHAR(64)    PRIMARY KEY,
    usuario_id INTEGER     NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
    criado_em  TIMESTAMPTZ NOT NULL DEFAULT now(),
    expira_em  TIMESTAMPTZ NOT NULL
);

CREATE TABLE produtos (
    id        INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cinema_id INTEGER       NOT NULL REFERENCES cinemas (id),
    nome      VARCHAR(60)   NOT NULL,
    descricao VARCHAR(120)  NOT NULL,
    categoria VARCHAR(10)   NOT NULL CHECK (categoria IN ('pipoca', 'bebida', 'lanche', 'doce', 'combo')),
    preco     NUMERIC(6, 2) NOT NULL CHECK (preco > 0),
    imagem    VARCHAR(120)  NOT NULL,
    ativo     BOOLEAN       NOT NULL DEFAULT true
);

CREATE INDEX produtos_cinema_idx ON produtos (cinema_id);

CREATE TABLE pedidos (
    id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id  INTEGER       NOT NULL REFERENCES usuarios (id),
    exibicao_id INTEGER       NOT NULL REFERENCES exibicoes (id),
    total       NUMERIC(8, 2) NOT NULL CHECK (total >= 0),
    status      VARCHAR(10)   NOT NULL DEFAULT 'pago' CHECK (status IN ('pago', 'cancelado')),
    criado_em   TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TABLE ingressos (
    id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    pedido_id   INTEGER       NOT NULL REFERENCES pedidos (id) ON DELETE CASCADE,
    exibicao_id INTEGER       NOT NULL REFERENCES exibicoes (id),
    fileira     CHAR(1)       NOT NULL,
    numero      INTEGER       NOT NULL CHECK (numero >= 1),
    tipo        VARCHAR(7)    NOT NULL CHECK (tipo IN ('inteira', 'meia')),
    preco       NUMERIC(6, 2) NOT NULL,
    ativo       BOOLEAN       NOT NULL DEFAULT true
);

CREATE UNIQUE INDEX ingressos_assento_unico
    ON ingressos (exibicao_id, fileira, numero) WHERE ativo;

CREATE TABLE pedido_itens (
    id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    pedido_id  INTEGER       NOT NULL REFERENCES pedidos (id) ON DELETE CASCADE,
    produto_id INTEGER       NOT NULL REFERENCES produtos (id),
    quantidade INTEGER       NOT NULL CHECK (quantidade BETWEEN 1 AND 10),
    preco_unit NUMERIC(6, 2) NOT NULL
);
