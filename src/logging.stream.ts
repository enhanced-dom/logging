import { ILogConsumerType, ILogEntry, ILogger, ILoggingSession } from './logging.types'
import { defaultConsumers } from './logging.consumers'

export class StreamingLogger implements ILogger {
  protected _tags: ILoggingSession['tags'] = {}
  protected _consumers: Record<string, ILogConsumerType> = {}
  constructor(tags: ILoggingSession['tags'] = {}, consumers: Record<string, ILogConsumerType> = defaultConsumers) {
    this._tags = tags
    this._consumers = consumers
  }
  log(
    ...args:
      | [ILogEntry['params']]
      | [ILogEntry['params'], ILogEntry['tags'], ILogEntry['message']]
      | [ILogEntry['params'], ILogEntry['message']]
  ) {
    const params = args[0]
    let tags: ILogEntry['tags'] = {}
    let message: ILogEntry['message'] = undefined
    if (args.length > 2) {
      tags = args[1] as any
      message = args[2]
    } else if (args.length > 1) {
      message = args[1] as any
    }
    const logMessage = {
      params,
      message,
      tags: { ...this._tags, ...tags },
      createdOn: new Date(),
    }
    Object.values(this._consumers).forEach((consumer) => consumer.entry?.(logMessage))
  }
  withTags(tags: ILogEntry['tags']): ILogger {
    return new StreamingLogger({ ...this._tags, ...tags }, this._consumers)
  }
}
