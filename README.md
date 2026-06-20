# Sello — Landing v2

Landing page estática (HTML/CSS/JS puro) da Sello.

## Deploy
- Servida pelo nginx em **`/sello-v2/`** a partir de **`/var/www/html/sello-v2/`** (este diretório).
- **Edição é in-place:** edite os arquivos aqui mesmo — o nginx serve direto, não há build.
- O nginx tem **no-cache** em `/sello-v2/` (um `sub_filter` global removia `Last-Modified`/`ETag` e servia HTML velho). Mesmo assim, ao trocar um asset, **bumpe o `?v=`** no `index.html` pra furar o cache do browser.
- URL pública: http://95.179.179.29/sello-v2/

## Estrutura
- `index.html` — página única
- `css/`, `js/` — estilos e scripts
- `assets/` — imagens (inclui o mural de pratos `d01`–`d28`)
- Modal de download: `#dl-modal` (app ainda não publicado → CTA "Em breve")

## Não confundir
- `~/sello-site` é OUTRA coisa (serve `/sello-preview/`), **não** este v2.
- O app mobile e o cockpit vivem em repos separados: `artjemm/Sello-app` e `artjemm/sello-admin-backend`.
