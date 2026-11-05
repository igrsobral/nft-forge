# Testes e qualidade

Os testes unitários e de integração rodam no Vitest. Os fluxos de ponta a ponta rodam no Playwright em desktop (1440 × 900) e no perfil Pixel 5. Cada teste E2E começa em `/?reset=1`, que reinicia os dados e a sessão daquele contexto. Os projetos desktop e mobile não compartilham `localStorage`.

## Como rodar

| Comando              | Descrição                                                               |
| -------------------- | ----------------------------------------------------------------------- |
| `pnpm test:unit`     | Executa a suíte Vitest sem coleta de cobertura                          |
| `pnpm test:coverage` | Executa Vitest com o provedor v8; gera relatório no terminal e em `coverage/` |
| `pnpm test:e2e`      | Instala o Chromium, se necessário, e executa os projetos desktop e mobile |
| `pnpm typecheck`     | Verifica os projetos TypeScript com `tsc -b`                            |
| `pnpm lint`          | Verifica o código com Biome                                              |

A cobertura exige, nos módulos de lógica listados em [`vitest.config.ts`](../vitest.config.ts), pelo menos 85% de statements, 75% de branches, 85% de functions e 85% de lines. Entram `src/lib` (dinheiro, carrinho, carteira, busca, sessão e Axios), `src/contracts`, `src/realtime/apply-events.ts`, `src/realtime/dedupe.ts` e `src/mocks/pricing.ts`. Componentes visuais, rotas e o restante do mock HTTP ficam fora desses limiares.

O login repetido dos testes E2E está em [`e2e/support.ts`](../e2e/support.ts). Não há `waitForTimeout`. As esperas usam asserções web-first.

## Matriz de comportamento

| Comportamento                                                                         | Onde está coberto                                                         |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Strings decimais de ETH, soma, desconto e formatação                                  | `src/lib/money.test.ts`                                                   |
| Cupom WELCOME10, ARCHIVE5, SPRING24 expirado, código inválido, taxa de rede e estoque | `src/mocks/pricing.test.ts`                                               |
| Quantidade do carrinho: soma, teto de 20, estoque e merge de visitante                | `src/lib/cart.test.ts` e `e2e/cart.spec.ts` (quantidade, reload, remoção) |
| Busca, ordenação, paginação, faixa de preço e URL                                     | `src/lib/catalog-search.test.ts`, `e2e/catalog.spec.ts`                   |
| Setas do slider e Aplicar                                                             | `src/components/catalog/catalog-filters.test.tsx`, `e2e/catalog.spec.ts`  |
| Seleção de edição, favorito e avaliações                                              | `e2e/detail.spec.ts`                                                      |
| Login, senha errada, cadastro, e-mail duplicado, esqueci a senha, Escape              | `e2e/auth.spec.ts`                                                        |
| Contratos Zod de conta, senha, endereço e pedido                                      | `src/contracts/contracts.test.ts`                                         |
| Redirect seguro, rota protegida e expiração de sessão                                 | `src/lib/auth.test.ts`, `e2e/resilience.spec.ts`                          |
| Interceptor Axios: token, 401 limpando a sessão, abort sem logout                     | `src/lib/api/client.test.ts`, `src/lib/api/errors.test.ts`                |
| Evento de preço novo, versão antiga ignorada, pedido de outro usuário                 | `src/realtime/apply-events.test.ts`                                       |
| Evento duplicado descartado                                                           | `src/realtime/dedupe.test.ts`                                             |
| Preço ao vivo no card depois do detalhe                                               | `e2e/catalog.spec.ts`                                                     |
| Checkout confirmado e recibo (hash, token, taxa, Etherscan)                           | `e2e/purchase.spec.ts`, `src/lib/receipt.test.ts`                         |
| Pagamento recusado, carrinho mantido, timeout e retry com a mesma chave               | `e2e/resilience.spec.ts`                                                  |
| Carteira escolhida ou a primeira da lista                                             | `src/lib/wallet.test.ts`                                                  |
| Perfil, senha, avatar, carteira e suporte                                             | `e2e/profile.spec.ts`                                                     |
| API offline e 503                                                                     | `e2e/resilience.spec.ts`                                                  |
| Página 404                                                                            | `e2e/resilience.spec.ts`                                                  |
| Viewport mobile nos fluxos acima                                                      | projeto `chromium-mobile`                                                 |
| Axe sem violação serious ou critical em início, detalhe, carrinho e login             | `e2e/a11y.spec.ts`                                                        |

## O que ainda não entra na suíte

- Regressão visual com baseline.
- Projeto Playwright em 768 px.
- Lighthouse integrado ao mesmo comando dos testes.
- O worker do Socket.IO em si. A suíte cobre a função que aplica o evento no cache e a que descarta duplicata, e o preço ao vivo pela UI.
- Cada ramo do `src/mocks/http.ts`. O arquivo é o servidor simulado; os fluxos críticos passam pelo Playwright e as regras de quantidade, cupom e timeout estão extraídas ou exercitadas por ele.

## Lighthouse

`pnpm lighthouse` faz o build e executa três coletas mobile e três desktop nas rotas `/` e `/nfts/nft_01`. Uma execução em 3 de novembro de 2026 terminou com sucesso; as medianas registradas foram 94 em performance mobile, 99–100 em desktop e 100 em acessibilidade. Esses números são uma referência histórica, não uma garantia: rode o comando novamente para medir o ambiente atual. Os relatórios HTML ficam em `.lighthouseci/` e não são versionados.
