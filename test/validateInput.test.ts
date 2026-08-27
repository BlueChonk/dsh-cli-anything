import { describe, it, expect } from 'vitest'
import { validateInput, MAX_INPUT_LENGTH } from '../src/utils'

describe('validateInput', () => {
  describe('正常输入', () => {
    it('返回 trimmed 值', () => {
      expect(validateInput('  ollama  ', '工具名称')).toBe('ollama')
    })

    it('处理无空格的输入', () => {
      expect(validateInput('ollama', '工具名称')).toBe('ollama')
    })

    it('处理包含空格的输入', () => {
      expect(validateInput('  hello world  ', '搜索关键词')).toBe('hello world')
    })
  })

  describe('空值处理', () => {
    it('undefined 抛出错误', () => {
      expect(() => validateInput(undefined, '工具名称')).toThrow('工具名称 不能为空')
    })

    it('空字符串抛出错误', () => {
      expect(() => validateInput('', '工具名称')).toThrow('工具名称 不能为空')
    })

    it('纯空格抛出错误', () => {
      expect(() => validateInput('   ', '工具名称')).toThrow('工具名称 不能为空')
    })

    it('非字符串类型抛出错误', () => {
      expect(() => validateInput(123 as any, '工具名称')).toThrow('工具名称 不能为空')
    })

    it('null 抛出错误', () => {
      expect(() => validateInput(null as any, '工具名称')).toThrow('工具名称 不能为空')
    })
  })

  describe('长度限制', () => {
    it('允许最大长度输入', () => {
      const input = 'a'.repeat(MAX_INPUT_LENGTH)
      expect(validateInput(input, '工具名称')).toBe(input)
    })

    it('超过最大长度抛出错误', () => {
      const input = 'a'.repeat(MAX_INPUT_LENGTH + 1)
      expect(() => validateInput(input, '工具名称')).toThrow(`工具名称 过长（最大 ${MAX_INPUT_LENGTH} 字符）`)
    })
  })

  describe('控制字符过滤', () => {
    it('过滤 NULL 字符', () => {
      expect(() => validateInput('hello\x00world', '工具名称')).toThrow('工具名称 包含非法控制字符')
    })

    it('过滤换行符', () => {
      expect(() => validateInput('hello\nworld', '工具名称')).toThrow('工具名称 包含非法控制字符')
    })

    it('过滤制表符', () => {
      expect(() => validateInput('hello\tworld', '工具名称')).toThrow('工具名称 包含非法控制字符')
    })

    it('过滤 DEL 字符', () => {
      expect(() => validateInput('hello\x7fworld', '工具名称')).toThrow('工具名称 包含非法控制字符')
    })
  })
})
