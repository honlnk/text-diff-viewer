/**
 * 文本处理工具函数
 * 负责文本预处理、标准化和跨平台兼容性处理
 */

/**
 * 标准化换行符处理
 * 将所有换行符统一转换为 \n
 */
export function normalizeLineBreaks(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}

/**
 * 移除BOM标记
 * 处理UTF-8 BOM标记
 */
export function removeBOM(text: string): string {
  if (text.charCodeAt(0) === 0xFEFF) {
    return text.slice(1)
  }
  return text
}

/**
 * 标准化空白字符
 * 将制表符转换为空格，规范化连续空格
 */
export function normalizeWhitespace(text: string, options: {
  preserveTabs?: boolean
  normalizeSpaces?: boolean
  maxConsecutiveSpaces?: number
} = {}): string {
  const {
    preserveTabs = false,
    normalizeSpaces = true,
    maxConsecutiveSpaces = 2
  } = options

  let result = text

  // 处理制表符
  if (!preserveTabs) {
    result = result.replace(/\t/g, ' ')
  }

  // 规范化连续空格
  if (normalizeSpaces && maxConsecutiveSpaces > 0) {
    result = result.replace(new RegExp(` {${maxConsecutiveSpaces + 1},}`, 'g'), ' '.repeat(maxConsecutiveSpaces))
  }

  return result
}

/**
 * 完整的文本预处理
 * 应用所有标准化处理
 */
export function preprocessText(
  text: string,
  options: {
    removeBOM?: boolean
    normalizeLineBreaks?: boolean
    normalizeWhitespace?: boolean
    whitespaceOptions?: Parameters<typeof normalizeWhitespace>[1]
  } = {}
): string {
  const {
    removeBOM: shouldRemoveBOM = true,
    normalizeLineBreaks: shouldNormalizeLineBreaks = true,
    normalizeWhitespace: shouldNormalizeWhitespace = true,
    whitespaceOptions = {}
  } = options

  let result = text

  // 移除BOM
  if (shouldRemoveBOM) {
    result = removeBOM(result)
  }

  // 标准化换行符
  if (shouldNormalizeLineBreaks) {
    result = normalizeLineBreaks(result)
  }

  // 标准化空白字符
  if (shouldNormalizeWhitespace) {
    result = normalizeWhitespace(result, whitespaceOptions)
  }

  return result
}

/**
 * 将多行文本拉平为单行字符串（用于字符级差异对比）
 */
export function flattenText(text: string): string {
  return text.replace(/\n/g, '\\n')
}

/**
 * 从拉平的文本还原多行格式
 */
export function unflattenText(text: string): string {
  return text.replace(/\\n/g, '\n')
}

/**
 * 文本分割为字符数组
 * 处理Unicode代理对和组合字符
 */
export function splitIntoChars(text: string): string[] {
  // 使用扩展运算符正确处理Unicode字符
  return [...text]
}

/**
 * 计算文本统计信息
 */
export function calculateTextStats(text: string): {
  charCount: number
  lineCount: number
  wordCount: number
  byteLength: number
} {
  const chars = splitIntoChars(text)
  const lines = text.split('\n')
  const words = text.trim().split(/\s+/).filter(word => word.length > 0)

  return {
    charCount: chars.length,
    lineCount: lines.length,
    wordCount: text.trim() ? words.length : 0,
    byteLength: new Blob([text]).size
  }
}

/**
 * 验证文本内容
 */
export function validateTextContent(text: string): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // 检查是否为空
  if (!text || text.trim().length === 0) {
    errors.push('文本内容为空')
    return { isValid: false, errors, warnings }
  }

  // 检查是否包含控制字符（除了换行符和制表符）
  const controlChars = text.match(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g)
  if (controlChars) {
    warnings.push(`文本包含 ${controlChars.length} 个控制字符，可能会影响对比结果`)
  }

  // 检查是否包含混合换行符
  const hasCRLF = /\r\n/.test(text)
  const hasLF = /[^\r]\n/.test(text)
  const hasCR = /\r[^\n]/.test(text)

  if ((hasCRLF && hasLF) || (hasCRLF && hasCR) || (hasLF && hasCR)) {
    warnings.push('文本包含混合的换行符格式，将自动标准化')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}