import { defineStore } from 'pinia'
import type { FileData } from '@/types/diff'

interface DiffState {
  data1: FileData | null
  data2: FileData | null
}

export const useDiffStore = defineStore('diff', {
  state: (): DiffState => ({
    data1: null,
    data2: null
  }),

  actions: {
    setData(data1: FileData, data2: FileData) {
      this.data1 = data1
      this.data2 = data2
    },

    clearData() {
      this.data1 = null
      this.data2 = null
    },

    getData() {
      return {
        data1: this.data1,
        data2: this.data2
      }
    }
  }
})