import omit from 'lodash.omit'
import zip from 'lodash.zip'

import { ILogEntry, ILoggingSession, LogLevel, LogTagType } from './logging.types'

export const levelClearsTreshold = (tresholdLevel: string, evaluatedLevel?: string) => {
  switch (tresholdLevel) {
    case LogLevel.FATAL:
      return evaluatedLevel === LogLevel.FATAL
    case LogLevel.CRITICAL:
      return [LogLevel.FATAL, LogLevel.CRITICAL].includes(evaluatedLevel as LogLevel)
    case LogLevel.ERROR:
      return [LogLevel.FATAL, LogLevel.CRITICAL, LogLevel.ERROR].includes(evaluatedLevel as LogLevel)
    case LogLevel.WARNING:
      return [LogLevel.FATAL, LogLevel.CRITICAL, LogLevel.ERROR, LogLevel.WARNING].includes(evaluatedLevel as LogLevel)
    case LogLevel.PERFORMANCE:
      return [LogLevel.FATAL, LogLevel.CRITICAL, LogLevel.ERROR, LogLevel.WARNING, LogLevel.PERFORMANCE].includes(
        evaluatedLevel as LogLevel,
      )
    case LogLevel.INFO:
      return [LogLevel.FATAL, LogLevel.CRITICAL, LogLevel.ERROR, LogLevel.WARNING, LogLevel.PERFORMANCE, LogLevel.INFO].includes(
        evaluatedLevel as LogLevel,
      )
    default:
      return true
  }
}

export const getEntryLevel = (entry: ILogEntry) => {
  return entry.tags[LogTagType.LEVEL]
}

let defaultConfig: {
  level: any
  sessionFilter: (session: ILoggingSession) => boolean
  entryFilter: (entries: ILogEntry[]) => ILogEntry[]
  sessionSerializer: (session: ILoggingSession) => string
  entrySerializer: (entry: ILogEntry) => string
} = Object.freeze({
  level: LogLevel.ERROR,
  sessionFilter: () => true,
  entryFilter: (entries) => entries.filter((e) => levelClearsTreshold(defaultConfig.level, getEntryLevel(e))),
  sessionSerializer: (session: ILoggingSession) => {
    const listOfFormattedEntries = zip(
      new Array(session.entries.length - 1).fill('\t'),
      session.entries.map((e) => defaultConfig.entrySerializer(e)),
      new Array(session.entries.length - 1).fill('\n'),
    ).flatMap((a) => a.filter((e) => !!e))
    return [`Log session with tags ${JSON.stringify(session.tags)}}:`, '\n', ...listOfFormattedEntries].join()
  },
  entrySerializer: (entry) => {
    return `${entry.createdOn} | ${JSON.stringify(entry.tags)} | ${entry.message}`
  },
})

export const defaultLookbackEntrySelector = (entries: ILogEntry[]) => {
  const anyEntryClearsThreshold = entries.some((e) => levelClearsTreshold(defaultConfig.level, getEntryLevel(e)))
  return anyEntryClearsThreshold ? entries : []
}

export const defaultPerformanceEntryCompactor = (entries: ILogEntry[]) => {
  const performanceEndEntries = entries.filter((e) => e.tags[LogTagType.LEVEL] === LogLevel.PERFORMANCE && e.params.stage === 'end')
  const performanceEntryPairs = performanceEndEntries.map((endEntry) => [
    entries.find(
      (possibleStartEntry) =>
        possibleStartEntry.params.stage === 'start' && JSON.stringify(endEntry.tags) == JSON.stringify(possibleStartEntry.tags),
    ),
    endEntry,
  ])
  const entryPairsToCompact = performanceEntryPairs.filter(([startEntry]) => !!startEntry)
  if (!entryPairsToCompact) {
    return entries
  }
  const compactedEntries = [...entries]
  entryPairsToCompact.forEach(([startEntry, endEntry]) => {
    compactedEntries.splice(compactedEntries.indexOf(endEntry), 1, {
      tags: startEntry.tags,
      createdOn: endEntry.createdOn,
      params: omit({ ...startEntry.params, elapsed: endEntry.createdOn.valueOf() - startEntry.createdOn.valueOf(), ...endEntry.params }, [
        'stage',
      ]),
      message: 'Performance calculation',
    })
  })
  return compactedEntries
}

export const defaultConsoleConsumer = {
  session: (session: ILoggingSession) => {
    if (!defaultConfig.sessionFilter(session)) {
      return
    }
    const entriesToShow = defaultConfig.entryFilter(session.entries)
    if (!entriesToShow.length) {
      return
    }
    console.log(defaultConfig.sessionSerializer({ ...session, entries: entriesToShow }))
  },
  entry: (entry: ILogEntry) => {
    const entriesToShow = defaultConfig.entryFilter([entry])
    if (!entriesToShow.length) {
      return
    }
    console.log(defaultConfig.entrySerializer(entry))
  },
}

export const configureDefaultConsoleConsumer = (config: Partial<typeof defaultConfig>) => {
  defaultConfig = Object.freeze({ ...defaultConfig, ...config })
}

export const getDefaultConsoleConsumerConfig = () => {
  return defaultConfig
}
