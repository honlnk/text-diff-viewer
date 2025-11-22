<template>
  <div class="space-y-6">
    <div class="text-center">
      <h2 class="text-2xl font-bold text-gray-900 mb-2">
        文本差异对比工具
      </h2>
      <p class="text-gray-600">
        支持文件上传和文本输入，精确到字符级别的差异对比
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 对比项 1 -->
      <div class="card-base">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium text-gray-900">对比项 1</h3>
          <div class="flex space-x-2">
            <el-button
              size="small"
              :type="data1.type === 'file' ? 'primary' : 'default'"
              @click="switchInputType(1, 'file')"
            >
              文件上传
            </el-button>
            <el-button
              size="small"
              :type="data1.type === 'text' ? 'primary' : 'default'"
              @click="switchInputType(1, 'text')"
            >
              文本输入
            </el-button>
          </div>
        </div>

        <!-- 文件上传区域 -->
        <div v-if="data1.type === 'file'" class="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <el-upload
            class="w-full"
            drag
            :auto-upload="false"
            :show-file-list="false"
            accept=".txt,.md,.csv"
            :on-change="(file: UploadFile) => handleFileChange(file, 1)"
          >
            <div class="text-center">
              <el-icon class="text-4xl text-gray-400 mb-2">
                <UploadFilled />
              </el-icon>
              <div class="text-gray-600">
                <p>点击上传或拖拽文件到此处</p>
              </div>
              <div class="text-xs text-gray-500 mt-2">
                支持 .txt、.md、.csv 格式，最大 10MB
              </div>
            </div>
          </el-upload>
          <div v-if="data1.name" class="mt-3 text-sm text-gray-600">
            已选择: {{ data1.name }}
          </div>
        </div>

        <!-- 文本输入区域 -->
        <div v-else>
          <el-input
            v-model="data1.content"
            type="textarea"
            :rows="12"
            placeholder="请输入要对比的文本内容..."
            resize="vertical"
          />
        </div>
      </div>

      <!-- 对比项 2 -->
      <div class="card-base">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium text-gray-900">对比项 2</h3>
          <div class="flex space-x-2">
            <el-button
              size="small"
              :type="data2.type === 'file' ? 'primary' : 'default'"
              @click="switchInputType(2, 'file')"
            >
              文件上传
            </el-button>
            <el-button
              size="small"
              :type="data2.type === 'text' ? 'primary' : 'default'"
              @click="switchInputType(2, 'text')"
            >
              文本输入
            </el-button>
          </div>
        </div>

        <!-- 文件上传区域 -->
        <div v-if="data2.type === 'file'" class="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <el-upload
            class="w-full"
            drag
            :auto-upload="false"
            :show-file-list="false"
            accept=".txt,.md,.csv"
            :on-change="(file: UploadFile) => handleFileChange(file, 2)"
          >
            <div class="text-center">
              <el-icon class="text-4xl text-gray-400 mb-2">
                <UploadFilled />
              </el-icon>
              <div class="text-gray-600">
                <p>点击上传或拖拽文件到此处</p>
              </div>
              <div class="text-xs text-gray-500 mt-2">
                支持 .txt、.md、.csv 格式，最大 10MB
              </div>
            </div>
          </el-upload>
          <div v-if="data2.name" class="mt-3 text-sm text-gray-600">
            已选择: {{ data2.name }}
          </div>
        </div>

        <!-- 文本输入区域 -->
        <div v-else>
          <el-input
            v-model="data2.content"
            type="textarea"
            :rows="12"
            placeholder="请输入要对比的文本内容..."
            resize="vertical"
          />
        </div>
      </div>
    </div>

    <!-- 对比按钮 -->
    <div class="text-center">
      <el-button
        type="primary"
        size="large"
        :disabled="!canCompare"
        :loading="isComparing"
        @click="handleCompare"
      >
        <span class="mr-2">🔍</span>
        {{ isComparing ? '计算中...' : '开始对比' }}
      </el-button>
    </div>

    <!-- 错误提示 -->
    <el-alert
      v-if="errorMessage"
      :title="errorMessage"
      type="error"
      :closable="true"
      @close="errorMessage = ''"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import type { UploadFile } from 'element-plus'
import type { FileData } from '@/types/diff'
import { useDiffStore } from '@/stores/diff'

const router = useRouter()
const diffStore = useDiffStore()

// 数据状态
const data1 = ref<FileData>({ content: '', type: 'text' })
const data2 = ref<FileData>({ content: '', type: 'text' })
const isComparing = ref(false)
const errorMessage = ref('')

// 是否可以对比
const canCompare = computed(() => {
  return data1.value.content.trim() && data2.value.content.trim()
})

// 切换输入类型
const switchInputType = (dataNum: 1 | 2, type: 'file' | 'text') => {
  if (dataNum === 1) {
    data1.value = { content: '', type }
  } else {
    data2.value = { content: '', type }
  }
}

// 处理文件变化
const handleFileChange = (file: UploadFile, dataNum: 1 | 2) => {
  const validExtensions = ['.txt', '.md', '.csv']

  // 检查文件类型
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
  if (!validExtensions.includes(fileExtension)) {
    ElMessage.error('仅支持 .txt、.md、.csv 格式的文件')
    return
  }

  // 检查文件大小和原始文件是否存在
  if (!file.raw || !file.size || file.size > 10 * 1024 * 1024) {
    ElMessage.error(file.size && file.size > 10 * 1024 * 1024 ? '文件大小不能超过 10MB' : '文件无效，请重新选择文件')
    return
  }

  // 读取文件内容
  const reader = new FileReader()
  reader.onload = (e) => {
    const content = e.target?.result as string
    if (dataNum === 1) {
      data1.value = {
        name: file.name,
        content,
        type: 'file',
        size: file.size
      }
    } else {
      data2.value = {
        name: file.name,
        content,
        type: 'file',
        size: file.size
      }
    }
  }
  reader.onerror = () => {
    ElMessage.error('文件读取失败，请重新选择文件')
  }
  reader.readAsText(file.raw)
}

// 处理对比
const handleCompare = async () => {
  if (!canCompare.value) {
    ElMessage.warning('请提供两个对比数据')
    return
  }

  // 检查内容是否相同
  if (data1.value.content === data2.value.content) {
    ElMessage.info('两个文件内容完全相同，无需对比')
    return
  }

  try {
    isComparing.value = true
    errorMessage.value = ''

    // 使用Pinia store存储数据
    diffStore.setData(data1.value, data2.value)

    // 跳转到结果页面
    await router.push('/result')

  } catch (error) {
    console.error('对比过程出错:', error)
    errorMessage.value = '对比过程出错，请稍后重试'
  } finally {
    isComparing.value = false
  }
}
</script>