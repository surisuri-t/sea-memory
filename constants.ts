
import { OceanCreature, LevelConfig } from './types';

export const OCEAN_CREATURES: OceanCreature[] = [
  { id: 'red_fish', name: '빨간 물고기', type: 'fish', colorClass: 'bg-red-500', hex: '#ef4444' },
  { id: 'blue_fish', name: '파란 물고기', type: 'fish', colorClass: 'bg-blue-500', hex: '#3b82f6' },
  { id: 'yellow_fish', name: '노란 물고기', type: 'fish', colorClass: 'bg-yellow-400', hex: '#facc15' },
  { id: 'green_fish', name: '초록 물고기', type: 'fish', colorClass: 'bg-emerald-500', hex: '#10b981' },
  { id: 'purple_seahorse', name: '보라 해마', type: 'seahorse', colorClass: 'bg-purple-500', hex: '#a855f7' },
  { id: 'orange_starfish', name: '주황 불가사리', type: 'starfish', colorClass: 'bg-orange-500', hex: '#f97316' },
  { id: 'pink_shell', name: '분홍 조개', type: 'shell', colorClass: 'bg-pink-400', hex: '#f472b6' },
  { id: 'black_fish', name: '검정 물고기', type: 'fish', colorClass: 'bg-slate-950', hex: '#020617' },
];

export const LEVELS: LevelConfig[] = [
  { id: 1, label: '쉬움', fishCount: 3, displayDuration: 1300 },
  { id: 2, label: '보통', fishCount: 5, displayDuration: 1000 },
  { id: 3, label: '어려움', fishCount: 7, displayDuration: 700 },
];
