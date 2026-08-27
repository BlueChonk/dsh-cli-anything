import { spawn } from 'node:child_process'

export const TIMEOUT_MS = 30_000
export const UPDATE_TIMEOUT_MS = 120_000
export const MAX_INPUT_LENGTH = 100

/** 日志函数类型 */
type LogFn = (message: string) => void

/** 默认日志函数 */
const defaultLog: LogFn = (message: string) => {
  console.warn(message)
}

/**
 * 执行 cli-hub 命令
 * @param args - 命令参数数组（不含 'cli-hub' 本身）
 * @param timeout - 超时时间（毫秒）
 * @param log - 可选的日志函数
 * @returns 命令标准输出
 */
export function runCliHub(
  args: string[],
  timeout: number = TIMEOUT_MS,
  log: LogFn = defaultLog
): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn('cli-hub', args, {
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
      windowsHide: true,
    })

    let stdout = ''
    let stderr = ''
    let settled = false

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true
        child.kill('SIGTERM')
        stdout = ''
        stderr = ''
        reject(new Error(`cli-hub 命令超时（${timeout / 1000}秒）`))
      }
    }, timeout)

    child.stdout.on('data', (data: Buffer) => {
      stdout += data.toString('utf-8')
    })

    child.stderr.on('data', (data: Buffer) => {
      stderr += data.toString('utf-8')
    })

    child.on('error', (err) => {
      if (!settled) {
        settled = true
        clearTimeout(timer)
        reject(new Error(`无法启动 cli-hub: ${err.message}。请确保已安装 cli-anything-hub: pip install cli-anything-hub`))
      }
    })

    child.on('close', () => {
      if (!settled) {
        settled = true
        clearTimeout(timer)
        if (stderr.trim()) {
          log(`[dsh-cli-anything] cli-hub stderr: ${stderr.trim()}`)
        }
        resolve(stdout)
      }
    })
  })
}

/**
 * 验证输入字符串
 * @param value - 待验证的值
 * @param fieldName - 字段名称（用于错误提示）
 * @returns 去除首尾空格的字符串
 * @throws 当值为空、非字符串、过长或包含控制字符时抛出错误
 */
export function validateInput(value: string | undefined, fieldName: string): string {
  if (!value || typeof value !== 'string' || !value.trim()) {
    throw new Error(`${fieldName} 不能为空`)
  }
  const trimmed = value.trim()
  if (trimmed.length > MAX_INPUT_LENGTH) {
    throw new Error(`${fieldName} 过长（最大 ${MAX_INPUT_LENGTH} 字符）`)
  }
  if (/[\x00-\x1f\x7f]/.test(trimmed)) {
    throw new Error(`${fieldName} 包含非法控制字符`)
  }
  return trimmed
}
