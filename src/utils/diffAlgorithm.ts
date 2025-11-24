/**
 * 差异算法集成模块
 * 基于Levenshtein算法实现字符级差异检测
 */

import type { DiffResult, DiffStats } from '@/types/diff'
import { preprocessText, splitIntoChars } from './textProcessor'
import {
  calculateLevenshtein,
  convertOperationsToDiffRecords,
  type LevenshteinOptions
} from './levenshtein'

/**
 * 差异算法配置选项
 */
export interface DiffOptions {
  // 差异计算超时时间（毫秒）
  timeout?: number
  // 是否忽略空白字符差异
  ignoreWhitespace?: boolean
  // 是否忽略大小写差异
  ignoreCase?: boolean
  // 差异精度级别
  precision?: 'character' | 'word' | 'line'
}

/**
 * 默认差异算法配置
 */
const DEFAULT_DIFF_OPTIONS: Required<DiffOptions> = {
  timeout: 5000,
  ignoreWhitespace: false,
  ignoreCase: false,
  precision: 'character'
}

/**
 * 计算两个文本之间的差异
 * @param text1 第一个文本
 * @param text2 第二个文本
 * @param options 差异计算选项
 * @returns 差异结果
 */
export async function calculateDiff(
  text1: string,
  text2: string,
  options: DiffOptions = {}
): Promise<DiffResult> {
  const finalOptions = { ...DEFAULT_DIFF_OPTIONS, ...options }

  // 预处理文本
  const processedText1 = preprocessText(text1)
  const processedText2 = preprocessText(text2)

  // 应用忽略大小写选项
  const compareText1 = finalOptions.ignoreCase ? processedText1.toLowerCase() : processedText1
  const compareText2 = finalOptions.ignoreCase ? processedText2.toLowerCase() : processedText2

  // 根据精度级别选择分割方法
  const splitFunc = getSplitFunction(finalOptions.precision)
  const chars1 = splitFunc(compareText1)
  const chars2 = splitFunc(compareText2)

  try {
    // 使用Levenshtein算法计算差异
    const levenshteinOptions: LevenshteinOptions = {
      timeout: finalOptions.timeout
    }

    const { editDistance, operations } = calculateLevenshtein(
      chars1,
      chars2,
      levenshteinOptions
    )

    // 将操作序列转换为DiffRecord格式
    const diffRecords = convertOperationsToDiffRecords(operations, chars1, chars2)

    // 计算相似度
    const similarity = calculateSimilarity(processedText1, processedText2, editDistance)

    return {
      editDistance,
      diffs: diffRecords,
      similarity,
      text1: processedText1,
      text2: processedText2
    }
  } catch (error) {
    console.error('差异计算失败:', error)
    throw new Error(`差异计算失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

/**
 * 根据精度级别获取文本分割函数
 */
function getSplitFunction(precision: DiffOptions['precision']): (text: string) => string[] {
  switch (precision) {
    case 'character':
      return splitIntoChars
    case 'word':
      return (text: string) => text.split(/(\s+)/) // 保留空白符作为单独元素
    case 'line':
      return (text: string) => text.split(/(\n)/) // 保留换行符作为单独元素
    default:
      return splitIntoChars
  }
}

/**
 * 计算文本相似度百分比
 */
function calculateSimilarity(text1: string, text2: string, editDistance: number): number {
  const maxLength = Math.max(text1.length, text2.length)
  if (maxLength === 0) {
    return 100 // 两个空文本相似度为100%
  }

  // 使用相似度公式：(1 - 编辑距离/最大长度) * 100
  const similarity = Math.max(0, (1 - editDistance / maxLength) * 100)
  return Math.round(similarity * 100) / 100 // 保留两位小数
}

/**
 * 计算详细的差异统计信息
 */
export function calculateDiffStats(diffResult: DiffResult): DiffStats {
  const { diffs } = diffResult

  let additions = 0
  let deletions = 0
  let modifications = 0

  for (const diff of diffs) {
    switch (diff.type) {
      case 'add':
        additions++
        break
      case 'delete':
        deletions++
        break
      case 'modify':
        modifications++
        break
    }
  }

  // 确保结果不为负数
  return {
    additions: Math.max(0, additions),
    deletions: Math.max(0, deletions),
    modifications: Math.max(0, modifications),
    similarity: diffResult.similarity
  }
}

/**
 * 创建差异高亮数据
 * 用于可视化组件渲染
 */
export function createDiffHighlightData(diffResult: DiffResult): {
  leftText: Array<{ content: string; type: 'normal' | 'deleted' | 'modified' }>
  rightText: Array<{ content: string; type: 'normal' | 'added' | 'modified' }>
} {
  const { diffs, text1, text2 } = diffResult

  const leftText: Array<{ content: string; type: 'normal' | 'deleted' | 'modified' }> = []
  const rightText: Array<{ content: string; type: 'normal' | 'added' | 'modified' }> = []

  // 初始化为正常文本
  leftText.push({ content: text1, type: 'normal' })
  rightText.push({ content: text2, type: 'normal' })

  // 处理差异标记
  diffs.forEach(diff => {
    if (diff.type === 'delete') {
      // 在左文本中标记删除
      // 这里需要更复杂的逻辑来处理位置映射
    } else if (diff.type === 'add') {
      // 在右文本中标记新增
    }
  })

  // 这是一个简化版本，实际实现需要更复杂的位置映射逻辑
  return { leftText, rightText }
}

/**
 * 验证差异算法配置
 */
export function validateDiffOptions(options: DiffOptions): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (options.timeout !== undefined && options.timeout <= 0) {
    errors.push('超时时间必须大于0')
  }

  if (options.precision && !['character', 'word', 'line'].includes(options.precision)) {
    errors.push('精度级别必须是 character、word 或 line')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}