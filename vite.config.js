import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const BROTHER_ENGINE_ROOT = path.resolve(__dirname, '..', '中医学习问题理解与增强引擎---学医智用')
const ENGINE_PORT_FILE = path.join(BROTHER_ENGINE_ROOT, '.engine-port.json')

function resolveEnginePort(fallback = 3000) {
  try {
    if (fs.existsSync(ENGINE_PORT_FILE)) {
      const raw = JSON.parse(fs.readFileSync(ENGINE_PORT_FILE, 'utf8'))
      const p = Number(raw?.port)
      if (Number.isFinite(p) && p > 0 && p < 65536) return p
    }
  } catch {
    /* 文件不存在、格式坏了、没权限读 → fallback 默认 3000 */
  }
  return fallback
}

const ENGINE_PORT = resolveEnginePort(Number(process.env.VITE_ENGINE_PORT) || 3000)
console.log(`[xueyi-webapp] 增强引擎代理目标： http://localhost:${ENGINE_PORT}  （来源：${fs.existsSync(ENGINE_PORT_FILE) ? '.engine-port.json' : '默认 3000 / VITE_ENGINE_PORT'}）`)

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // 本地开发用根路径；构建 GitHub Pages 时用仓库子路径，保证子路由刷新也能加载资源
  base: command === 'build' ? '/xueyi-webapp/' : '/',
  plugins: [vue()],
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      // 转发到兄弟独立引擎 Express 服务（默认端口 3000，若被占用 engine 会自动下找下一个空闲并写入 .engine-port.json）
      // 路由前缀 /api/* 完全匹配兄弟引擎 server.ts 的 /api/health 和 /api/enhance-and-answer，无需 rewrite
      '/api': {
        target: `http://localhost:${ENGINE_PORT}`,
        changeOrigin: true,
        // 引擎服务不可用时 Vite 代理会报错（502），我们在 promptEngine.callEnhanceServer 里 catch 住自动降级本地复刻
      },
    },
  },
}))
