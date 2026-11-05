# Camada de mock

Os handlers vivem no processo da página, não num servidor. [`src/main.tsx`](../src/main.tsx) lê `?scenario=` e `?reset=1`, sobe o worker e só então importa a aplicação.

## Banco

[`src/mocks/db.ts`](../src/mocks/db.ts) guarda um único objeto na memória, compartilhado por REST e socket. Ele é gravado em `localStorage` na chave `nft-market:db`. Se o JSON não tiver `schemaVersion: 1` ou não tiver NFTs, o seed substitui o que estava salvo.

[`src/mocks/seed.ts`](../src/mocks/seed.ts) cria 40 NFTs, Ada, Leo, favoritos e carteiras. O carrinho e os pedidos começam vazios. As imagens do catálogo são servidas pelos quatro assets em [`public/nft`](../public/nft); [`src/mocks/images.ts`](../src/mocks/images.ts) também contém um helper que gera SVG em data URI.

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

## Cenários de mock

O cenário é selecionado nesta ordem: `?scenario=` na URL, cenário salvo em `localStorage`, `VITE_MOCK_SCENARIO` e, por fim, `success`. Acesse, por exemplo, `/?scenario=offline` para iniciar a aplicação sem rede simulada.

`?reset=1` reinicia o banco, o token e o id do usuário e recria o seed. O cenário escolhido não é apagado. O laboratório no cabeçalho (visível a partir de 640 px) oferece os controles de reset e cenário; esses endpoints de desenvolvimento continuam disponíveis mesmo nos cenários `offline` e `http_error`.

| Cenário             | Comportamento                                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `success`           | Catálogo normal; um pedido começa pendente e o socket o confirma em seguida.                                                   |
| `empty`             | A listagem fica vazia; o detalhe `/nfts/nft_01` continua disponível.                                                           |
| `latency`           | Cada URL recebe atraso determinístico de 350 a 1649 ms.                                                                        |
| `offline`           | As chamadas `/api` falham como uma queda de rede.                                                                              |
| `http_error`        | As chamadas `/api` respondem com 503 (`transient`).                                                                            |
| `expired_session`   | Requests autenticados recebem 401; uma nova sessão já nasce expirada.                                                          |
| `unauthorized`      | Rotas privadas respondem 403; o catálogo público continua disponível.                                                          |
| `signup_conflict`   | Todo cadastro responde 409, mesmo com e-mail novo.                                                                             |
| `invalid_coupon`    | Todos os cupons são inválidos.                                                                                                 |
| `expired_coupon`    | Todos os cupons são tratados como expirados.                                                                                   |
| `price_changed`     | A criação do pedido atualiza o preço, emite `nft.updated` e responde 409.                                                      |
| `sold_out`          | A criação do pedido zera o estoque das edições no carrinho, emite `nft.updated` e responde 409.                                |
| `order_timeout`     | O pedido é salvo, mas a resposta demora 60 s; o Axios expira em 10 s. Repetir a chave de idempotência recupera o mesmo pedido. |
| `payment_confirmed` | A criação do pedido e o socket informam a confirmação.                                                                         |
| `payment_declined`  | O socket marca o pedido como recusado e o carrinho é mantido.                                                                  |

Na página de detalhe, **Simulate market move** chama `POST /api/dev/nfts/:id/tick`. O preço exibido só muda quando o cliente recebe `nft.updated`; a resposta do POST não atualiza o cache diretamente.
