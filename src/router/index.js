import { createRouter, createWebHistory } from 'vue-router'
import RoiCalculator from '@/components/RoiCalculator.vue';
import ChartView from '@/components/ChartView.vue';

const routes = [
  { path: '/roi-calculator', component: RoiCalculator },
  { path: '/chart', component: ChartView },
  { path: '/', redirect: '/roi-calculator' } // 기본적으로 ROI 계산기 탭으로 리다이렉트
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
