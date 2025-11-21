<template>
  <div class="diff-viewer">
    <!-- 差异显示模式切换 -->
    <div class="mb-4 flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <span class="text-sm text-gray-600">显示模式:</span>
        <el-radio-group v-model="displayMode" size="small">
          <el-radio-button label="inline">并排对比</el-radio-button>
          <el-radio-button label="unified">统一视图</el-radio-button>
        </el-radio-group>
      </div>

      <div class="flex items-center space-x-2">
        <el-checkbox v-model="showWhitespace" size="small">
          显示空白字符
        </el-checkbox>
        <el-checkbox v-model="showLineNumbers" size="small">
          显示行号
        </el-checkbox>
      </div>
    </div>

    <!-- 统计信息摘要 -->
    <div class="mb-4 p-3 bg-gray-50 rounded-lg">
      <div class="flex items-center justify-between text-sm">
        <div class="flex items-center space-x-4">
          <span class="flex items-center">
            <span class="w-3 h-3 bg-red-500 rounded mr-1"></span>
            删除 {{ stats.deletions }} 处
          </span>
          <span class="flex items-center">
            <span class="w-3 h-3 bg-green-500 rounded mr-1"></span>
            新增 {{ stats.additions }} 处
          </span>
          <span class="flex items-center">
            <span class="w-3 h-3 bg-blue-500 rounded mr-1"></span>
            修改 {{ stats.modifications }} 处
          </span>
        </div>
        <span class="text-gray-600">
          编辑距离: {{ diffResult.editDistance }} | 相似度: {{ diffResult.similarity }}%
        </span>
      </div>
    </div>

    <!-- 并排对比模式 -->
    <div v-if="displayMode === 'inline'" class="inline-diff">
      <div class="grid grid-cols-2 gap-4">
        <!-- 原文本 -->
        <div class="original-text border rounded-lg overflow-hidden">
          <div class="bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 border-b">
            原文本 ({{ originalCharCount }} 字符)
          </div>
          <div class="p-4 font-mono text-sm leading-relaxed max-h-96 overflow-y-auto">
            <div
              v-for="(segment, index) in originalSegments"
              :key="index"
              :class="getSegmentClass(segment.type)"
              class="inline"
            >
              <span v-if="showWhitespace" class="whitespace-debug">
                {{ displayWhitespace(segment.content) }}
              </span>
              <span v-else>{{ segment.content }}</span>
            </div>
          </div>
        </div>

        <!-- 修改后文本 -->
        <div class="modified-text border rounded-lg overflow-hidden">
          <div class="bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 border-b">
            修改后文本 ({{ modifiedCharCount }} 字符)
          </div>
          <div class="p-4 font-mono text-sm leading-relaxed max-h-96 overflow-y-auto">
            <div
              v-for="(segment, index) in modifiedSegments"
              :key="index"
              :class="getSegmentClass(segment.type)"
              class="inline"
            >
              <span v-if="showWhitespace" class="whitespace-debug">
                {{ displayWhitespace(segment.content) }}
              </span>
              <span v-else>{{ segment.content }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 统一视图模式 -->
    <div v-else class="unified-diff border rounded-lg overflow-hidden">
      <div class="bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 border-b">
        统一差异视图
      </div>
      <div class="max-h-96 overflow-y-auto">
        <div
          v-for="(line, index) in unifiedLines"
          :key="index"
          class="flex border-b border-gray-100"
          :class="getLineClass(line.type)"
        >
          <!-- 行号 -->
          <div v-if="showLineNumbers" class="line-numbers flex-none px-3 py-2 text-xs text-gray-500 border-r">
            <span class="block w-12 text-right">{{ line.originalLine !== undefined ? line.originalLine + 1 : '' }}</span>
            <span class="block w-12 text-right">{{ line.modifiedLine !== undefined ? line.modifiedLine + 1 : '' }}</span>
          </div>

          <!-- 内容 -->
          <div class="flex-1 px-4 py-2 font-mono text-sm">
            <span
              v-for="(segment, segIndex) in line.segments"
              :key="segIndex"
              :class="getSegmentClass(segment.type)"
              class="inline"
            >
              <span v-if="showWhitespace" class="whitespace-debug">
                {{ displayWhitespace(segment.content) }}
              </span>
              <span v-else>{{ segment.content }}</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 差异详细信息 -->
    <div v-if="showDetails" class="mt-4">
      <el-collapse>
        <el-collapse-item title="差异详细信息" name="details">
          <div class="text-sm space-y-2">
            <div v-for="(diff, index) in sortedDiffs" :key="index" class="p-2 border rounded">
              <div class="flex items-center justify-between mb-1">
                <span class="font-medium">{{ getDiffTypeLabel(diff.type) }}</span>
                <span class="text-gray-500">位置: {{ diff.position }}</span>
              </div>
              <div class="bg-gray-50 p-2 rounded font-mono text-xs">
                <div v-if="diff.type === 'delete'" class="text-red-600">
                  删除: {{ JSON.stringify(diff.content) }}
                </div>
                <div v-else-if="diff.type === 'add'" class="text-green-600">
                  新增: {{ JSON.stringify(diff.content) }}
                </div>
                <div v-else-if="diff.type === 'modify'" class="text-blue-600">
                  修改: {{ JSON.stringify(diff.originalContent) }} → {{ JSON.stringify(diff.content) }}
                </div>
              </div>
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { DiffResult, DiffRecord } from '@/types/diff'
import { calculateDiffStats } from '@/utils/diffAlgorithm'

interface Props {
  diffResult: DiffResult
  showDetails?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showDetails: false
})

// 响应式数据
const displayMode = ref<'inline' | 'unified'>('inline')
const showWhitespace = ref(false)
const showLineNumbers = ref(true)

// 计算属性
const stats = computed(() => calculateDiffStats(props.diffResult))

const sortedDiffs = computed(() => {
  return [...props.diffResult.diffs].sort((a, b) => a.position - b.position)
})

const originalCharCount = computed(() => props.diffResult.text1.length)
const modifiedCharCount = computed(() => props.diffResult.text2.length)

// 文本分段处理
const originalSegments = computed(() => {
  return processTextWithDiffs(props.diffResult.text1, props.diffResult.diffs, 'original')
})

const modifiedSegments = computed(() => {
  return processTextWithDiffs(props.diffResult.text2, props.diffResult.diffs, 'modified')
})

// 统一视图行处理
const unifiedLines = computed(() => {
  return createUnifiedView(props.diffResult.text1, props.diffResult.text2, props.diffResult.diffs)
})

// 方法
function getSegmentClass(type: string) {
  switch (type) {
    case 'deleted':
      return 'bg-red-100 text-red-900 line-through'
    case 'added':
      return 'bg-green-100 text-green-900'
    case 'modified':
      return 'bg-blue-100 text-blue-900'
    default:
      return ''
  }
}

function getLineClass(type: string) {
  switch (type) {
    case 'deleted':
      return 'bg-red-50'
    case 'added':
      return 'bg-green-50'
    default:
      return ''
  }
}

function displayWhitespace(text: string) {
  return text
    .replace(/ /g, '·')
    .replace(/\t/g, '→')
    .replace(/\n/g, '↵\n')
}

function getDiffTypeLabel(type: string) {
  switch (type) {
    case 'add':
      return '新增'
    case 'delete':
      return '删除'
    case 'modify':
      return '修改'
    default:
      return '未知'
  }
}

/**
 * 处理文本并标记差异
 */
function processTextWithDiffs(
  text: string,
  diffs: DiffRecord[],
  mode: 'original' | 'modified'
): Array<{ content: string; type: string }> {
  const segments: Array<{ content: string; type: string }> = []
  let currentIndex = 0

  // 按位置排序的差异记录
  const sortedDiffs = [...diffs].sort((a, b) => a.position - b.position)

  for (const diff of sortedDiffs) {
    // 添加差异前的正常文本
    if (diff.position > currentIndex) {
      const normalText = text.slice(currentIndex, diff.position)
      if (normalText) {
        segments.push({ content: normalText, type: 'normal' })
      }
    }

    // 根据模式处理差异
    if (mode === 'original' && diff.type === 'delete') {
      segments.push({ content: diff.content, type: 'deleted' })
    } else if (mode === 'modified' && diff.type === 'add') {
      segments.push({ content: diff.content, type: 'added' })
    } else if (diff.type === 'modify') {
      if (mode === 'original') {
        segments.push({
          content: diff.originalContent || '',
          type: 'modified'
        })
      } else {
        segments.push({
          content: diff.content,
          type: 'modified'
        })
      }
    }

    currentIndex = diff.position + (mode === 'original' ?
      (diff.type === 'delete' ? diff.content.length : 0) :
      (diff.type === 'add' ? diff.content.length : 0))
  }

  // 添加剩余的正常文本
  if (currentIndex < text.length) {
    const remainingText = text.slice(currentIndex)
    if (remainingText) {
      segments.push({ content: remainingText, type: 'normal' })
    }
  }

  return segments
}

/**
 * 创建统一视图
 */
function createUnifiedView(
  text1: string,
  text2: string,
  diffs: DiffRecord[]
): Array<{
  type: string
  originalLine?: number
  modifiedLine?: number
  segments: Array<{ content: string; type: string }>
}> {
  // 这是一个简化实现，实际需要更复杂的逻辑
  const lines = []

  // 按换行符分割文本
  const text1Lines = text1.split('\n')
  const text2Lines = text2.split('\n')

  // 简单的行级对比
  const maxLines = Math.max(text1Lines.length, text2Lines.length)
  for (let i = 0; i < maxLines; i++) {
    const line1 = text1Lines[i] || ''
    const line2 = text2Lines[i] || ''

    if (line1 === line2) {
      lines.push({
        type: 'normal',
        originalLine: i,
        modifiedLine: i,
        segments: [{ content: line1, type: 'normal' }]
      })
    } else {
      // 有差异的行
      if (line1) {
        lines.push({
          type: 'deleted',
          originalLine: i,
          segments: [{ content: line1, type: 'deleted' }]
        })
      }
      if (line2) {
        lines.push({
          type: 'added',
          modifiedLine: i,
          segments: [{ content: line2, type: 'added' }]
        })
      }
    }
  }

  return lines
}
</script>

<style scoped>
.diff-viewer {
  @apply space-y-4;
}

.whitespace-debug {
  @apply font-mono text-xs opacity-70;
}

.line-numbers {
  @apply bg-gray-50;
}

.inline-diff, .unified-diff {
  @apply font-mono;
}
</style>