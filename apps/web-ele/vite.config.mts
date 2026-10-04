import { defineConfig } from '@vben/vite-config';

import ElementPlus from 'unplugin-element-plus/vite';

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      plugins: [
        ElementPlus({
          format: 'esm',
        }),
      ],
      server: {
        proxy: {
          '/api': {
            changeOrigin: true,
            // 开发环境后端服务地址，后端API前缀为 http://localhost:19897/api，无需重写路径
            target: 'http://localhost:19897',
            ws: true,
          },
        },
      },
    },
  };
});
