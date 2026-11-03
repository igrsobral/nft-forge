import { httpHandlers } from './http'
import { socketHandler } from './socket'

export const handlers = [...httpHandlers, socketHandler]
