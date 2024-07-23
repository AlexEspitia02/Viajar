/* eslint-disable prettier/prettier */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.js'], // 確保包含 tests 資料夾中的測試文件
  },
});
