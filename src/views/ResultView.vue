<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Download, Loading } from '@element-plus/icons-vue'
import DiffViewer from '@/components/DiffViewer.vue'
import type { FileData, DiffResult, DiffStats } from '@/types/diff'
import { calculateDiff as calculateTextDiff, calculateDiffStats } from '@/utils/diffAlgorithm'
import { validateTextContent } from '@/utils/textProcessor'
import { useDiffStore } from '@/stores/diff'

const router = useRouter()
const diffStore = useDiffStore()

// 状态
const loading = ref(false)
const error = ref('')
const data1 = ref<FileData>()
const data2 = ref<FileData>()
const diffResult = ref<DiffResult>()
const diffStats = ref<DiffStats>()
const showDetails = ref(false)

// 格式化文本长度
const formatTextLength = (text: string): string => {
  const length = text.length
  if (length < 1000) {
    return `${length} 字符`
  } else if (length < 1000000) {
    return `${(length / 1000).toFixed(1)} K 字符`
  } else {
    return `${(length / 1000000).toFixed(1)} M 字符`
  }
}

// 返回输入页面
const goBack = () => {
  router.push('/')
}

// 导出HTML
const exportHTML = () => {
  ElMessage.info('HTML导出功能将在下一阶段实现')
}

// 计算差异（使用真实的diff算法）
const calculateDiff = async () => {
  if (!data1.value?.content || !data2.value?.content) {
    error.value = '缺少对比数据'
    return
  }

  loading.value = true
  error.value = ''

  try {
    // 验证文本内容
    const validation1 = validateTextContent(data1.value.content)
    const validation2 = validateTextContent(data2.value.content)

    if (!validation1.isValid || !validation2.isValid) {
      const allErrors = [...validation1.errors, ...validation2.errors]
      error.value = `文本验证失败: ${allErrors.join(', ')}`
      return
    }

    // 显示警告信息
    const allWarnings = [...validation1.warnings, ...validation2.warnings]
    if (allWarnings.length > 0) {
      console.warn('文本警告:', allWarnings)
    }

    // 使用真实的差异算法
    const result = await calculateTextDiff(data1.value.content, data2.value.content, {
      timeout: 10000,
      precision: 'character',
      ignoreWhitespace: false,
      ignoreCase: false
    })

    diffResult.value = result

    // 计算统计信息
    diffStats.value = calculateDiffStats(result)

  } catch (err) {
    console.error('计算差异时出错:', err)
    error.value = err instanceof Error ? err.message : '计算差异时出错，请稍后重试'
  } finally {
    loading.value = false
  }
}

// 切换详情显示
const toggleDetails = () => {
  showDetails.value = !showDetails.value
}

// 重新计算差异
const recalculateDiff = () => {
  if (data1.value?.content && data2.value?.content) {
    calculateDiff()
  }
}

// 组件挂载时获取数据并计算差异
onMounted(() => {
  // 从Pinia store获取数据
  const storeData = diffStore.getData()

  if (storeData.data1 && storeData.data2) {
    data1.value = storeData.data1
    data2.value = storeData.data2
    calculateDiff()
  } else {
    error.value = '未找到对比数据，请重新输入'
  }
})
</script>

<template>
  <div class="space-y-6">
    <!-- 工具栏 -->
    <div class="flex justify-between items-center">
      <el-button @click="goBack">
        <el-icon class="mr-2">
          <ArrowLeft />
        </el-icon>
        返回
      </el-button>

      <div class="flex space-x-3">
        <el-button type="success" @click="exportHTML">
          <el-icon class="mr-2">
            <Download />
          </el-icon>
          导出HTML
        </el-button>
      </div>
    </div>

    <!-- 对比信息 -->
    <div class="card-base">
      <h3 class="text-lg font-medium text-gray-900 mb-4">对比信息</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 class="font-medium text-gray-700">对比项 1</h4>
          <p class="text-sm text-gray-600">
            {{ data1?.name || '文本输入' }} ({{ formatTextLength(data1?.content || '') }})
          </p>
        </div>
        <div>
          <h4 class="font-medium text-gray-700">对比项 2</h4>
          <p class="text-sm text-gray-600">
            {{ data2?.name || '文本输入' }} ({{ formatTextLength(data2?.content || '') }})
          </p>
        </div>
      </div>

      <!-- 差异统计 -->
      <div v-if="diffStats" class="mt-4 pt-4 border-t">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div class="bg-green-50 p-3 rounded">
            <div class="text-2xl font-bold text-green-600">{{ diffStats.additions }}</div>
            <div class="text-sm text-green-800">新增</div>
          </div>
          <div class="bg-red-50 p-3 rounded">
            <div class="text-2xl font-bold text-red-600">{{ diffStats.deletions }}</div>
            <div class="text-sm text-red-800">删除</div>
          </div>
          <div class="bg-blue-50 p-3 rounded">
            <div class="text-2xl font-bold text-blue-600">{{ diffStats.modifications }}</div>
            <div class="text-sm text-blue-800">修改</div>
          </div>
          <div class="bg-gray-50 p-3 rounded">
            <div class="text-2xl font-bold text-gray-600">{{ diffStats.similarity }}%</div>
            <div class="text-sm text-gray-800">相似度</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 差异结果 -->
    <div class="card-base">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-medium text-gray-900">差异结果</h3>

        <div class="flex items-center space-x-2">
          <el-button
            size="small"
            @click="toggleDetails"
            :type="showDetails ? 'primary' : 'default'"
          >
            {{ showDetails ? '隐藏详情' : '显示详情' }}
          </el-button>
          <el-button
            size="small"
            @click="recalculateDiff"
            :loading="loading"
          >
            重新计算
          </el-button>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="text-center py-8">
        <el-icon class="is-loading text-4xl text-blue-500">
          <Loading />
        </el-icon>
        <p class="mt-2 text-gray-600">正在计算差异...</p>
        <div class="mt-2 text-sm text-gray-500">
          使用字符级精确对比算法，请稍候...
        </div>
      </div>

      <!-- 差异展示 -->
      <DiffViewer
        v-else-if="diffResult"
        :diff-result="diffResult"
        :show-details="showDetails"
      />

      <!-- 错误状态 -->
      <div v-else-if="error" class="text-center py-8">
        <el-alert
          :title="error"
          type="error"
          :closable="false"
          show-icon
        />
        <div class="mt-4">
          <el-button @click="goBack" size="small">
            返回重新输入
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>