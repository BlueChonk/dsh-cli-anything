import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock child_process
const mockSpawn = vi.fn()
vi.mock('node:child_process', () => ({
  spawn: (...args: unknown[]) => mockSpawn(...args),
}))

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  mockSpawn.mockReset()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('runCliHub', () => {
  it('成功执行命令并返回 stdout', async () => {
    const { runCliHub } = await import('../src/utils')
    const mockChild = {
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      on: vi.fn(),
      kill: vi.fn(),
    }
    mockSpawn.mockReturnValue(mockChild)

    mockChild.stdout.on.mockImplementation((event: string, cb: (data: Buffer) => void) => {
      if (event === 'data') {
        cb(Buffer.from('test output'))
      }
    })
    mockChild.on.mockImplementation((event: string, cb: (code: number) => void) => {
      if (event === 'close') {
        cb(0)
      }
    })

    const result = await runCliHub(['list'])
    expect(result).toBe('test output')
    expect(mockSpawn).toHaveBeenCalledWith('cli-hub', ['list'], expect.any(Object))
  })

  it('设置 PYTHONIOENCODING 环境变量', async () => {
    const { runCliHub } = await import('../src/utils')
    const mockChild = {
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      on: vi.fn(),
      kill: vi.fn(),
    }
    mockSpawn.mockReturnValue(mockChild)

    mockChild.on.mockImplementation((event: string, cb: (code: number) => void) => {
      if (event === 'close') cb(0)
    })

    await runCliHub(['list'])
    const callArgs = mockSpawn.mock.calls[0] as [string, string[], { env: Record<string, string> }]
    expect(callArgs[2].env.PYTHONIOENCODING).toBe('utf-8')
  })

  it('处理 stderr 输出', async () => {
    const { runCliHub } = await import('../src/utils')
    const mockChild = {
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      on: vi.fn(),
      kill: vi.fn(),
    }
    mockSpawn.mockReturnValue(mockChild)

    mockChild.stderr.on.mockImplementation((event: string, cb: (data: Buffer) => void) => {
      if (event === 'data') {
        cb(Buffer.from('warning message'))
      }
    })
    mockChild.on.mockImplementation((event: string, cb: (code: number) => void) => {
      if (event === 'close') cb(0)
    })

    const warnSpy = vi.spyOn(console, 'warn')
    await runCliHub(['list'])
    expect(warnSpy).toHaveBeenCalledWith('[dsh-cli-anything] cli-hub stderr: warning message')
  })

  it('处理 spawn 错误', async () => {
    const { runCliHub } = await import('../src/utils')
    const mockChild = {
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      on: vi.fn(),
      kill: vi.fn(),
    }
    mockSpawn.mockReturnValue(mockChild)

    mockChild.on.mockImplementation((event: string, cb: (err: Error) => void) => {
      if (event === 'error') {
        cb(new Error('spawn ENOENT'))
      }
    })

    await expect(runCliHub(['list'])).rejects.toThrow('无法启动 cli-hub')
  })

  it('处理超时', async () => {
    const { runCliHub } = await import('../src/utils')
    const mockChild = {
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      on: vi.fn(),
      kill: vi.fn(),
    }
    mockSpawn.mockReturnValue(mockChild)

    vi.useFakeTimers()
    const promise = runCliHub(['list'], 1000)
    vi.advanceTimersByTime(1100)

    await expect(promise).rejects.toThrow('cli-hub 命令超时')
    expect(mockChild.kill).toHaveBeenCalledWith('SIGTERM')
    vi.useRealTimers()
  })

  it('使用自定义日志函数', async () => {
    const { runCliHub } = await import('../src/utils')
    const mockChild = {
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      on: vi.fn(),
      kill: vi.fn(),
    }
    mockSpawn.mockReturnValue(mockChild)

    mockChild.stderr.on.mockImplementation((event: string, cb: (data: Buffer) => void) => {
      if (event === 'data') {
        cb(Buffer.from('custom warning'))
      }
    })
    mockChild.on.mockImplementation((event: string, cb: (code: number) => void) => {
      if (event === 'close') cb(0)
    })

    const customLog = vi.fn()
    await runCliHub(['list'], 30_000, customLog)
    expect(customLog).toHaveBeenCalledWith('[dsh-cli-anything] cli-hub stderr: custom warning')
  })
})
