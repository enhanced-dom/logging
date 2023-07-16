import uniqueId from 'lodash.uniqueid'

import { ILogConsumerType, ILogEntry, ILogger, ILoggingSession } from './logging.types'
import { defaultConsumers } from './logging.consumers'

const defaultSessionsRepository: Record<string, ILoggingSession> = {}

export class CollectorLogger implements ILogger {
  protected _tags: ILoggingSession['tags'] = {}
  protected _consumers: Record<string, ILogConsumerType> = defaultConsumers
  protected _session: ILoggingSession
  protected _sessionsRepository: Record<string, ILoggingSession> = defaultSessionsRepository
  constructor(
    sessionId?: string,
    tags: ILoggingSession['tags'] = {},
    consumersRegistry?: Record<string, ILogConsumerType>,
    sessionsRepository?: Record<string, ILoggingSession>,
  ) {
    const id = sessionId ?? uniqueId('logging-session-')
    this._consumers = consumersRegistry ?? this._consumers
    this._sessionsRepository = sessionsRepository ?? this._sessionsRepository
    if (!this._sessionsRepository[id]) {
      this._sessionsRepository[id] = {
        id,
        tags,
        entries: [],
        lastUpdatedOn: null,
        createdOn: new Date(),
      }
    } else {
      this._tags = tags
    }
    this._session = this._sessionsRepository[id]
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
    this._session.entries.push({
      params,
      message,
      tags,
      createdOn: new Date(),
    })
    this._session.lastUpdatedOn = new Date()
  }
  withTags(tags: ILogEntry['tags']): ILogger {
    return new CollectorLogger(this._session.id, { ...this._tags, ...tags }, this._consumers, this._sessionsRepository)
  }
  flush() {
    Object.values(this._consumers).forEach((consumer) => consumer.session?.(this._session))
    delete this._sessionsRepository[this._session.id]
  }
}

/**
 * Flushing at the end of the log is nice, but in case we have some sort of unhandled exception,
 * we should be able to flush all the logs in progress
 */
export const flushAllOutstandingSessions = () => {
  Object.values(defaultSessionsRepository)
    .sort((s1, s2) => (s1.createdOn.valueOf() < s2.createdOn.valueOf() ? -1 : 1))
    .forEach((session) => Object.values(defaultConsumers).forEach((consumer) => consumer.session?.(session)))
}
