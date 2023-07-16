import { CollectorLogger, LogTagType, LogLevel, ILoggingSession, ILogger } from '../src'

class TestSessionConsumer {
  public acceptedSessions: ILoggingSession[] = []

  public session(s: ILoggingSession) {
    this.acceptedSessions.push(s)
  }
}

describe('collector logger', () => {
  test('sends messages to consumers on flush', () => {
    const testConsumer1 = new TestSessionConsumer()
    const testConsumer2 = new TestSessionConsumer()
    const testSessionRepository = {}
    const logger1 = new CollectorLogger('aaa', { mytag: 'ccc' }, { test1: testConsumer1, test2: testConsumer2 }, testSessionRepository)
    let logger2: ILogger = new CollectorLogger(
      'bbb',
      { mytag: 'alfa' },
      { test1: testConsumer1, test2: testConsumer2 },
      testSessionRepository,
    )
    expect(testSessionRepository['aaa']).toBeDefined()
    expect(testSessionRepository['bbb']).toBeDefined()
    logger2 = logger2.withTags({ myothertag: 'beta' })
    const messagesList = [
      {
        tags: { [LogTagType.Level]: LogLevel.Critical },
        message: 'aaa',
        params: {},
      },
      {
        tags: { [LogTagType.Level]: LogLevel.Debug },
        message: 'bbb',
        params: {},
      },
    ]
    messagesList.forEach((m) => {
      logger1.log(m.params, m.tags, m.message)
      logger2.log(m.params, m.tags, m.message)
    })
    expect(testConsumer1.acceptedSessions.length).toEqual(0)
    expect(testConsumer2.acceptedSessions.length).toEqual(0)
    logger1.flush()
    logger2.flush()
    expect(testConsumer1.acceptedSessions.length).toEqual(2)
    expect(testConsumer2.acceptedSessions.length).toEqual(2)
  })
})
