export interface ILogEntry {
  createdOn: Date
  params: Record<string, any>
  message?: string
  tags: Record<string, string>
}

export interface ILoggingSession {
  id: string
  createdOn: Date
  lastUpdatedOn: Date
  entries: ILogEntry[]
  tags: Record<string, string>
}

export interface ILogger {
  log(...args: [ILogEntry['params'], ILogEntry['tags'], ILogEntry['message']]): void
  log(...args: [ILogEntry['params'], ILogEntry['message']]): void
  log(...args: [ILogEntry['params']]): void
  withTags(tags: ILogEntry['tags']): ILogger
  flush(): void
}

export enum LogTagType {
  Level = 'level', // log level. e.g. info
  Entity = 'entity', // entity/resource type e.g. User
  Id = 'id', // entity/resource identifier e.g. 1234
  Area = 'area', // application area e.g. controllers
  Procedure = 'procedure', // code block/function e.g. getUserEntries
  Step = 'step', // algorithm step e.g. filtering
}

export enum LogLevel {
  Fatal = 'fatal',
  Critical = 'critical',
  Error = 'error',
  Warning = 'warn',
  Performance = 'perf',
  Info = 'info',
  Debug = 'debug',
}

export type ILogConsumerType =
  | { session: (session: ILoggingSession) => void; entry?: (entry: ILogEntry) => void }
  | { session?: (session: ILoggingSession) => void; entry: (entry: ILogEntry) => void }
