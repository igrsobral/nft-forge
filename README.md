# Atelier Market

Foundation for the NFT marketplace take-home: a Vite + React + TypeScript app with typed REST contracts, an MSW mock API, and a Socket.IO price feed. The catalog and edition detail are the working slice. Sign-in, cart, checkout, profile, and wallets are implemented in the mock API and not yet as screens.

The Figma file still needs a desktop sign-in, so frames were not opened directly. The UI uses this challenge’s tokens (ink, copper, Roboto Mono) from `src/index.css`.

## Setup

```bash
pnpm install
pnpm dev
```

The dev server is [http://127.0.0.1:4471](http://127.0.0.1:4471). Mocks are on unless `VITE_ENABLE_MOCKS=false`.

`pnpm test:e2e` installs Chromium if needed and runs the catalog test.

## Environment

Copy `.env.example` if you want a file. Defaults live in code, so a checkout works without one.

| Variable             | Default                    | Purpose                                                    |
| -------------------- | -------------------------- | ---------------------------------------------------------- |
| `VITE_ENABLE_MOCKS`  | on, unless exactly `false` | Start MSW, including in the production build               |
| `VITE_MOCK_SCENARIO` | `success`                  | Scenario used when the URL and localStorage do not set one |

## Demo accounts

Passwords are PBKDF2-SHA256 hashes in the seed, not clear text.

| Collector   | Email               | Password         |
| ----------- | ------------------- | ---------------- |
| Ada Marlowe | `ada@collector.dev` | `orchid-harbor`  |
| Leo Okonkwo | `leo@collector.dev` | `marble-gallery` |

Coupons: `WELCOME10` (10%), `ARCHIVE5` (5%), `SPRING24` (expired). Network fee is `0.0015` ETH.

## Scenarios and reset

Open **Mock lab** in the header, or set the scenario before load:

- `?scenario=latency`
- `?reset=1` clears the persisted database and session, then reseeds
- `?scenario=empty&reset=1` does both

The choice is stored in `localStorage` (`nft-market:scenario`, `nft-market:db`). Reset keeps the selected scenario and restores NFTs, users, favorites, wallets, and an empty cart.

| Scenario                                 | Effect                                                                                          |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `success`                                | Normal responses. Orders confirm on the socket after a short pending state.                     |
| `empty`                                  | Catalog search returns no rows. Direct detail links still resolve.                              |
| `latency`                                | Deterministic per-URL delay so a later request can finish first.                                |
| `offline`                                | API calls fail as a dropped connection. Dev controls still answer.                              |
| `http_error`                             | API calls return a transient 503.                                                               |
| `expired_session`                        | Any request with a bearer token returns 401.                                                    |
| `unauthorized`                           | A signed-in collector receives 403 on private resources.                                        |
| `signup_conflict`                        | Signup always returns 409.                                                                      |
| `invalid_coupon` / `expired_coupon`      | Every coupon is rejected that way.                                                              |
| `price_changed` / `sold_out`             | Checkout mutates the NFT, emits `nft.updated`, and returns 409.                                 |
| `order_timeout`                          | The order is stored, then the HTTP response hangs. The same idempotency key returns that order. |
| `payment_confirmed` / `payment_declined` | Confirmed in the create response, or declined on `order.updated`.                               |

On an edition page, **Simulate market move** posts to the mock, which updates the shared database and emits `nft.updated`. The screen does not copy the POST body into the cache. The price changes only when the Socket.IO client receives the event.

## Commands

```bash
pnpm dev          # mocks + http://127.0.0.1:4471
pnpm build        # typecheck and production build, mocks included
pnpm preview      # http://127.0.0.1:4472
pnpm typecheck
pnpm lint
pnpm test:e2e     # Playwright, Chromium desktop and mobile
pnpm lighthouse   # build, then 3 mobile and 3 desktop runs of home and detail
```
