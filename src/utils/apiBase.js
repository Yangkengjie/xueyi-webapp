/*
 * 接口基础地址
 * - 本地开发：直连本地增强引擎 http://localhost:3001（绕过 Vite 代理；
 *   代理在 Windows 回环上会缓冲/丢弃 Kimi 的 SSE 碎块，导致规划只有 done 没有正文）
 * - 生产部署：构建时设置 VITE_API_BASE 为增强引擎的公网地址（如 Render 提供的 URL），
 *   未设置时用相对路径（同源部署）
 */
const DEV_ENGINE_URL = "http://localhost:3001";
export const API_BASE = import.meta.env.VITE_API_BASE
  || (import.meta.env.DEV ? DEV_ENGINE_URL : "");

/* 拼接完整接口地址，用法：apiUrl("/api/smart-advice") */
export const apiUrl = (path) => `${API_BASE}${path}`;
