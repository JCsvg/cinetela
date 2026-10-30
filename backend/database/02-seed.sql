
INSERT INTO cinemas (nome, cidade, endereco, imagem) VALUES
    ('Cine Aurora',       'Londrina', 'Av. Higienópolis, 1200, Centro',   '/img/cinemas/cine-aurora.jpg'),
    ('Cine Horizonte',    'Londrina', 'Shopping Norte, piso 3',            '/img/cinemas/cine-horizonte.jpg'),
    ('Cine Retrô Palace', 'Curitiba', 'Rua XV de Novembro, 450, Centro',  '/img/cinemas/cine-retro-palace.jpg');

-- Filmes fictícios. O último ainda não estreou (não tem exibições).
INSERT INTO filmes (titulo, sinopse, genero, duracao_min, classificacao, estreia, poster, fundo) VALUES
('Noite de Neon',
 'Uma entregadora de madrugada percorre os becos iluminados de uma metrópole que nunca dorme e descobre que cada pacote carrega um segredo. Quando um deles some, ela tem até o amanhecer para recuperá-lo.',
 'Suspense', 112, '14', current_date - 21, '/img/filmes/noite-de-neon-poster.jpg', '/img/filmes/noite-de-neon-fundo.jpg'),
('O Último Farol',
 'Dois irmãos herdam um farol abandonado numa ilha batida pelo vento. Entre velhos diários e luzes que se acendem sozinhas, eles precisam decidir se vendem o lugar ou enfrentam o que o mantém aceso.',
 'Drama', 104, '12', current_date - 14, '/img/filmes/o-ultimo-farol-poster.jpg', '/img/filmes/o-ultimo-farol-fundo.jpg'),
('Terra Vermelha',
 'Um geólogo e uma guia local atravessam cânions estreitos em busca de uma nascente que só aparece uma vez por década. A corrida contra o calor e contra a própria desconfiança dura três dias.',
 'Aventura', 128, '12', current_date - 10, '/img/filmes/terra-vermelha-poster.jpg', '/img/filmes/terra-vermelha-fundo.jpg'),
('Mar de Estrelas',
 'Numa noite sem lua, uma astrônoma amadora registra um sinal que não deveria existir. Do alto de uma montanha isolada, ela tenta provar que não está sozinha no universo, ou que está ficando sem sono demais.',
 'Ficção', 119, '10', current_date - 7, '/img/filmes/mar-de-estrelas-poster.jpg', '/img/filmes/mar-de-estrelas-fundo.jpg'),
('A Casa da Floresta',
 'Um fotógrafo caminha por uma trilha coberta de névoa e encontra uma cabana que não aparece em nenhum mapa. Dentro dela, cada fotografia antiga mostra ele mesmo, em anos que ainda não viveu.',
 'Terror', 98, '16', current_date - 5, '/img/filmes/a-casa-da-floresta-poster.jpg', '/img/filmes/a-casa-da-floresta-fundo.jpg'),
('Corrida no Gelo',
 'Uma equipe de resgate sobe uma cordilheira nevada para alcançar alpinistas presos por uma tempestade. Com oito horas de luz e quatro vagas no helicóptero, alguém vai ter de ficar.',
 'Ação', 107, '14', current_date - 3, '/img/filmes/corrida-no-gelo-poster.jpg', '/img/filmes/corrida-no-gelo-fundo.jpg'),
('Cidade Submersa',
 'Mergulhadores encontram, a trinta metros de profundidade, as ruas de uma cidade que sumiu dos registros. Cada mergulho traz uma resposta e uma pergunta pior que a anterior.',
 'Documentário', 91, 'L', current_date - 2, '/img/filmes/cidade-submersa-poster.jpg', '/img/filmes/cidade-submersa-fundo.jpg'),
('Verão em Lisboa',
 'Uma brasileira chega a Lisboa para vender o apartamento da avó e acaba presa, por duas semanas, a um bonde, a um vizinho teimoso e a uma receita de bacalhau que ninguém sabe fazer.',
 'Comédia', 101, '10', current_date - 1, '/img/filmes/verao-em-lisboa-poster.jpg', '/img/filmes/verao-em-lisboa-fundo.jpg'),
('Sinfonia de Cinzas',
 'Na noite de estreia de uma orquestra renomada, o maestro percebe que um dos músicos toca uma partitura que ele nunca escreveu. O concerto continua, e a música muda a cada compasso.',
 'Musical', 124, '12', current_date + 10, '/img/filmes/sinfonia-de-cinzas-poster.jpg', '/img/filmes/sinfonia-de-cinzas-fundo.jpg');

INSERT INTO salas (cinema_id, nome, fileiras, assentos_por_fileira) VALUES
    (1, 'Sala 1', 8, 10),
    (1, 'Sala 2', 6, 8),
    (2, 'Sala 1', 10, 12),
    (2, 'Sala 2', 8, 10),
    (3, 'Sala Única', 6, 8);

INSERT INTO exibicoes (filme_id, sala_id, inicia_em, preco_inteira, idioma, formato)
SELECT m.filme_id, m.sala_id, (current_date + d.dia + m.hora)::timestamptz, m.preco, m.idioma, m.formato
  FROM (VALUES
        (1, 1, TIME '14:00', 32.00, 'Dublado',   '2D'),
        (1, 3, TIME '20:30', 38.00, 'Legendado', '2D'),
        (2, 1, TIME '17:00', 32.00, 'Legendado', '2D'),
        (2, 5, TIME '19:00', 28.00, 'Legendado', '2D'),
        (3, 2, TIME '15:30', 30.00, 'Dublado',   '3D'),
        (3, 4, TIME '18:00', 40.00, 'Dublado',   '3D'),
        (4, 3, TIME '16:00', 38.00, 'Dublado',   '2D'),
        (4, 2, TIME '21:00', 30.00, 'Legendado', '2D'),
        (5, 1, TIME '22:00', 32.00, 'Legendado', '2D'),
        (5, 5, TIME '21:00', 28.00, 'Dublado',   '2D'),
        (6, 4, TIME '14:30', 36.00, 'Dublado',   '3D'),
        (6, 3, TIME '19:15', 38.00, 'Legendado', '2D'),
        (7, 5, TIME '16:30', 26.00, 'Legendado', '2D'),
        (7, 2, TIME '18:30', 30.00, 'Dublado',   '2D'),
        (8, 4, TIME '17:15', 34.00, 'Legendado', '2D'),
        (8, 1, TIME '20:00', 32.00, 'Dublado',   '2D')
       ) AS m (filme_id, sala_id, hora, preco, idioma, formato)
 CROSS JOIN generate_series(0, 6) AS d (dia)
 ORDER BY d.dia, m.hora;

INSERT INTO usuarios (nome, email, senha_hash, papel, cinema_id) VALUES
    ('Carla Souza',      'cliente@cine.dev',  '$2y$12$PHHJCt8hlMv5RKG1BMIo1OOPlBM4m8h37TTx23RxxAzL6KTFPkZ6a', 'cliente', NULL),
    ('Diego Martins',    'cliente2@cine.dev', '$2y$12$PHHJCt8hlMv5RKG1BMIo1OOPlBM4m8h37TTx23RxxAzL6KTFPkZ6a', 'cliente', NULL),
    ('Marcos (Aurora)',  'gerente@cine.dev',  '$2y$12$PHHJCt8hlMv5RKG1BMIo1OOPlBM4m8h37TTx23RxxAzL6KTFPkZ6a', 'cinema',  1),
    ('Paula (Retrô)',    'gerente2@cine.dev', '$2y$12$PHHJCt8hlMv5RKG1BMIo1OOPlBM4m8h37TTx23RxxAzL6KTFPkZ6a', 'cinema',  3),
    ('Administração',    'admin@cine.dev',    '$2y$12$PHHJCt8hlMv5RKG1BMIo1OOPlBM4m8h37TTx23RxxAzL6KTFPkZ6a', 'admin',   NULL);

INSERT INTO produtos (cinema_id, nome, descricao, categoria, preco, imagem)
SELECT c.id, p.nome, p.descricao, p.categoria, ROUND(p.preco * c.fator, 2), p.imagem
  FROM (VALUES
        (1, 1.00::numeric), (2, 1.10::numeric), (3, 0.95::numeric)
       ) AS c (id, fator)
 CROSS JOIN (VALUES
        (1, 'Pipoca média',     'Pipoca salgada, 90 g',                    'pipoca', 18.00, '/img/produtos/pipoca.jpg'),
        (2, 'Pipoca grande',    'Pipoca salgada, 140 g',                   'pipoca', 24.00, '/img/produtos/pipoca.jpg'),
        (3, 'Refrigerante',     'Copo de 500 ml, com gelo e limão',        'bebida', 12.00, '/img/produtos/refrigerante.jpg'),
        (4, 'Água mineral',     'Garrafa de 500 ml',                       'bebida',  6.00, '/img/produtos/agua.jpg'),
        (5, 'Nachos com queijo','Nachos crocantes com queijo cheddar',     'lanche', 22.00, '/img/produtos/nachos.jpg'),
        (6, 'Cachorro-quente',  'Pão, salsicha, queijo e molho',           'lanche', 16.00, '/img/produtos/cachorro-quente.jpg'),
        (7, 'Chocolate',        'Bombons sortidos, caixa com 8',           'doce',   14.00, '/img/produtos/chocolate.jpg'),
        (8, 'Combo casal',      'Pipoca grande e 2 refrigerantes',         'combo',  44.00, '/img/produtos/pipoca.jpg')
       ) AS p (ord, nome, descricao, categoria, preco, imagem)
 ORDER BY c.id, p.ord;

INSERT INTO pedidos (usuario_id, exibicao_id, total)
SELECT 1, id, preco_inteira * 2
  FROM exibicoes WHERE filme_id = 1 AND sala_id = 1 AND CAST(inicia_em AS date) = current_date + 2;
INSERT INTO pedidos (usuario_id, exibicao_id, total)
SELECT 2, id, preco_inteira / 2
  FROM exibicoes WHERE filme_id = 1 AND sala_id = 1 AND CAST(inicia_em AS date) = current_date + 2;

INSERT INTO ingressos (pedido_id, exibicao_id, fileira, numero, tipo, preco)
SELECT 1, p.exibicao_id, 'D', n, 'inteira', e.preco_inteira
  FROM pedidos p JOIN exibicoes e ON e.id = p.exibicao_id
 CROSS JOIN (VALUES (5), (6)) AS v (n)
 WHERE p.id = 1;
INSERT INTO ingressos (pedido_id, exibicao_id, fileira, numero, tipo, preco)
SELECT 2, p.exibicao_id, 'F', 3, 'meia', e.preco_inteira / 2
  FROM pedidos p JOIN exibicoes e ON e.id = p.exibicao_id
 WHERE p.id = 2;
