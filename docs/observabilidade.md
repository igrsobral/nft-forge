# Observabilidade

A aplicação oferece tracing no navegador com OpenTelemetry. A coleta é opt-in: sem `VITE_OTEL_EXPORTER_OTLP_ENDPOINT`, o SDK não é carregado e nenhum trace é enviado. A inicialização acontece por import dinâmico em [`src/main.tsx`](../src/main.tsx).

## Configuração

Copie as variáveis necessárias para `.env` ou configure-as no ambiente do build:

```dotenv
VITE_OTEL_ENABLED=true
VITE_OTEL_EXPORTER_OTLP_ENDPOINT=http://127.0.0.1:4318/v1/traces
VITE_OTEL_SERVICE_NAME=nft-marketplace
VITE_OTEL_SAMPLE_RATIO=1
VITE_OTEL_ENVIRONMENT=development
```

`VITE_OTEL_ENABLED=false` desliga a coleta. `VITE_OTEL_SAMPLE_RATIO` define a proporção de traces amostrados na raiz; a amostragem baseada em pai mantém a decisão nas operações descendentes. Consulte [`.env.example`](../.env.example) para os valores padrão.

Para executar um coletor local com Jaeger:

```bash
docker run --rm -p 4318:4318 -p 16686:16686 jaegertracing/all-in-one:latest
```

Com o endpoint configurado, inicie a aplicação com `pnpm dev` e consulte a interface do Jaeger em [http://127.0.0.1:16686](http://127.0.0.1:16686). Em produção, configure o endpoint OTLP/HTTP apropriado para o coletor utilizado. Requests entre origens podem exigir configuração CORS no coletor.

## Dados coletados

| Origem                 | Instrumentação                                                                               |
| ---------------------- | -------------------------------------------------------------------------------------------- |
| Carregamento da página | `DocumentLoadInstrumentation`: fetch, load e tempos de recursos.                             |
| Chamadas REST          | `XMLHttpRequestInstrumentation`: método, URL e status de respostas via XHR, incluindo Axios. |
| Erros globais          | Eventos `window.error` e `window.unhandledrejection`, registrados como exceções.             |

O cliente Socket.IO usa transporte WebSocket, que não é instrumentado pela instrumentação XHR descrita acima.

Os recursos dos traces incluem nome do serviço, namespace, ambiente e esquema da URL. A instrumentação propaga contexto W3C em requests same-origin e ignora o próprio endpoint OTLP para evitar loops. Os spans são enviados em lote a cada 5 segundos, com fila máxima de 200; uma flush é solicitada quando a página fica oculta ou começa a descarregar.

## Instrumentação manual

O módulo [`src/lib/telemetry.ts`](../src/lib/telemetry.ts) exporta `withSpan` para executar uma função dentro de um span ativo e registrar falhas, e `setSpanAttributes` para adicionar atributos ao span atual. Importe-o dinamicamente quando necessário para manter a telemetria fora do carregamento inicial.
