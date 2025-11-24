<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { DiffResult } from '@/types/diff'
import { calculateDiffStats } from '@/utils/diffAlgorithm'

interface Props {
  diffResult: DiffResult
  showDetails?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showDetails: false
})

// 响应式数据
const showWhitespace = ref(false)
const viewMode = ref<'diff' | 'original'>('diff') // 'diff': 差异视图, 'original': 原始对比视图

// 计算属性
const stats = computed(() => calculateDiffStats(props.diffResult))

const sortedDiffs = computed(() => {
  return [...props.diffResult.diffs].sort((a, b) => a.position - b.position)
})

const originalCharCount = computed(() => props.diffResult.text1.length)
const modifiedCharCount = computed(() => props.diffResult.text2.length)

// 统一文本分段处理
const unifiedSegments = computed(() => {
  return createUnifiedSegments(props.diffResult)
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
 * 创建统一差异片段
 * 简化版本，基于排序后的差异记录处理
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

    // 处理差异
    if (diff.type === 'delete') {
      segments.push({ content: diff.content, type: 'deleted' })
      currentIndex = diff.position + diff.content.length
    } else if (diff.type === 'add') {
      segments.push({ content: diff.content, type: 'added' })
      // 新增不改变位置索引，保持在当前位置
    } else if (diff.type === 'modify') {
      // 对于修改操作，可以选择两种处理方式：
      // 方式1：显示为单个修改项（蓝色背景）
      // 方式2：分解为删除+新增（当前使用的方式）
      // 这里使用方式2，但保留了modify类型的样式支持
      if (diff.originalContent) {
        segments.push({ content: diff.originalContent, type: 'deleted' })
        currentIndex = diff.position + diff.originalContent.length
      }
      segments.push({ content: diff.content, type: 'added' })

      // 将来如果要使用方式1（单个修改项），可以改为：
      // segments.push({ content: diff.content, type: 'modified' })
      // currentIndex = diff.position + (diff.originalContent?.length || 0)
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

</script>

<template>
  <div class="diff-viewer">
    <!-- 显示选项 -->
    <div class="mb-4 flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <span class="text-sm text-gray-600">显示模式:</span>
        <el-radio-group v-model="viewMode" size="small">
          <el-radio-button label="diff">差异视图</el-radio-button>
          <el-radio-button label="original">原始对比</el-radio-button>
        </el-radio-group>
      </div>

      <div class="flex items-center space-x-2">
        <el-checkbox v-model="showWhitespace" size="small">
          显示空白字符
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

    <!-- 差异视图 -->
    <div v-if="viewMode === 'diff'" class="unified-diff border rounded-lg overflow-hidden">
      <div class="bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 border-b">
        文档差异对比 (原文本 {{ originalCharCount }} 字符 → 修改后 {{ modifiedCharCount }} 字符)
      </div>
      <div class="p-4 font-mono text-sm leading-relaxed max-h-96 overflow-y-auto whitespace-pre-wrap">
        <span
          v-for="(segment, index) in unifiedSegments"
          :key="index"
          :class="getSegmentClass(segment.type)"
        >
          <span v-if="showWhitespace" class="whitespace-debug">
            {{ displayWhitespace(segment.content) }}
          </span>
          <span v-else>{{ segment.content }}</span>
        </span>
      </div>
    </div>

    <!-- 原始文本对比视图 -->
    <div v-else class="original-comparison">
      <div class="grid grid-cols-2 gap-4">
        <!-- 原文本 -->
        <div class="border rounded-lg overflow-hidden">
          <div class="bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 border-b">
            原文本 ({{ originalCharCount }} 字符)
          </div>
          <div class="p-4 font-mono text-sm leading-relaxed max-h-96 overflow-y-auto whitespace-pre-wrap">
            <span v-if="showWhitespace">
              {{ displayWhitespace(diffResult.text1) }}
            </span>
            <span v-else>{{ diffResult.text1 }}</span>
          </div>
        </div>

        <!-- 修改后文本 -->
        <div class="border rounded-lg overflow-hidden">
          <div class="bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 border-b">
            修改后文本 ({{ modifiedCharCount }} 字符)
          </div>
          <div class="p-4 font-mono text-sm leading-relaxed max-h-96 overflow-y-auto whitespace-pre-wrap">
            <span v-if="showWhitespace">
              {{ displayWhitespace(diffResult.text2) }}
            </span>
            <span v-else>{{ diffResult.text2 }}</span>
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