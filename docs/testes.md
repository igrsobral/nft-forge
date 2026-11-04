# Testes, limitações e deploy

## O que a suíte cobre

Não há testes unitários. A verificação automatizada é o Playwright em [`e2e`](../e2e), com relatório HTML em `playwright-report/` e trace, screenshot e vídeo quando um teste falha. [`playwright.config.ts`](../playwright.config.ts) define dois projetos Chromium: desktop 1440×900 e Pixel 5.

| Arquivo                                           | O que observa                                                                                           |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| [`e2e/catalog.spec.ts`](../e2e/catalog.spec.ts)   | Lista, filtro de categoria na URL, detalhe, `nft.updated` mudando o preço no detalhe e de volta no card |
| [`e2e/purchase.spec.ts`](../e2e/purchase.spec.ts) | Login da Ada, item no carrinho, checkout e status `confirmed` com referência de transação               |

`pnpm test:e2e` foi executado nesta máquina: 4 testes passaram (os dois arquivos nos dois projetos). O comando instala o Chromium do Playwright antes de rodar.

Cada teste começa em `/?reset=1`, que zera o banco local daquele contexto. Os dois projetos não compartilham `localStorage`.

## Lighthouse

`pnpm lighthouse` faz o build e roda `@lhci/cli` `0.16.0` (Lighthouse `13.6.0`) duas vezes:

- [`lighthouserc.mobile.cjs`](../lighthouserc.mobile.cjs): 3 coletas, form factor mobile, viewport 390×844, throttling simulado
- [`lighthouserc.desktop.cjs`](../lighthouserc.desktop.cjs): 3 coletas com preset desktop

URLs: `http://127.0.0.1:4472/` e `http://127.0.0.1:4472/nfts/nft_01`. O preview sobe na porta 4472. Os relatórios foram para `.lighthouseci/mobile` e `.lighthouseci/desktop`. Essa pasta está no `.gitignore`.

Uma execução completa terminou com código 0 nesta máquina (Linux, Chrome achado pelo LHCI, 3 de novembro de 2026, 21:32 em America/Sao_Paulo). Mediana das três coletas, categorias em pontos de 0 a 100:

| Perfil  | URL            | Performance | Acessibilidade | Boas práticas | SEO |     LCP |    CLS |   TBT |
| ------- | -------------- | ----------: | -------------: | ------------: | --: | ------: | -----: | ----: |
| Mobile  | `/`            |          94 |            100 |           100 |  92 | 3012 ms | 0,0076 | 89 ms |
| Mobile  | `/nfts/nft_01` |          94 |            100 |           100 |  92 | 3007 ms | 0,0007 | 71 ms |
| Desktop | `/`            |          99 |            100 |           100 |  92 |  925 ms | 0,0013 |  0 ms |
| Desktop | `/nfts/nft_01` |         100 |            100 |           100 |  92 |  260 ms | 0,0003 |  0 ms |

No mobile, as três notas de performance da home foram 90, 94 e 94. O LCP fica perto de 3 s por causa do throttling simulado e do worker do MSW no primeiro carregamento. SEO fica em 92: a página tem título e descrição no `index.html`, sem um histórico de conteúdo indexável além do SPA. Esses números são desta máquina, não um laboratório controlado. Rode `pnpm lighthouse` de novo para repetir.

## O que o enunciado pede e ainda não está automatizado

- Busca combinada, ordenação, paginação e restauração pelo histórico, além do filtro de categoria e do `goBack` do teste de catálogo.
- NFT inexistente, estoque esgotado na UI e limite de quantidade.
- Cadastro, conflito, expiração de sessão, logout e troca de usuário.
- Favorito com falha e rollback.
- Carrinho: quantidade, remoção, cupom inválido, refresh e preservação do carrinho de visitante no login.
- Clique repetido, timeout com a mesma chave e pagamento recusado.
- Perfil, avatar, senha e carteiras, com erro de validação.
- Preço alterado durante o checkout, evento duplicado ou antigo, queda de conexão com pedido pendente.
- Teclado, foco de diálogo e skeletons sob latência.
- Regressão visual de início, detalhe, carrinho e pagamento, com baselines versionadas.
- Projeto de tablet em 768 px. O layout usa breakpoints do Tailwind, mas o Playwright não tem esse projeto.

O comportamento correspondente, quando existe, está na UI e no mock. Só não há teste cobrindo.

## Limitações de produto

- Os frames do Figma não foram abertos. Tipografia, raios e a grade de dois cartões no mobile seguem os tokens do desafio, não uma medição dos frames.
- A galeria do detalhe é uma imagem. Não há várias vistas.
- Não há lista de pedidos anteriores. A tela de pedido abre pelo id criado no checkout.
- O perfil lê a sessão (`GET /api/auth/session`), não um `GET /api/profile` separado. Salvar, avatar e senha usam os endpoints de perfil.
- As chaves `orders` e `profile` em [`src/lib/query-keys.ts`](../src/lib/query-keys.ts) existem para o isolamento por usuário. A UI atual não dispara uma query de lista de pedidos nem uma query só de perfil.
- Páginas editoriais, suporte, atividade e ofertas não fazem parte do enunciado e não foram criadas.
- Com mais tempo: completar a matriz Playwright, gravar baselines, rodar o Lighthouse três vezes por URL e perfil, e ajustar o layout com os frames do Figma abertos.

## Deploy

O `vercel.json` reescreve `/(.*)` para `/index.html`, para o refresh em `/nfts/nft_01` e nas outras rotas não cair em 404 da plataforma. Arquivos reais, entre eles `mockServiceWorker.js`, continuam sendo servidos antes do rewrite.

Não há URL pública anexada a este repositório. Um deploy estático na Vercel, Netlify ou Cloudflare Pages funciona se o build for `pnpm build` e o publish for `dist`. Não defina `VITE_ENABLE_MOCKS=false` nesse build: sem o worker a interface não tem API.

Variáveis úteis no painel, ambas opcionais:

- `VITE_ENABLE_MOCKS=true`
- `VITE_MOCK_SCENARIO=success`
