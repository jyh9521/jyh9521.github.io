// Current state is separate from dated milestones and patch-release notes.
export const gameStatuses = ['想玩', '正在玩', '已通关', '暂时搁置', 'AFK', '考虑制作补丁', '已制作补丁'] as const;
export type GameStatus = typeof gameStatuses[number];

export function normalizeGameStatus(value: unknown): GameStatus {
  const text = String(value ?? '').trim();
  if (gameStatuses.includes(text as GameStatus)) return text as GameStatus;
  // Compatibility for older free-text entries; milestones stay in events.
  const parts = text.split(/[、,，;；]/).map(part => part.trim());
  for (const part of parts) {
    if (gameStatuses.includes(part as GameStatus)) return part as GameStatus;
    if (part === '已弃坑' || part === '已弃玩' || part.toUpperCase() === 'AFK') return 'AFK';
    if (part === '搁置' || part === '暂停游玩') return '暂时搁置';
  }
  return '想玩';
}
