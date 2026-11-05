export const mocksEnabled = import.meta.env.VITE_ENABLE_MOCKS !== 'false'

export const envScenario = import.meta.env.VITE_MOCK_SCENARIO ?? 'success'

export const otelEnabled = import.meta.env.VITE_OTEL_ENABLED !== 'false'
export const otelEndpoint = import.meta.env.VITE_OTEL_EXPORTER_OTLP_ENDPOINT ?? ''
export const otelServiceName = import.meta.env.VITE_OTEL_SERVICE_NAME ?? 'nft-marketplace'
export const otelSampleRatio = Number(import.meta.env.VITE_OTEL_SAMPLE_RATIO ?? '1') || 1
export const otelEnvironment = import.meta.env.VITE_OTEL_ENVIRONMENT ?? 'development'
