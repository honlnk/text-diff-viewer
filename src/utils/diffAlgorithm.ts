/**
 * 差异算法集成模块
 * 基于diff-match-patch库实现字符级差异检测
 */

import { DIFF_DELETE, DIFF_INSERT, DIFF_EQUAL } from 'diff-match-patch'
import type { DiffResult, DiffRecord, DiffStats } from '@/types/diff'
import { preprocessText, splitIntoChars } from './textProcessor'

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
    // 导入diff-match-patch库（动态导入以优化打包）
    const { default: DiffMatchPatch } = await import('diff-match-patch')
    const dmp = new DiffMatchPatch()

    // 设置超时
    dmp.Diff_Timeout = finalOptions.timeout / 1000

    // 计算差异
    const diffs = dmp.diff_main(
      chars1.join(''),
      chars2.join('')
    )

    // 清理差异结果（合并连续的小差异）
    dmp.diff_cleanupSemantic(diffs)

    // 转换为我们的格式
    const diffRecords = convertDiffsToRecords(diffs)

    // 计算编辑距离
    const editDistance = calculateEditDistance(diffs)

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
 * 将diff-match-patch的差异结果转换为我们的DiffRecord格式
 */
function convertDiffsToRecords(
  diffs: [number, string][]
): DiffRecord[] {
  const records: DiffRecord[] = []
  let position1 = 0
  let position2 = 0

  for (const [operation, text] of diffs) {
    if (operation === DIFF_EQUAL) {
      // 相等的内容，跳过
      position1 += text.length
      position2 += text.length
    } else if (operation === DIFF_DELETE) {
      // 删除内容
      records.push({
        position: position1,
        type: 'delete',
        content: text
      })
      position1 += text.length
    } else if (operation === DIFF_INSERT) {
      // 新增内容
      records.push({
        position: position1, // 使用position1作为基准位置
        type: 'add',
        content: text
      })
      position2 += text.length
    }
  }

  return records
}

/**
 * 计算编辑距离
 */
function calculateEditDistance(diffs: [number, string][]): number {
  let distance = 0
  for (const [operation, text] of diffs) {
    if (operation !== DIFF_EQUAL) {
      distance += text.length
    }
  }
  return distance
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

  // 分析差异记录以确定修改数量
  const sortedDiffs = [...diffs].sort((a, b) => a.position - b.position)
  const processedIndices = new Set<number>()

  for (let i = 0; i < sortedDiffs.length; i++) {
    // 跳过已处理的记录
    if (processedIndices.has(i)) {
      continue
    }

    const diff = sortedDiffs[i]

    if (diff.type === 'add') {
      // 查找相邻的删除操作，可能组成修改操作
      let adjacentDeleteIndex = -1
      for (let j = 0; j < sortedDiffs.length; j++) {
        if (i !== j && !processedIndices.has(j) && sortedDiffs[j].type === 'delete') {
          if (Math.abs(sortedDiffs[j].position - diff.position) <= 5) {
            adjacentDeleteIndex = j
            break
          }
        }
      }

      if (adjacentDeleteIndex !== -1) {
        // 找到相邻的删除操作，计为修改
        modifications++
        processedIndices.add(i) // 标记当前add记录为已处理
        processedIndices.add(adjacentDeleteIndex) // 标记对应的delete记录为已处理
      } else {
        // 没有找到相邻的删除操作，计为新增
        additions++
      }
    } else if (diff.type === 'delete') {
      // 删除操作（如果没有被上面的add操作配对）
      deletions++
      processedIndices.add(i)
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