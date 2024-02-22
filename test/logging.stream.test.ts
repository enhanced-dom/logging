import { LogTagType, LogLevel, ILogEntry, StreamingLogger, levelClearsTreshold, getEntryLevel } from '../src'

class TestEntryConsumer {
  public acceptedEntries: ILogEntry[] = []
  private _entryFilter?: (e: ILogEntry) => boolean = () => true

  constructor(filter?: (e: ILogEntry) => boolean) {
    this._entryFilter = filter ?? this._entryFilter
  }

  public entry(e: ILogEntry) {
    if (this._entryFilter(e)) {
      this.acceptedEntries.push(e)
    }
  }
}

describe('streaming logger', () => {
  test('streams all messages to all consumers', () => {
    const testConsumer1 = new TestEntryConsumer((entry) => levelClearsTreshold(LogLevel.CRITICAL, getEntryLevel(entry)))
    const testConsumer2 = new TestEntryConsumer()
    const logger = new StreamingLogger({ mytag: 'ccc' }, { test1: testConsumer1, test2: testConsumer2 })
    const messagesList = [
      {
        tags: { [LogTagType.LEVEL]: LogLevel.CRITICAL },
        message: 'aaa',
        params: {},
      },
      {
        tags: { [LogTagType.LEVEL]: LogLevel.DEBUG },
        message: 'bbb',
        params: {},
      },
    ]
    messagesList.forEach((m) => logger.log(m.params, m.tags, m.message))
    expect(testConsumer1.acceptedEntries.length).toEqual(1)
    expect(testConsumer1.acceptedEntries[0].params).toEqual(messagesList[0].params)
    expect(testConsumer1.acceptedEntries[0].message).toEqual(messagesList[0].message)
    expect(testConsumer1.acceptedEntries[0].tags).toEqual({ ...messagesList[0].tags, mytag: 'ccc' })
    expect(testConsumer1.acceptedEntries[0].createdOn).toBeDefined()

    expect(testConsumer2.acceptedEntries.length).toEqual(2)
    expect(testConsumer2.acceptedEntries[0].params).toEqual(messagesList[0].params)
    expect(testConsumer2.acceptedEntries[0].message).toEqual(messagesList[0].message)
    expect(testConsumer2.acceptedEntries[0].tags).toEqual({ ...messagesList[0].tags, mytag: 'ccc' })
    expect(testConsumer2.acceptedEntries[0].createdOn).toBeDefined()
    expect(testConsumer2.acceptedEntries[1].params).toEqual(messagesList[1].params)
    expect(testConsumer2.acceptedEntries[1].message).toEqual(messagesList[1].message)
    expect(testConsumer2.acceptedEntries[1].tags).toEqual({ ...messagesList[1].tags, mytag: 'ccc' })
    expect(testConsumer2.acceptedEntries[1].createdOn).toBeDefined()
  })
})
