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
      <h3 class="text-lg font-medium text-gray-900 mb-4">差异结果</h3>

      <!-- 加载状态 -->
      <div v-if="loading" class="text-center py-8">
        <el-icon class="is-loading text-4xl text-blue-500">
          <Loading />
        </el-icon>
        <p class="mt-2 text-gray-600">正在计算差异...</p>
      </div>

      <!-- 差异展示 -->
      <div v-else-if="diffResult" class="space-y-4">
        <div class="text-sm text-gray-600 mb-4">
          编辑距离: {{ diffResult.editDistance }} | 相似度: {{ diffResult.similarity }}%
        </div>

        <!-- 差异可视化 -->
        <div class="border rounded-lg p-4 bg-gray-50">
          <div class="text-sm leading-relaxed">
            <!-- 这里将实现具体的差异可视化逻辑 -->
            <div class="text-gray-600">差异可视化功能将在下一阶段实现</div>
          </div>
        </div>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="text-center py-8">
        <el-alert
          :title="error"
          type="error"
          :closable="false"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Download, Loading } from '@element-plus/icons-vue'
import type { FileData, DiffResult, DiffStats } from '@/types/diff'

const router = useRouter()

// 状态
const loading = ref(false)
const error = ref('')
const data1 = ref<FileData>()
const data2 = ref<FileData>()
const diffResult = ref<DiffResult>()
const diffStats = ref<DiffStats>()

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

// 计算差异（临时版本，下一阶段将实现真实的差异算法）
const calculateDiff = async () => {
  if (!data1.value?.content || !data2.value?.content) {
    error.value = '缺少对比数据'
    return
  }

  loading.value = true
  error.value = ''

  try {
    // 模拟计算延迟
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 临时数据，下一阶段将替换为真实算法
    diffResult.value = {
      editDistance: Math.floor(Math.random() * 100),
      diffs: [],
      similarity: Math.floor(Math.random() * 50) + 50,
      text1: data1.value.content,
      text2: data2.value.content
    }

    // 计算统计信息
    diffStats.value = {
      additions: Math.floor(Math.random() * 10),
      deletions: Math.floor(Math.random() * 10),
      modifications: Math.floor(Math.random() * 5),
      similarity: diffResult.value.similarity
    }

  } catch (err) {
    console.error('计算差异时出错:', err)
    error.value = '计算差异时出错，请稍后重试'
  } finally {
    loading.value = false
  }
}

// 组件挂载时获取数据并计算差异
onMounted(() => {
  // 从路由状态获取数据
  const state = history.state
  if (state?.data1 && state?.data2) {
    data1.value = state.data1
    data2.value = state.data2
    calculateDiff()
  } else {
    error.value = '未找到对比数据，请重新输入'
  }
})
</script>