import type { DiffResult, FileData, DiffStats, ExportOptions } from '@/types/diff'

/**
 * HTML导出器 - 将差异对比结果导出为HTML文档
 *
 * 功能特性：
 * - 完整的差异可视化HTML导出
 * - 内联CSS样式，无需外部依赖
 * - 元数据信息记录（时间、文件名、统计）
 * - 标准化HTML5文档结构
 * - 跨浏览器兼容性
 */

/**
 * 默认导出配置
 */
const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  includeMetadata: true,
  includeTimestamp: true,
  includeStats: true
}

/**
 * HTML模板和样式常量
 */
const HTML_STYLES = `
/* 差异对比导出样式 */
.diff-export {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: #333;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  background: #f8f9fa;
}

.diff-export h1,
.diff-export h2,
.diff-export h3 {
  color: #2c3e50;
  margin-top: 2em;
  margin-bottom: 1em;
}

.diff-export h1 {
  text-align: center;
  font-size: 2.5em;
  margin-bottom: 1em;
  border-bottom: 3px solid #3498db;
  padding-bottom: 0.5em;
}

.diff-export .metadata {
  background: white;
  padding: 1.5em;
  border-radius: 8px;
  margin: 2em 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.diff-export .metadata h2 {
  margin-top: 0;
  color: #34495e;
}

.diff-export .metadata-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5em;
}

.diff-export .metadata-item h4 {
  margin: 0 0 0.5em 0;
  color: #2c3e50;
  font-size: 1.1em;
}

.diff-export .metadata-item p {
  margin: 0.25em 0;
  font-size: 0.95em;
}

.diff-export .stats {
  background: white;
  padding: 1.5em;
  border-radius: 8px;
  margin: 2em 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.diff-export .stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1em;
  text-align: center;
}

.diff-export .stat-item {
  padding: 1em;
  border-radius: 6px;
  font-weight: bold;
}

.diff-export .stat-additions {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.diff-export .stat-deletions {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.diff-export .stat-modifications {
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.diff-export .stat-similarity {
  background: #e2e3e5;
  color: #383d41;
  border: 1px solid #d6d8db;
}

.diff-export .stat-number {
  font-size: 2em;
  display: block;
  margin-bottom: 0.5em;
}

.diff-export .stat-label {
  font-size: 0.9em;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.diff-export .diff-content {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin: 2em 0;
}

.diff-export .diff-header {
  background: #34495e;
  color: white;
  padding: 1em 1.5em;
  font-weight: bold;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.diff-export .diff-content-display {
  padding: 1em 1.5em;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.75;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 80vh;
  overflow-y: auto;
  background: white;
  border-radius: 0 0 8px 8px;
}

/* 与DiffViewer组件完全一致的样式 */
.diff-export .bg-red-100 {
  background-color: #fef2f2 !important;
}

.diff-export .text-red-900 {
  color: #7f1d1d !important;
}

.diff-export .line-through {
  text-decoration: line-through !important;
}

.diff-export .bg-green-100 {
  background-color: #f0fdf4 !important;
}

.diff-export .text-green-900 {
  color: #14532d !important;
}

.diff-export .bg-blue-100 {
  background-color: #eff6ff !important;
}

.diff-export .text-blue-900 {
  color: #1e3a8a !important;
}

.diff-export .text-gray-900 {
  color: #111827 !important;
}

/* 确保span元素正确显示 */
.diff-export .diff-content-display span {
  border-radius: 2px;
  padding: 1px 2px;
  margin: 0 1px;
}

.diff-export .diff-content-display span.bg-red-100,
.diff-export .diff-content-display span.bg-green-100,
.diff-export .diff-content-display span.bg-blue-100 {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

/* 保留原有的行级样式作为备用 */
.diff-export .diff-line {
  padding: 0.5em 1.5em;
  border-bottom: 1px solid #f0f0f0;
  position: relative;
}

.diff-export .diff-line:hover {
  background: #f8f9fa;
}

.diff-export .diff-add {
  background: #d4edda;
  color: #155724;
  border-left: 4px solid #28a745;
}

.diff-export .diff-delete {
  background: #f8d7da;
  color: #721c24;
  border-left: 4px solid #dc3545;
}

.diff-export .diff-modify {
  background: #fff3cd;
  color: #856404;
  border-left: 4px solid #ffc107;
}

.diff-export .diff-equal {
  background: white;
  color: #333;
}

.diff-export .diff-legend {
  background: white;
  padding: 1.5em;
  border-radius: 8px;
  margin: 2em 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.diff-export .legend-items {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5em;
  justify-content: center;
}

.diff-export .legend-item {
  display: flex;
  align-items: center;
  font-size: 0.9em;
}

.diff-export .legend-color {
  width: 20px;
  height: 20px;
  border-radius: 3px;
  margin-right: 0.5em;
  border: 1px solid #ddd;
}

.diff-export .legend-color.add {
  background: #d4edda;
  border-color: #28a745;
}

.diff-export .legend-color.delete {
  background: #f8d7da;
  border-color: #dc3545;
}

.diff-export .legend-color.modify {
  background: #fff3cd;
  border-color: #ffc107;
}

.diff-export .legend-color.equal {
  background: white;
  border-color: #ddd;
}

.diff-export footer {
  text-align: center;
  margin-top: 3em;
  padding-top: 2em;
  border-top: 1px solid #ddd;
  color: #666;
  font-size: 0.9em;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .diff-export {
    padding: 10px;
  }

  .diff-export .metadata-grid,
  .diff-export .stats-grid {
    grid-template-columns: 1fr;
  }

  .diff-export .legend-items {
    flex-direction: column;
    align-items: center;
  }

  .diff-export .diff-content-display,
  .diff-export .diff-text {
    font-size: 12px;
  }

  .diff-export .diff-line {
    padding: 0.25em 0.5em;
  }
}

/* 打印样式 */
@media print {
  .diff-export {
    max-width: none;
    margin: 0;
    padding: 0;
  }

  .diff-export .diff-content,
  .diff-export .metadata,
  .diff-export .stats,
  .diff-export .diff-legend {
    box-shadow: none;
    border: 1px solid #ddd;
  }

  .diff-export .diff-content-display,
  .diff-export .diff-text {
    max-height: none;
    overflow: visible;
  }
}
`

/**
 * 生成时间戳字符串
 */
function generateTimestamp(): string {
  const now = new Date()
  return now.toISOString()
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }
}

/**
 * 格式化文本长度
 */
function formatTextLength(text: string): string {
  const length = text.length
  if (length < 1000) {
    return `${length} 字符`
  } else if (length < 1000000) {
    return `${(length / 1000).toFixed(1)} K 字符`
  } else {
    return `${(length / 1000000).toFixed(1)} M 字符`
  }
}

/**
 * 转义HTML特殊字符
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * 创建统一差异片段 - 与DiffViewer组件完全一致的逻辑
 * 基于排序后的差异记录处理，确保HTML导出与页面显示一致
 */
function createUnifiedSegments(
  diffResult: DiffResult
): Array<{ content: string; type: string }> {
  const segments: Array<{ content: string; type: string }> = []
  const { text1, diffs } = diffResult

  // 如果没有差异，直接返回原文本
  if (diffs.length === 0) {
    return [{ content: text1, type: 'normal' }]
  }

  // 按位置排序差异记录
  const sortedDiffs = [...diffs].sort((a, b) => a.position - b.position)
  let currentIndex = 0

  for (const diff of sortedDiffs) {
    // 添加差异前的正常文本
    if (diff.position > currentIndex) {
      const normalText = text1.slice(currentIndex, diff.position)
      if (normalText) {
        segments.push({ content: normalText, type: 'normal' })
      }
    }

    // 处理差异 - 与DiffViewer组件完全一致的处理逻辑
    if (diff.type === 'delete') {
      segments.push({ content: diff.content, type: 'deleted' })
      currentIndex = diff.position + diff.content.length
    } else if (diff.type === 'add') {
      segments.push({ content: diff.content, type: 'added' })
      // 新增不改变位置索引，保持在当前位置
    } else if (diff.type === 'modify') {
      // 对于修改操作，使用与DiffViewer组件完全一致的方式
      // 分解为删除+新增，保持与其他diff类型的一致性
      if (diff.originalContent) {
        segments.push({ content: diff.originalContent, type: 'deleted' })
        currentIndex = diff.position + diff.originalContent.length
      }
      segments.push({ content: diff.content, type: 'added' })
    }
  }

  // 添加剩余的正常文本
  if (currentIndex < text1.length) {
    const remainingText = text1.slice(currentIndex)
    if (remainingText) {
      segments.push({ content: remainingText, type: 'normal' })
    }
  }

  return segments
}

/**
 * 生成差异内容的HTML - 与DiffViewer组件显示效果一致
 */
function generateDiffHTML(diffResult: DiffResult): string {
  if (!diffResult.diffs || diffResult.diffs.length === 0) {
    return '<div class="diff-line diff-equal">没有检测到差异</div>'
  }

  // 使用与DiffViewer组件完全相同的逻辑来生成片段
  const segments = createUnifiedSegments(diffResult)

  const segmentsHTML = segments.map(segment => {
    const escapedContent = escapeHtml(segment.content)
    let spanClass = ''

    switch (segment.type) {
      case 'deleted':
        spanClass = 'bg-red-100 text-red-900 line-through'
        break
      case 'added':
        spanClass = 'bg-green-100 text-green-900'
        break
      case 'modified':
        spanClass = 'bg-blue-100 text-blue-900'
        break
      default:
        spanClass = 'text-gray-900'
    }

    return `<span class="${spanClass}">${escapedContent}</span>`
  })

  return `<div class="diff-content-display">${segmentsHTML.join('')}</div>`
}

/**
 * 生成元数据HTML
 */
function generateMetadataHTML(data1: FileData, data2: FileData, timestamp: string): string {
  return `
    <div class="metadata">
      <h2>📋 对比信息</h2>
      <div class="metadata-grid">
        <div class="metadata-item">
          <h4>对比项 1</h4>
          <p><strong>名称:</strong> ${data1.name || '文本输入'}</p>
          <p><strong>类型:</strong> ${data1.type === 'file' ? '文件' : '文本输入'}</p>
          <p><strong>大小:</strong> ${data1.size ? formatFileSize(data1.size) : formatTextLength(data1.content)}</p>
        </div>
        <div class="metadata-item">
          <h4>对比项 2</h4>
          <p><strong>名称:</strong> ${data2.name || '文本输入'}</p>
          <p><strong>类型:</strong> ${data2.type === 'file' ? '文件' : '文本输入'}</p>
          <p><strong>大小:</strong> ${data2.size ? formatFileSize(data2.size) : formatTextLength(data2.content)}</p>
        </div>
        <div class="metadata-item">
          <h4>生成信息</h4>
          <p><strong>导出时间:</strong> ${new Date(timestamp).toLocaleString('zh-CN')}</p>
          <p><strong>格式:</strong> HTML5</p>
          <p><strong>编码:</strong> UTF-8</p>
        </div>
      </div>
    </div>
  `
}

/**
 * 生成统计信息HTML
 */
function generateStatsHTML(stats: DiffStats): string {
  return `
    <div class="stats">
      <h2>📊 差异统计</h2>
      <div class="stats-grid">
        <div class="stat-item stat-additions">
          <span class="stat-number">${stats.additions}</span>
          <span class="stat-label">新增</span>
        </div>
        <div class="stat-item stat-deletions">
          <span class="stat-number">${stats.deletions}</span>
          <span class="stat-label">删除</span>
        </div>
        <div class="stat-item stat-modifications">
          <span class="stat-number">${stats.modifications}</span>
          <span class="stat-label">修改</span>
        </div>
        <div class="stat-item stat-similarity">
          <span class="stat-number">${stats.similarity}%</span>
          <span class="stat-label">相似度</span>
        </div>
      </div>
    </div>
  `
}

/**
 * 生成图例HTML
 */
function generateLegendHTML(): string {
  return `
    <div class="diff-legend">
      <h3>🎨 颜色说明</h3>
      <div class="legend-items">
        <div class="legend-item">
          <div class="legend-color add"></div>
          <span>新增内容</span>
        </div>
        <div class="legend-item">
          <div class="legend-color delete"></div>
          <span>删除内容</span>
        </div>
        <div class="legend-item">
          <div class="legend-color modify"></div>
          <span>修改内容</span>
        </div>
        <div class="legend-item">
          <div class="legend-color equal"></div>
          <span>相同内容</span>
        </div>
      </div>
    </div>
  `
}

/**
 * 生成完整的HTML文档
 */
function generateHTMLDocument(
  data1: FileData,
  data2: FileData,
  diffResult: DiffResult,
  stats: DiffStats,
  options: ExportOptions,
  timestamp: string
): string {
  const metadataHTML = options.includeMetadata ? generateMetadataHTML(data1, data2, timestamp) : ''
  const statsHTML = options.includeStats ? generateStatsHTML(stats) : ''
  const legendHTML = generateLegendHTML()
  const diffHTML = generateDiffHTML(diffResult)

  const pageTitle = `差异对比报告 - ${data1.name || '文本1'} vs ${data2.name || '文本2'}`

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="generator" content="文本差异对比工具 - Text Diff Viewer">
    <meta name="description" content="文本差异对比报告 - 使用diff-match-patch算法生成的精确对比结果">
    <meta name="keywords" content="差异对比,文本比较,版本对比,diff,文本分析">
    <meta name="author" content="Text Diff Viewer">
    <title>${escapeHtml(pageTitle)}</title>
    <style>
${HTML_STYLES}
    </style>
</head>
<body>
    <div class="diff-export">
        <header>
            <h1>📄 文本差异对比报告</h1>
        </header>

        ${metadataHTML}

        ${statsHTML}

        <main>
            <div class="diff-content">
                <div class="diff-header">
                    <span>差异对比结果</span>
                    <span>生成时间: ${new Date(timestamp).toLocaleString('zh-CN')}</span>
                </div>
                <div class="diff-text">
                    ${diffHTML}
                </div>
            </div>
        </main>

        ${legendHTML}

        <footer>
            <p>此报告由 <strong>文本差异对比工具</strong> 生成</p>
            <p>使用 diff-match-patch 算法实现字符级精确差异检测</p>
            <p>生成时间: ${new Date(timestamp).toLocaleString('zh-CN')}</p>
        </footer>
    </div>
</body>
</html>`
}

/**
 * 导出HTML文件
 *
 * @param data1 - 对比项1的数据
 * @param data2 - 对比项2的数据
 * @param diffResult - 差异计算结果
 * @param stats - 差异统计信息
 * @param options - 导出选项
 * @param filename - 自定义文件名（可选）
 * @returns Promise<string> 返回生成的HTML内容
 */
export async function exportToHTML(
  data1: FileData,
  data2: FileData,
  diffResult: DiffResult,
  stats: DiffStats,
  options: Partial<ExportOptions> = {},
  filename?: string
): Promise<string> {
  try {
    // 合并默认导出选项
    const exportOptions: ExportOptions = { ...DEFAULT_EXPORT_OPTIONS, ...options }

    // 生成时间戳
    const timestamp = generateTimestamp()

    // 生成HTML文档
    const htmlContent = generateHTMLDocument(
      data1,
      data2,
      diffResult,
      stats,
      exportOptions,
      timestamp
    )

    return htmlContent
  } catch (error) {
    throw new Error(`HTML导出失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

/**
 * 下载HTML文件到本地
 *
 * @param data1 - 对比项1的数据
 * @param data2 - 对比项2的数据
 * @param diffResult - 差异计算结果
 * @param stats - 差异统计信息
 * @param options - 导出选项
 * @param customFilename - 自定义文件名（可选）
 */
export async function downloadHTMLFile(
  data1: FileData,
  data2: FileData,
  diffResult: DiffResult,
  stats: DiffStats,
  options: Partial<ExportOptions> = {},
  customFilename?: string
): Promise<void> {
  try {
    // 生成HTML内容
    const htmlContent = await exportToHTML(data1, data2, diffResult, stats, options, customFilename)

    // 生成文件名
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')
    const defaultFilename = `diff_report_${timestamp}.html`
    const filename = customFilename || defaultFilename

    // 创建Blob对象
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })

    // 创建下载链接
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename

    // 触发下载
    document.body.appendChild(link)
    link.click()

    // 清理资源
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

  } catch (error) {
    throw new Error(`HTML文件下载失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

/**
 * 生成标准化的文件名
 *
 * @param data1 - 对比项1的数据
 * @param data2 - 对比项2的数据
 * @param extension - 文件扩展名
 * @returns 标准化的文件名
 */
export function generateFilename(data1: FileData, data2: FileData, extension: string = 'html'): string {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')

  const name1 = (data1.name || 'text1').replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_').slice(0, 20)
  const name2 = (data2.name || 'text2').replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_').slice(0, 20)

  return `diff_${name1}_vs_${name2}_${timestamp}.${extension}`
}

// 默认导出
export default {
  exportToHTML,
  downloadHTMLFile,
  generateFilename,
  DEFAULT_EXPORT_OPTIONS
}