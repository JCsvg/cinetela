/**
 * Os caminhos de imagem vêm do banco como "/img/filmes/x.jpg". Com o site hospedado num subcaminho
 * (GitHub Pages: /nome-do-repo/), eles precisam do prefixo da base; na raiz, o prefixo é vazio.
 */
export function urlImagem(caminho: string): string {
  return import.meta.env.BASE_URL.replace(/\/$/, '') + caminho
}
