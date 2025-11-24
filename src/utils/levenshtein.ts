/**
 * Levenshtein算法独立模块
 * 实现基于动态规划的编辑距离计算和操作序列回溯
 */

import type { DiffRecord } from '@/types/diff'

/**
 * Levenshtein操作类型
 */
export type LevenshteinOperation = {
  type: 'replace' | 'delete' | 'insert'
  position: number
  oldChar?: string
  newChar?: string
}

/**
 * Levenshtein算法计算结果
 */
export interface LevenshteinResult {
  editDistance: number
  operations: LevenshteinOperation[]
}

/**
 * Levenshtein算法配置选项
 */
export interface LevenshteinOptions {
  timeout?: number // 超时时间（毫秒）
}

/**
 * Levenshtein算法核心实现
 * 计算两个字符数组之间的编辑距离和操作序列
 *
 * @param str1 第一个字符数组
 * @param str2 第二个字符数组
 * @param options 配置选项
 * @returns 编辑距离和操作序列
 */
export function calculateLevenshtein(
  str1: string[],
  str2: string[],
  options: LevenshteinOptions = {}
): LevenshteinResult {
  const timeout = options.timeout || 5000
  const startTime = Date.now()
  const m = str1.length
  const n = str2.length

  // 构建DP矩阵
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))

  // 初始化边界条件
  for (let i = 0; i <= m; i++) {
    dp[i][0] = i
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j
  }

  // 填充DP矩阵
  for (let i = 1; i <= m; i++) {
    // 检查超时
    if (Date.now() - startTime > timeout) {
      throw new Error('Levenshtein计算超时')
    }

    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,     // 删除操作
          dp[i][j - 1] + 1,     // 插入操作
          dp[i - 1][j - 1] + 1  // 替换操作
        )
      }
    }
  }

  // 回溯找到具体操作序列
  const operations: LevenshteinOperation[] = []
  let i = m, j = n

  while (i > 0 || j > 0) {
    // 字符相同，无需操作
    if (i > 0 && j > 0 && str1[i - 1] === str2[j - 1]) {
      i -= 1
      j -= 1
    }
    // 替换操作
    else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
      operations.push({
        type: 'replace',
        position: i - 1,
        oldChar: str1[i - 1],
        newChar: str2[j - 1]
      })
      i -= 1
      j -= 1
    }
    // 删除操作
    else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      operations.push({
        type: 'delete',
        position: i - 1,
        oldChar: str1[i - 1]
      })
      i -= 1
    }
    // 插入操作
    else if (j > 0 && dp[i][j] === dp[i][j - 1] + 1) {
      operations.push({
        type: 'insert',
        position: i,
        newChar: str2[j - 1]
      })
      j -= 1
    }
  }

  // 反转操作序列，使其按从前往后的顺序
  operations.reverse()

  return {
    editDistance: dp[m][n],
    operations
  }
}

/**
 * 将Levenshtein操作序列转换为DiffRecord格式
 *
 * @param operations Levenshtein操作序列
 * @param str1 原始字符数组（可选，用于调试）
 * @param str2 目标字符数组（可选，用于调试）
 * @returns DiffRecord数组
 */
export function convertOperationsToDiffRecords(
  operations: LevenshteinOperation[],
  _str1?: string[],
  _str2?: string[]
): DiffRecord[] {
  const records: DiffRecord[] = []

  for (const op of operations) {
    switch (op.type) {
      case 'replace':
        records.push({
          position: op.position,
          type: 'modify',
          content: op.newChar || '',
          originalContent: op.oldChar
        })
        break

      case 'delete':
        records.push({
          position: op.position,
          type: 'delete',
          content: op.oldChar || ''
        })
        break

      case 'insert':
        records.push({
          position: op.position,
          type: 'add',
          content: op.newChar || ''
        })
        break
    }
  }

  return records
}

/**
 * 计算编辑距离（仅返回距离值，不返回操作序列）
 *
 * @param str1 第一个字符数组
 * @param str2 第二个字符数组
 * @param options 配置选项
 * @returns 编辑距离
 */
export function calculateEditDistance(
  str1: string[],
  str2: string[],
  options: LevenshteinOptions = {}
): number {
  return calculateLevenshtein(str1, str2, options).editDistance
}

/**
 * 简化版本的Levenshtein算法，直接处理字符串
 *
 * @param text1 第一个文本
 * @param text2 第二个文本
 * @param options 配置选项
 * @returns 编辑距离和操作序列
 */
export function calculateLevenshteinForText(
  text1: string,
  text2: string,
  options: LevenshteinOptions = {}
): LevenshteinResult {
  const chars1 = Array.from(text1)
  const chars2 = Array.from(text2)

  return calculateLevenshtein(chars1, chars2, options)
}

/**
 * 验证Levenshtein算法配置
 */
export function validateLevenshteinOptions(options: LevenshteinOptions): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (options.timeout !== undefined && options.timeout <= 0) {
    errors.push('超时时间必须大于0')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}