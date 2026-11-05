# Camada de mock

Os handlers vivem no processo da página, não num servidor. [`src/main.tsx`](../src/main.tsx) lê `?scenario=` e `?reset=1`, sobe o worker e só então importa a aplicação.

## Banco

[`src/mocks/db.ts`](../src/mocks/db.ts) guarda um único objeto na memória, compartilhado por REST e socket. Ele é gravado em `localStorage` na chave `nft-market:db`. Se o JSON não tiver `schemaVersion: 1` ou não tiver NFTs, o seed substitui o que estava salvo.

[`src/mocks/seed.ts`](../src/mocks/seed.ts) cria 40 NFTs, Ada, Leo, favoritos e carteiras. O carrinho e os pedidos começam vazios. A imagem é um SVG em data URI, gerado em [`src/mocks/images.ts`](../src/mocks/images.ts), para a página não depender de um host de assets.

## REST

[`src/mocks/http.ts`](../src/mocks/http.ts) registra os caminhos sob `/api`:

- sessão: cadastro, login, logout, consulta
- NFTs: lista com busca, filtros, ordenação e página; detalhe
- editorial: `GET /api/editorial` (destaques e diário da cunhagem) e `GET /api/editorial/posts/:slug`
- favoritos, carrinho, cotação, pedido
- perfil, avatar, senha, carteiras e conexão simulada da carteira
- controles: `POST /api/dev/reset`, `POST /api/dev/scenario`, `POST /api/dev/nfts/:id/tick`

O mesmo arquivo aplica o cenário ativo no início de cada request de negócio. Os controles de desenvolvimento não passam por essa porta, então dá para resetar mesmo em `offline`.

A cotação é calculada em [`src/mocks/pricing.ts`](../src/mocks/pricing.ts) com as mesmas funções de `decimal.js` do cliente. O pedido confirmado decrementa estoque e tira do carrinho só as quantidades compradas. Recusa não mexe no carrinho. `price_changed` e `sold_out` alteram o NFT, emitem `nft.updated` e respondem 409 sem criar pedido.

## Socket.IO

[`src/mocks/socket.ts`](../src/mocks/socket.ts) usa `ws.link` na origem da página e `toSocketIo` de `@mswjs/socket.io-binding@0.2.0`. O MSW remove o prefixo `/socket.io/` antes de comparar a URL, então o link não inclui esse caminho.

Quando o banco muda preço, estoque ou status, o handler emite para cada conexão aberta. Não existe sala nem broadcast nativo do Socket.IO.

### Limites do binding publicado

O pacote no npm, versão 0.2.0, exporta `toSocketIo`. A classe `SocketIo` que aparece no branch padrão do repositório do binding não está publicada. O peer é MSW `^2.10.2`. Este projeto fixa MSW `2.15.0`. O MSW 3 não entra.

- Só o transporte WebSocket. O cliente em [`src/realtime/socket.ts`](../src/realtime/socket.ts) usa `transports: ['websocket']`. Polling HTTP não é simulado.
- Sem namespaces, salas, acknowledgements nem frames binários.
- O handshake anuncia ping de 25 s e timeout de 5 s, e o binding não envia ping. O mock manda o frame Engine.IO `2` a cada 20 s. Sem isso o cliente cai perto dos 30 s.
- O decoder do binding é um singleton do módulo. O app só emite do mock para o cliente e não depende de `client.on` para o fluxo de negócio.
- O `socket.io-client` precisa ser importado depois que o MSW troca `globalThis.WebSocket`.

## Por que o mock vai no build

`VITE_ENABLE_MOCKS` só desliga o worker se o valor for exatamente `false`. Sem variável, o build de demonstração chama `worker.start()` e o Vite copia `public/mockServiceWorker.js` para `dist`. Avaliador que abre o preview ou um deploy estático continua com catálogo, checkout e socket, sem serviço externo.

O service worker exige contexto seguro. `localhost` e `127.0.0.1` servem. Um arquivo `file://` não registra o worker.
