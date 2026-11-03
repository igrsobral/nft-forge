# Architecture

Foundation slice only. Screens for auth, cart, checkout, profile, and wallets are not built. Their REST handlers, Zod contracts, and query keys are.

## Contracts

Zod schemas in `src/contracts` are the boundary. Axios responses are parsed with those schemas, and MSW handlers validate request bodies with the same ones. ETH amounts are decimal strings. Math and display go through `decimal.js` in `src/lib/money.ts`. Quantities are integers.

The error envelope is `{ error: { code, message, details, requestId } }`.

| Code                    | HTTP           | When                                                              |
| ----------------------- | -------------- | ----------------------------------------------------------------- |
| `validation`            | 422            | Body, query, or header is invalid                                 |
| `invalid_session`       | 401            | Missing, unknown, or expired session, and bad login               |
| `forbidden`             | 403            | `unauthorized` scenario                                           |
| `not_found`             | 404            | Unknown NFT, cart line, order, or wallet                          |
| `availability_conflict` | 409            | Price, stock, or total changed                                    |
| `conflict`              | 409            | Duplicate signup, or idempotency key reused with a different body |
| `transient`             | 503 or network | `http_error`, `offline`, and timeouts                             |

`POST /api/orders` requires `Idempotency-Key`. The same user, key, and canonical body return the original order. The same key with a different body returns 409. The receipt is a snapshot copied onto the order.

Query keys in `src/lib/query-keys.ts` always include a user id (`anon` when signed out) and the params that change the result.

## Cache

- Queries stay fresh for 15 seconds. Window focus does not refetch, so a visible price change is the socket patch rather than a hidden reload.
- 4xx responses are not retried. Network and 5xx retry once. Aborted requests are not retried.
- Catalog search is the route search. Each param set is its own query, and Axios receives the query `AbortSignal`, so a replaced request is cancelled.
- `nft.updated` patches NFT list, NFT detail, and cart caches when `version` is newer, then invalidates quote queries if the price moved. Older versions and repeated `eventId`s are ignored.
- `order.updated` patches the order only when `userId` matches the session. Confirmed and declined are written as the event states them.
- On socket reconnect (not the first connect), list, detail, cart, quote, and order queries refetch from REST.
- `invalid_session` clears the stored token and drops private queries. A later login must use a new user id in the key so the previous collector's cache cannot be reused.

## Socket.IO

The browser uses `socket.io-client` with `transports: ['websocket']`. MSW intercepts that WebSocket. `@mswjs/socket.io-binding@0.2.0` `toSocketIo` completes the Engine.IO handshake and `client.emit` sends `nft.updated` / `order.updated`. Mutations that change price, stock, or order status emit from the same in-memory database the REST handlers use.

Import order matters. `socket.io-client` captures `globalThis.WebSocket` when the module evaluates, and MSW patches that global in `worker.start()`. `src/main.tsx` starts the worker first, then loads the app. The client is imported inside `getSocket()` after that.

### Binding findings

- npm `0.2.0` exports `toSocketIo`. The `SocketIo` protocol class on the binding repo's default branch is not in the published package. MSW 3 exists, but the binding peers MSW `^2.10.2`, so this app pins MSW 2.15.
- The handler URL is the page origin. MSW strips a leading `/socket.io/` before matching, so the link must not include that path.
- Polling is not mocked. The client forces the websocket transport.
- The 0.2.0 handshake advertises a 25s ping and 5s timeout and never sends a ping. The mock sends an Engine.IO ping (`2`) every 20s, or the client disconnects after about 30s.
- Rooms, namespaces, acknowledgements, and binary frames are unsupported. Fan-out is a set of connected clients.
- The binding's decoder is a module singleton. This app only emits server to client, so it does not depend on `client.on`.
- A single text `client.emit` survived the websocket framing in Chromium. The Playwright test watches the detail price change, then the same price on the catalog card, without writing the tick response into the query cache.

## Mocks

One module-level database is shared by every handler, persisted at `nft-market:db`, and replaced by `createSeed()` on reset or when the stored version does not match. The seed is 40 NFTs, two users, favorites, and wallets. Artwork is an inline SVG so the demo does not call an image host.

## Known limitations

- Figma was inaccessible. The palette, Geist, and spacing are placeholders in `src/index.css`.
- TypeScript is 6.0.3 with `strict` and `noUncheckedIndexedAccess`. The Vite template's TypeScript 7 is not used because typescript-eslint does not parse it yet.
- Auth, cart, checkout, profile, and wallet screens are not built. The sign-in control explains that and does not submit a login.
- Optimistic updates are not wired yet. The socket patch is a cache write from a verified event, not a mutation rollback.
- Lighthouse is configured for 3 mobile and 3 desktop runs of `/` and `/nfts/nft_01`. Scores are not collected in this slice.
- Playwright covers the catalog slice (list, URL filter, detail, live price) on Chromium desktop and mobile. The rest of the spec's suite is still open.
- Guest carts travel on `X-Guest-Id` and merge into the user cart at login. That path is only exercised by the handlers today.
