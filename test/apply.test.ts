import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock utils 模块
const mockRunCliHub = vi.fn()
const actualUtils = await vi.importActual<typeof import('../src/utils')>('../src/utils')

vi.mock('../src/utils', () => ({
  ...actualUtils,
  runCliHub: (...args: unknown[]) => mockRunCliHub(...args),
}))

beforeEach(() => {
  mockRunCliHub.mockReset()
})

interface MockToolDefinition {
  name: string
  description: string
  parameters: Record<string, unknown>
  execute: (args: Record<string, unknown>) => Promise<string>
}

describe('apply - 工具注册', () => {
  it('注册 7 个工具', async () => {
    const { apply, name, inject } = await import('../src/index')

    const mockTools = { register: vi.fn(() => vi.fn()) }
    const mockCtx = {
      tools: mockTools,
      effect: vi.fn((fn: () => () => void) => fn()),
    }

    apply(mockCtx)

    expect(name).toBe('@BlueChonk/dsh-cli-anything')
    expect(inject).toEqual(['tools'])
    expect(mockCtx.effect).toHaveBeenCalledTimes(7)
    expect(mockTools.register).toHaveBeenCalledTimes(7)
  })

  it('cli_hub_list 正确调用', async () => {
    const { apply } = await import('../src/index')
    mockRunCliHub.mockResolvedValue('tool list output')

    const mockTools = { register: vi.fn(() => vi.fn()) }
    const mockCtx = {
      tools: mockTools,
      effect: vi.fn((fn: () => () => void) => fn()),
    }

    apply(mockCtx)

    const firstCall = mockTools.register.mock.calls[0][0] as MockToolDefinition
    expect(firstCall.name).toBe('cli_hub_list')

    const result = await firstCall.execute({})
    expect(mockRunCliHub).toHaveBeenCalledWith(['list'], undefined)
    expect(result).toBe('tool list output')
  })

  it('cli_hub_search 验证参数', async () => {
    const { apply } = await import('../src/index')
    mockRunCliHub.mockResolvedValue('search result')

    const mockTools = { register: vi.fn(() => vi.fn()) }
    const mockCtx = {
      tools: mockTools,
      effect: vi.fn((fn: () => () => void) => fn()),
    }

    apply(mockCtx)

    const searchCall = mockTools.register.mock.calls.find(
      (call: [MockToolDefinition]) => call[0].name === 'cli_hub_search'
    )
    expect(searchCall).toBeDefined()

    const result = await searchCall![0].execute({ query: 'ai' })
    expect(mockRunCliHub).toHaveBeenCalledWith(['search', 'ai'], undefined)
    expect(result).toBe('search result')
  })

  it('cli_hub_install 需要确认', async () => {
    const { apply } = await import('../src/index')

    const mockTools = { register: vi.fn(() => vi.fn()) }
    const mockCtx = {
      tools: mockTools,
      effect: vi.fn((fn: () => () => void) => fn()),
    }

    apply(mockCtx)

    const installCall = mockTools.register.mock.calls.find(
      (call: [MockToolDefinition]) => call[0].name === 'cli_hub_install'
    )

    // 未确认时返回提示
    const result = await installCall![0].execute({ name: 'ollama', confirm: false })
    expect(result).toContain('确认')
    expect(result).toContain('安装')
    expect(mockRunCliHub).not.toHaveBeenCalled()

    // 确认后执行安装
    mockRunCliHub.mockResolvedValue('install success')
    const result2 = await installCall![0].execute({ name: 'ollama', confirm: true })
    expect(mockRunCliHub).toHaveBeenCalledWith(['install', 'ollama'], 120_000)
    expect(result2).toBe('install success')
  })

  it('cli_hub_launch 正确调用', async () => {
    const { apply } = await import('../src/index')
    mockRunCliHub.mockResolvedValue('launch result')

    const mockTools = { register: vi.fn(() => vi.fn()) }
    const mockCtx = {
      tools: mockTools,
      effect: vi.fn((fn: () => () => void) => fn()),
    }

    apply(mockCtx)

    const launchCall = mockTools.register.mock.calls.find(
      (call: [MockToolDefinition]) => call[0].name === 'cli_hub_launch'
    )

    const result = await launchCall![0].execute({ name: 'clibrowser' })
    expect(mockRunCliHub).toHaveBeenCalledWith(['launch', 'clibrowser'], undefined)
    expect(result).toBe('launch result')
  })

  it('cli_hub_update 需要确认', async () => {
    const { apply } = await import('../src/index')

    const mockTools = { register: vi.fn(() => vi.fn()) }
    const mockCtx = {
      tools: mockTools,
      effect: vi.fn((fn: () => () => void) => fn()),
    }

    apply(mockCtx)

    const updateCall = mockTools.register.mock.calls.find(
      (call: [MockToolDefinition]) => call[0].name === 'cli_hub_update'
    )

    // 未确认时返回提示
    const result = await updateCall![0].execute({ name: 'ollama', confirm: false })
    expect(result).toContain('确认')
    expect(result).toContain('修改已安装的工具')
    expect(mockRunCliHub).not.toHaveBeenCalled()

    // 确认后执行更新
    mockRunCliHub.mockResolvedValue('update success')
    const result2 = await updateCall![0].execute({ name: 'ollama', confirm: true })
    expect(mockRunCliHub).toHaveBeenCalledWith(['update', 'ollama'], 120_000)
    expect(result2).toBe('update success')
  })

  it('cli_hub_uninstall 需要确认', async () => {
    const { apply } = await import('../src/index')

    const mockTools = { register: vi.fn(() => vi.fn()) }
    const mockCtx = {
      tools: mockTools,
      effect: vi.fn((fn: () => () => void) => fn()),
    }

    apply(mockCtx)

    const uninstallCall = mockTools.register.mock.calls.find(
      (call: [MockToolDefinition]) => call[0].name === 'cli_hub_uninstall'
    )

    const result = await uninstallCall![0].execute({ name: 'ollama', confirm: false })
    expect(result).toContain('此操作不可恢复')
  })

  it('错误处理返回 Error 字符串', async () => {
    const { apply } = await import('../src/index')
    mockRunCliHub.mockRejectedValue(new Error('command failed'))

    const mockTools = { register: vi.fn(() => vi.fn()) }
    const mockCtx = {
      tools: mockTools,
      effect: vi.fn((fn: () => () => void) => fn()),
    }

    apply(mockCtx)

    const firstCall = mockTools.register.mock.calls[0][0] as MockToolDefinition
    const result = await firstCall.execute({})
    expect(result).toBe('Error: command failed')
  })

  it('空参数时 validateInput 抛出错误', async () => {
    const { apply } = await import('../src/index')

    const mockTools = { register: vi.fn(() => vi.fn()) }
    const mockCtx = {
      tools: mockTools,
      effect: vi.fn((fn: () => () => void) => fn()),
    }

    apply(mockCtx)

    const searchCall = mockTools.register.mock.calls.find(
      (call: [MockToolDefinition]) => call[0].name === 'cli_hub_search'
    )

    const result = await searchCall![0].execute({ query: '' })
    expect(result).toBe('Error: 搜索关键词 不能为空')
  })
})
