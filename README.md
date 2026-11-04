# Kurio — marketplace de NFTs

Aplicação do desafio de frontend da Jungle Gaming. O colecionador descobre edições, filtra o catálogo pela URL, acompanha preço ao vivo, monta um carrinho, confirma uma cotação e recebe um recibo só depois que a simulação de pagamento confirma o pedido. Conta, perfil e carteiras passam pela mesma API simulada.

Não há backend real. REST e Socket.IO são interceptados no navegador pelo MSW, inclusive no build de produção. O arquivo do Figma não foi aberto nesta entrega (o acesso exige login no app desktop). As cores e a fonte seguem os tokens publicados do desafio — tinta `#140d0a`, cobre `#d28a4c`, Roboto Mono — em [`src/index.css`](src/index.css). A composição das telas não reproduz os frames.

## O que está entregue

| Requisito                                           | No projeto                                                                         | Onde olhar                                                                                                                                         |
| --------------------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| TanStack Router, rotas por arquivo e busca validada | Sim                                                                                | [`src/routes`](src/routes), [`vite.config.ts`](vite.config.ts), [`src/router.tsx`](src/router.tsx)                                                 |
| TanStack Query                                      | Sim                                                                                | [`src/lib/query-client.ts`](src/lib/query-client.ts), [`src/lib/queries.ts`](src/lib/queries.ts), [`src/lib/query-keys.ts`](src/lib/query-keys.ts) |
| Axios, uma instância                                | Sim                                                                                | [`src/lib/api/client.ts`](src/lib/api/client.ts)                                                                                                   |
| REST com contratos                                  | Sim                                                                                | [`src/contracts`](src/contracts), [`src/mocks/http.ts`](src/mocks/http.ts)                                                                         |
| Socket.IO no cliente                                | Sim                                                                                | [`src/realtime/socket.ts`](src/realtime/socket.ts), [`src/realtime/bridge.tsx`](src/realtime/bridge.tsx)                                           |
| Tailwind CSS                                        | Sim                                                                                | [`src/index.css`](src/index.css)                                                                                                                   |
| shadcn/ui                                           | Sim, primitivos usados de fato                                                     | [`src/components/ui`](src/components/ui), [`components.json`](components.json)                                                                     |
| MSW e `@mswjs/socket.io-binding`                    | Sim                                                                                | [`src/mocks`](src/mocks), [`public/mockServiceWorker.js`](public/mockServiceWorker.js)                                                             |
| Playwright                                          | Sim, cobertura parcial                                                             | [`e2e`](e2e), [`playwright.config.ts`](playwright.config.ts)                                                                                       |
| Lighthouse                                          | Configurado e executado uma vez neste ambiente; relatórios locais, não versionados | [`lighthouserc.mobile.cjs`](lighthouserc.mobile.cjs), [`lighthouserc.desktop.cjs`](lighthouserc.desktop.cjs), [docs/testes.md](docs/testes.md)     |

Telas que existem:

| Tela             | Rota                   |
| ---------------- | ---------------------- |
| Início           | `/`                    |
| Detalhe do NFT   | `/nfts/$nftId`         |
| Carrinho         | `/cart`                |
| Pagamento        | `/checkout`            |
| Pedido           | `/orders/$orderId`     |
| Login e cadastro | `/login`, `/signup`    |
| Perfil           | `/profile`             |
| Carteiras        | `/wallets`             |
| Rota inexistente | qualquer outro caminho |

Checkout, perfil, carteiras e o pedido exigem sessão. O detalhe tem uma imagem por edição, não uma galeria de várias vistas. Não há regressão visual versionada nem a suíte E2E inteira do enunciado. O que falta está em [docs/testes.md](docs/testes.md).

## Início rápido

Verificado neste ambiente: Node `v22.23.4` e pnpm `10.33.4` (`packageManager` no `package.json`). Use Node 22 ou mais novo e pnpm 10.

```bash
pnpm install
pnpm dev
```

O servidor de desenvolvimento sobe em [http://127.0.0.1:4471](http://127.0.0.1:4471), com os mocks ligados. Não é preciso criar `.env`: os padrões estão em [`src/lib/env.ts`](src/lib/env.ts). O modelo está em [`.env.example`](.env.example).

| Comando             | O que faz                                                                        | Verificado                                                                                                                        |
| ------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm typecheck`    | `tsc -b` em app, config do Vite e e2e                                            | Sim                                                                                                                               |
| `pnpm lint`         | ESLint                                                                           | Sim                                                                                                                               |
| `pnpm build`        | Typecheck e build de produção, com o worker do MSW                               | Sim                                                                                                                               |
| `pnpm preview`      | Serve `dist` em [http://127.0.0.1:4472](http://127.0.0.1:4472)                   | Sim, responde 200                                                                                                                 |
| `pnpm test:e2e`     | Instala o Chromium do Playwright, se faltar, e roda os testes                    | Sim, 4 testes, desktop e mobile                                                                                                   |
| `pnpm lighthouse`   | `pnpm build` e depois três coletas mobile e três desktop de `/` e `/nfts/nft_01` | Sim, saiu com código 0. Medianas em [docs/testes.md](docs/testes.md). Os HTML/JSON ficam em `.lighthouseci/` e não vão para o git |
| `pnpm format:check` | Prettier em modo verificação                                                     | O binário existe; não faz parte do fluxo mínimo                                                                                   |

Não há suíte de teste unitário nem script `pnpm test`.

## Contas e cupons

As senhas do seed são PBKDF2-SHA256 (10 000 iterações), não texto puro. A implementação está em [`src/mocks/password.ts`](src/mocks/password.ts).

| Colecionador | E-mail              | Senha            |
| ------------ | ------------------- | ---------------- |
| Ada Marlowe  | `ada@collector.dev` | `orchid-harbor`  |
| Leo Okonkwo  | `leo@collector.dev` | `marble-gallery` |

A Ada já tem carteira principal na Ethereum (conectada) e secundária na Base. O Leo tem carteira principal na Polygon.

| Cupom                 | Efeito               |
| --------------------- | -------------------- |
| `WELCOME10`           | 10% sobre o subtotal |
| `ARCHIVE5`            | 5% sobre o subtotal  |
| `SPRING24`            | Expirado             |
| Qualquer outro código | Inválido             |

A taxa de rede é `0.0015` ETH quando o carrinho tem itens. Valores em ETH são strings decimais.

## Cenários de mock

Prioridade: `?scenario=` na carga da página grava `localStorage`, e essa chave ganha do ambiente. Sem chave gravada, vale `VITE_MOCK_SCENARIO`. Sem os dois, o cenário é `success`.

`?reset=1` apaga o banco, o token e o id do usuário e recria o seed. Não apaga o cenário escolhido.

O laboratório no cabeçalho (a partir de 640 px) chama `POST /api/dev/scenario` e `POST /api/dev/reset`. Esses dois caminhos não passam pelo bloqueio de `offline` e `http_error`.

| Cenário             | Como ver o efeito                                                                                                    |
| ------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `success`           | Catálogo normal. O pedido nasce `pending` e o socket confirma em seguida.                                            |
| `empty`             | A listagem volta vazia. `/nfts/nft_01` continua abrindo.                                                             |
| `latency`           | Cada URL espera um atraso determinístico (350–1649 ms), então uma busca mais nova pode terminar antes.               |
| `offline`           | As chamadas `/api` falham como queda de rede.                                                                        |
| `http_error`        | As chamadas `/api` respondem 503 `transient`.                                                                        |
| `expired_session`   | Qualquer request com `Authorization` recebe 401. O login sem token ainda cria sessão, mas ela já nasce expirada.     |
| `unauthorized`      | Com sessão válida, rotas privadas respondem 403. O catálogo público segue.                                           |
| `signup_conflict`   | Todo cadastro responde 409, mesmo com e-mail novo.                                                                   |
| `invalid_coupon`    | Todo cupom é inválido.                                                                                               |
| `expired_coupon`    | Todo cupom está expirado.                                                                                            |
| `price_changed`     | O `POST /api/orders` sobe o preço, emite `nft.updated` e responde 409.                                               |
| `sold_out`          | O `POST /api/orders` zera o estoque das edições do carrinho, emite `nft.updated` e responde 409.                     |
| `order_timeout`     | O pedido é gravado e a resposta HTTP espera 60 s. O Axios corta em 10 s. O mesmo `Idempotency-Key` devolve o pedido. |
| `payment_confirmed` | A resposta de criação já vem `confirmed`, e o socket também emite.                                                   |
| `payment_declined`  | O pedido fica `pending` e o socket marca `declined`. O carrinho é mantido.                                           |

Na página da edição, **Simulate market move** chama `POST /api/dev/nfts/:id/tick`. O preço na tela só muda quando chega `nft.updated`. O corpo do POST não é escrito no cache.

Detalhe do mock, do binding e do build de demonstração: [docs/mocks.md](docs/mocks.md).

## Onde continuar

- Arquitetura, fluxo de dados, tempo real e dinheiro: [ARCHITECTURE.md](ARCHITECTURE.md)
- Testes, limitações e deploy: [docs/testes.md](docs/testes.md)
