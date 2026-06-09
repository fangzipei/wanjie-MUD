import { GameProvider } from '@/views/game/useGameState';

import type { Metadata } from 'next';

import './globals.css';


export const metadata: Metadata = {
  title: {
    default: '万界修行录 | 文字修仙游戏',
    template: '%s | 万界修行录',
  },
  description:
    '万界修行录 - 一款简约的文字修仙游戏。选择你的角色，降临不同世界，开启修行之旅。',
  keywords: ['文字游戏', '修仙游戏', 'RPG', '万界修行录', '文字冒险'],
  openGraph: {
    title: '万界修行录 | 文字修仙游戏',
    description: '选择你的化身，降临万界宇宙，开启属于你的修行传说。',
    siteName: '万界修行录',
    locale: 'zh_CN',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <GameProvider>{children}</GameProvider>
      </body>
    </html>
  );
}
