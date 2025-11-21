import { createRouter, createWebHistory } from 'vue-router'
import InputView from '@/views/InputView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'input',
      component: InputView,
    },
    {
      path: '/result',
      name: 'result',
      // 动态导入，懒加载
      component: () => import('@/views/ResultView.vue'),
    },
  ],
})

export default router