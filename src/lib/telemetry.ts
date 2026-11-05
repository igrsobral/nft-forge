import { type Attributes, context, SpanStatusCode, trace } from '@opentelemetry/api'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { registerInstrumentations } from '@opentelemetry/instrumentation'
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load'
import { XMLHttpRequestInstrumentation } from '@opentelemetry/instrumentation-xml-http-request'
import { defaultResource, resourceFromAttributes } from '@opentelemetry/resources'
import {
  BatchSpanProcessor,
  ParentBasedSampler,
  StackContextManager,
  TraceIdRatioBasedSampler,
  TracerProvider,
} from '@opentelemetry/sdk-trace'
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_NAMESPACE,
  ATTR_URL_SCHEME,
} from '@opentelemetry/semantic-conventions'
import {
  otelEnabled,
  otelEndpoint,
  otelEnvironment,
  otelSampleRatio,
  otelServiceName,
} from '@/lib/env'

const TRACER_NAME = 'nft-marketplace'

const tracer = trace.getTracer(TRACER_NAME)

let provider: TracerProvider | null = null
let initialized = false

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function toException(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}

/**
 * Captures window errors and rejected promises as spans so crashes reach the
 * collector even when they never hit an instrumented code path.
 */
function captureGlobalErrors(): void {
  const record = (name: string, error: unknown) => {
    tracer.startActiveSpan(name, (span) => {
      span.recordException(toException(error))
      span.setStatus({ code: SpanStatusCode.ERROR })
      span.end()
    })
  }
  window.addEventListener('error', (event) => {
    record('window.error', event.error ?? event.message)
  })
  window.addEventListener('unhandledrejection', (event) => {
    record('window.unhandledrejection', event.reason)
  })
}

/** Flush pending spans when the page is hidden or being unloaded. */
function flushOnTeardown(): void {
  const flush = () => {
    void provider?.forceFlush().catch(() => {})
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush()
  })
  window.addEventListener('pagehide', flush)
}

export function initTelemetry(): void {
  if (initialized) return
  initialized = true
  if (!otelEnabled || !otelEndpoint) return

  try {
    const resource = defaultResource().merge(
      resourceFromAttributes({
        [ATTR_SERVICE_NAME]: otelServiceName,
        [ATTR_SERVICE_NAMESPACE]: 'frontend',
        'deployment.environment.name': otelEnvironment,
        [ATTR_URL_SCHEME]: window.location.protocol.replace(':', ''),
      }),
    )
    provider = new TracerProvider({
      resource,
      sampler: new ParentBasedSampler({ root: new TraceIdRatioBasedSampler(otelSampleRatio) }),
      spanProcessors: [
        new BatchSpanProcessor({
          exporter: new OTLPTraceExporter({ url: otelEndpoint }),
          maxQueueSize: 200,
          scheduledDelayMillis: 5_000,
        }),
      ],
    })
    context.setGlobalContextManager(new StackContextManager())
    trace.setGlobalTracerProvider(provider)
    registerInstrumentations({
      instrumentations: [
        new DocumentLoadInstrumentation(),
        new XMLHttpRequestInstrumentation({
          propagateTraceHeaderCorsUrls: new RegExp(escapeRegExp(window.location.origin)),
          ignoreUrls: [new RegExp(escapeRegExp(otelEndpoint))],
        }),
      ],
    })
    captureGlobalErrors()
    flushOnTeardown()
  } catch (error) {
    provider = null
    console.warn('OpenTelemetry was not initialized.', error)
  }
}

/** Runs `fn` inside an active span and records failures on it. */
export async function withSpan<T>(
  name: string,
  fn: () => T | Promise<T>,
  attributes?: Attributes,
): Promise<T> {
  return tracer.startActiveSpan(name, { attributes }, async (span) => {
    try {
      return await fn()
    } catch (error) {
      const exception = toException(error)
      span.recordException(exception)
      span.setStatus({ code: SpanStatusCode.ERROR, message: exception.message })
      throw error
    } finally {
      span.end()
    }
  })
}

/** Adds attributes to the span active in the current context, if any. */
export function setSpanAttributes(attributes: Attributes): void {
  const span = trace.getSpan(context.active())
  span?.setAttributes(attributes)
}
