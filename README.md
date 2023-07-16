TL;DR;

Helpers for structured logging.

# What?

In many occasions we like to 'log' to multiple streams (e.g. console, analytics server, error server, etc.). Some of these streams are interested in some messages, others in completely different messages. This code has a log collector (fancy name for a list of messages) that can be flushed in 1 go to send logs to various streams. By default a console stream is implemented

# Why?

There seems to be a gap between a 'common' logging interface and the ability to inject consumers and 'collect' logs over a certain scope while staying within the app. Ideally, we'd like to:

- add different consumers, with the ability to filter the messages to send each consumer
- categorise the messages (by various tags)
- retain an entire messages 'session' (regardless of their 'importance') and capture it completely on e.g. an error
- be able to do some aggregations (wrt to perf) - similar to what `Logstash` can do (without having to use external apps ofc)
- expose a contextualized logger for inner context (i.e. function F1 calls F2, and F2 logs a message. F1 would like to 'set some context = tags' on the message logged from F2 without F2 knowing)

# How does this look like in practice?

**src/paymentHandlers.ts**

```ts
import { CollectorLogger, LogTagType, LogLevel } from '@enhanced-dom/logging'
const logger = new CollectorLogger('my unique id for a list of logs', { [LogTagType.Area]: 'payments' })
const acceptBalanceInquiry = (balanceInquiry: SimpleBalanceInquiry | ComplicatedBalanceInquiry) => {
  enhancedLogger = logger.withTags({ [LogTagType.Procedure]: 'balance inquiry flow' })
  logger.log()
  if (validateBalanceInquiry(paymentInquiry, enhancedLogger)) {
    processBalanceInquiry(paymentInquiry, enhancedLogger)
  }
}

const validateBalanceInquiry = (balanceInquiry: SimpleBalanceInquiry | ComplicatedBalanceInquiry, enhancedLogger?: ILogger) => {
  const validationLogger = enhancedLogger?.withTags({
    [LogTagType.Step]: 'validation',
    [LogTagType.Entity]: balanceInquiry.type,
    [LogTagType.Id]: balanceInquiry.id,
  })
  validationLogger?.log({ stage: 'start' }, { [LogTagType.Level]: LogLevel.Perf }, 'Starting validation')
  /// validation code
  validationLogger?.log({ stage: 'end' }, { [LogTagType.Level]: LogLevel.Perf }, 'Ended validation')
  return true
}

const processBalanceInquiry = (balanceInquiry: SimpleBalanceInquiry | ComplicatedBalanceInquiry, enhancedLogger?: ILogger) => {
  const processLogger = enhancedLogger?.withTags({
    [LogTagType.Step]: 'process',
    [LogTagType.Entity]: balanceInquiry.type,
    [type: LogTagType.Id]: balanceInquiry.id
})
  validationLogger?.log({ stage: 'start' }, { [LogTagType.Level]: LogLevel.Perf }, 'Starting processing')
  /// process
  validationLogger?.log({ stage: 'end' }, { [LogTagType.Level]: LogLevel.Perf }, 'Ended processing')
}
```

Of course, this 'passing of logger through props' is not so ideal. One could do a service locator-like pattern where the right logger instance for a 'session id' is returned, but this fails short as soon as the tags need to be changed for the 'child' scope. In a tree-like context, one can access the parent contexts (e.g. dom nodes) to figure out which logger instance to use. This is much harder without binding the current execution to a global tree-like structure.
