import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  // 静态导出模式，用于 GitHub Pages 部署
  output: 'export',

  // 尾部斜杠，兼容 GitHub Pages 路由
  trailingSlash: true,

  // 指定工作区根目录，避免多 lockfile 警告
  turbopack: {
    root: __dirname,
  },

  // GitHub Pages 仓库路径前缀（仅生产环境）
  basePath: isDev ? '' : '/wanjie-MUD',

  // 静态导出不支持默认图片优化，使用自定义 loader
  images: {
    loader: 'custom',
    loaderFile: '',
    unoptimized: true,
  },
};

export default nextConfig;
