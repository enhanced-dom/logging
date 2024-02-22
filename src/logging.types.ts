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
  flush?: () => void
}

export enum LogTagType {
  LEVEL = 'level', // log level. e.g. info
  ENTITY = 'entity', // entity/resource type e.g. User
  ID = 'id', // entity/resource identifier e.g. 1234
  AREA = 'area', // application area e.g. controllers
  PROCEDURE = 'procedure', // code block/function e.g. getUserEntries
  STEP = 'step', // algorithm step e.g. filtering
}

export enum LogLevel {
  FATAL = 'fatal',
  CRITICAL = 'critical',
  ERROR = 'error',
  WARNING = 'warn',
  PERFORMANCE = 'perf',
  INFO = 'info',
  DEBUG = 'debug',
}

export type ILogConsumerType =
  | { session: (session: ILoggingSession) => void; entry?: (entry: ILogEntry) => void }
  | { session?: (session: ILoggingSession) => void; entry: (entry: ILogEntry) => void }
