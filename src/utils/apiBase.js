/*
 * 接口基础地址
 * - 本地开发：API_BASE 为空，请求走 Vite 的 /api 代理到本地引擎
 * - 生产部署：构建时设置 VITE_API_BASE 为增强引擎的公网地址（如 Render 提供的 URL）
 */
export const API_BASE = import.meta.env.VITE_API_BASE || "";

/* 拼接完整接口地址，用法：apiUrl("/api/smart-advice") */
export const apiUrl = (path) => `${API_BASE}${path}`;
