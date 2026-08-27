import type { Context } from '@deepseek-ai/cordis'
import Schema from '@deepseek-ai/schemastery'
import { defineTool, type ToolDefinition } from '@deepseek-ai/dsh-tools'
import { runCliHub, validateInput, UPDATE_TIMEOUT_MS } from './utils'

/** 插件名称 */
export const name = '@BlueChonk/dsh-cli-anything'
/** 依赖注入声明 */
export const inject = ['tools']

/** 参数 schema 类型 */
interface ParamSchema {
  type: 'string' | 'boolean'
  required?: boolean
  description: string
}

/** 工具定义 */
interface ToolDef {
  name: string
  description: string
  parameters: Record<string, ParamSchema>
  action: string
  paramKey?: string
  paramDesc?: string
  needsConfirm?: boolean
  confirmMsg?: string
  timeout?: number
}

/** 工具定义列表 */
const TOOLS: ToolDef[] = [
  {
    name: 'cli_hub_list',
    description: '列出所有可用的 CLI-Anything 工具。返回工具名称、类别、描述和安装状态。',
    parameters: {},
    action: 'list',
  },
  {
    name: 'cli_hub_search',
    description: '按关键词搜索 CLI-Anything 工具。',
    parameters: { query: { type: 'string', required: true, description: '搜索关键词' } },
    action: 'search',
    paramKey: 'query',
    paramDesc: '搜索关键词',
  },
  {
    name: 'cli_hub_info',
    description: '查看指定工具的详细信息。',
    parameters: { name: { type: 'string', required: true, description: '工具名称' } },
    action: 'info',
    paramKey: 'name',
    paramDesc: '工具名称',
  },
  {
    name: 'cli_hub_install',
    description: '安装指定的 CLI-Anything 工具。',
    parameters: {
      name: { type: 'string', required: true, description: '要安装的工具名称' },
      confirm: { type: 'boolean', description: '确认安装（破坏性操作）' },
    },
    action: 'install',
    paramKey: 'name',
    paramDesc: '工具名称',
    needsConfirm: true,
    confirmMsg: '此操作将安装新工具',
    timeout: UPDATE_TIMEOUT_MS,
  },
  {
    name: 'cli_hub_launch',
    description: '启动已安装的 CLI-Anything 工具。',
    parameters: { name: { type: 'string', required: true, description: '要启动的工具名称' } },
    action: 'launch',
    paramKey: 'name',
    paramDesc: '工具名称',
  },
  {
    name: 'cli_hub_update',
    description: '更新已安装的 CLI-Anything 工具到最新版本。',
    parameters: {
      name: { type: 'string', required: true, description: '要更新的工具名称' },
      confirm: { type: 'boolean', description: '确认更新（破坏性操作）' },
    },
    action: 'update',
    paramKey: 'name',
    paramDesc: '工具名称',
    needsConfirm: true,
    confirmMsg: '此操作将修改已安装的工具',
    timeout: UPDATE_TIMEOUT_MS,
  },
  {
    name: 'cli_hub_uninstall',
    description: '卸载已安装的 CLI-Anything 工具。',
    parameters: {
      name: { type: 'string', required: true, description: '要卸载的工具名称' },
      confirm: { type: 'boolean', description: '确认卸载（破坏性操作）' },
    },
    action: 'uninstall',
    paramKey: 'name',
    paramDesc: '工具名称',
    needsConfirm: true,
    confirmMsg: '此操作不可恢复',
    timeout: UPDATE_TIMEOUT_MS,
  },
]

/**
 * 注册单个工具
 * @param tools - 工具注册表
 * @param def - 工具定义
 */
function registerTool(tools: { register: (def: ToolDefinition) => () => void }, def: ToolDef): () => void {
  return tools.register(defineTool({
    name: def.name,
    description: def.description,
    parameters: def.parameters,
    output: {
      schema: { type: 'string' as const },
      render: (_args: unknown, value: string) => [{ type: 'text' as const, text: value }],
    },
    async execute(args: Record<string, unknown>) {
      try {
        let param = ''
        if (def.paramKey) {
          param = validateInput(args[def.paramKey] as string | undefined, def.paramDesc || def.paramKey)
        }
        if (def.needsConfirm && !args.confirm) {
          return `⚠️ 确认${def.action} "${param}"？${def.confirmMsg}。设置 confirm=true 确认执行。`
        }
        return await runCliHub([def.action, param].filter(Boolean), def.timeout)
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        return `Error: ${message}`
      }
    },
  }))
}

/**
 * 插件入口函数
 * @param ctx - Cordis 上下文
 */
export function apply(ctx: Context) {
  const tools = ctx.tools

  for (const def of TOOLS) {
    ctx.effect(() => registerTool(tools, def))
  }
}
