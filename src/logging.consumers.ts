import { ILogConsumerType } from './logging.types'
import { defaultConsoleConsumer } from './logging.console'

export const defaultConsumers: Record<string, ILogConsumerType> = {
  console: defaultConsoleConsumer,
}

export const registerDefaultConsumer = (name: string, consumer: ILogConsumerType) => {
  defaultConsumers[name] = consumer
}
