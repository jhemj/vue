import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'

export default {
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 3000 // 개발 서버 포트를 5432로 설정
  },
  build: {
    outDir: '../backend/src/main/resources/static' // Spring Boot 정적 리소스 디렉토리로 설정
  }
}
