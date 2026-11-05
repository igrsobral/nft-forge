# Kurio — marketplace de arte digital

Kurio é uma aplicação de demonstração para descobrir e colecionar edições digitais. Explore o catálogo, filtre resultados pela URL, acompanhe mudanças de mercado e experimente o fluxo de compra — da cotação ao recibo.

> **Demonstração de frontend:** não há backend, carteira ou transação blockchain reais. A API REST e os eventos Socket.IO são simulados no navegador pelo [MSW](src/mocks). Os dados de demonstração são locais.

## Arte em destaque

As imagens abaixo são parte dos assets de demonstração usados pelo catálogo — não são capturas de tela da interface.

<table>
  <tr>
    <td align="center"><img src="public/nft/ape-emerald.png" alt="Arte NFT Ape Emerald" width="180"><br><strong>Ape Emerald</strong></td>
    <td align="center"><img src="public/nft/ape-sage.png" alt="Arte NFT Ape Sage" width="180"><br><strong>Ape Sage</strong></td>
    <td align="center"><img src="public/nft/ape-solar.png" alt="Arte NFT Ape Solar" width="180"><br><strong>Ape Solar</strong></td>
    <td align="center"><img src="public/nft/ape-neon.png" alt="Arte NFT Ape Neon" width="180"><br><strong>Ape Neon</strong></td>
  </tr>
</table>

## Recursos

- Catálogo com busca, filtros, ordenação e paginação sincronizados com a URL.
- Página de detalhe com edições, favoritos e atualização de mercado em tempo real.
- Carrinho, cotação, cupons e checkout com chave de idempotência.
- Conta de demonstração, perfil, carteiras simuladas e histórico de pedidos.
- Cenários controláveis para testar latência, indisponibilidade, conflitos e resultados de pagamento.
- Telemetria de navegador com OpenTelemetry, ativada apenas quando configurada.

O visual usa os tokens de cor e a tipografia publicados para o desafio (tinta `#140d0a`, cobre `#d28a4c` e Roboto Mono). A composição não é uma reprodução dos frames do Figma.

## Tecnologias

React 19 · TypeScript · Vite · TanStack Router e Query · Axios · Zod · Tailwind CSS · shadcn/ui · MSW · Socket.IO · Vitest · Playwright

## Começar

Requisitos: **Node.js 22 ou superior** e **pnpm 10** (o repositório fixa pnpm `10.33.4`).

```bash
pnpm install
pnpm dev
```

Abra [http://127.0.0.1:4471](http://127.0.0.1:4471). Os mocks ficam ligados por padrão; não é necessário configurar um backend nem criar um arquivo `.env` para experimentar a aplicação. Consulte [`.env.example`](.env.example) para opções de configuração.

### Verificações

| Comando | Descrição |
| --- | --- |
| `pnpm check` | Biome e verificação de tipos TypeScript |
| `pnpm test:unit` | Testes unitários com Vitest |
| `pnpm test:coverage` | Testes unitários com relatório de cobertura v8 e limiares configurados |
| `pnpm test:e2e` | Testes Playwright em desktop e viewport mobile |
| `pnpm build` | Verificação de tipos e build de produção |
| `pnpm preview` | Pré-visualização do build em `http://127.0.0.1:4472` |
| `pnpm lighthouse` | Build e auditorias Lighthouse mobile e desktop |

Mais detalhes sobre cobertura, fluxos exercitados e limitações estão em [docs/testes.md](docs/testes.md).

## Rotas principais

| Página | Rota |
| --- | --- |
| Catálogo | `/` |
| Detalhe de NFT | `/nfts/:nftId` |
| Diário da Cunhagem | `/journal/:slug` |
| Carrinho e checkout | `/cart`, `/checkout` |
| Pedido | `/orders/:orderId` |
| Login e cadastro | `/login`, `/signup` |
| Perfil e carteiras | `/profile`, `/wallets` |

Checkout, perfil, carteiras e detalhes do pedido exigem uma sessão de demonstração.

## Acesso de demonstração

| Colecionador | E-mail | Senha |
| --- | --- | --- |
| Ada Marlowe | `ada@collector.dev` | `orchid-harbor` |
| Leo Okonkwo | `leo@collector.dev` | `marble-gallery` |

Cupons disponíveis: `WELCOME10` (10% de desconto) e `ARCHIVE5` (5%). `SPRING24` está expirado. Todos os dados podem ser reiniciados localmente com `/?reset=1`.

## Cenários e telemetria

O cenário de mock padrão é `success`. Para abrir a aplicação diretamente em outro cenário, use `/?scenario=offline` (ou `empty`, `latency`, `http_error`, `expired_session`, `price_changed`, `sold_out`, `order_timeout`, `payment_confirmed` e outros). O laboratório de mocks também fica disponível no cabeçalho em larguras a partir de 640 px. A lista completa e o comportamento de cada cenário estão em [docs/mocks.md](docs/mocks.md).

Para enviar traces, defina `VITE_OTEL_EXPORTER_OTLP_ENDPOINT` em `.env`; sem um endpoint configurado, a telemetria não é carregada. Consulte o guia de [observabilidade](docs/observabilidade.md) e [`.env.example`](.env.example).

## Documentação

- [Arquitetura e fluxo de dados](ARCHITECTURE.md)
- [Camada de mocks e cenários](docs/mocks.md)
- [Observabilidade com OpenTelemetry](docs/observabilidade.md)
- [Testes, cobertura e limitações](docs/testes.md)
- [Visão geral dos contratos](src/contracts)
