import { XP_PER_LEVEL, BEAST_EVOLUTIONS } from '../constants/messages'

export function calculateLevel(totalXP: number): number {
  let level = 1
  let xpNeeded = 0
  while (xpNeeded + XP_PER_LEVEL(level) <= totalXP) {
    xpNeeded += XP_PER_LEVEL(level)
    level++
  }
  return level
}

export function getXPProgress(totalXP: number): { current: number; needed: number; percentage: number } {
  const level = calculateLevel(totalXP)
  let xpSpent = 0
  for (let i = 1; i < level; i++) {
    xpSpent += XP_PER_LEVEL(i)
  }
  const currentLevelXP = totalXP - xpSpent
  const needed = XP_PER_LEVEL(level)
  return {
    current: currentLevelXP,
    needed,
    percentage: Math.min((currentLevelXP / needed) * 100, 100),
  }
}

export function getBeastEvolution(level: number): string {
  const evolutions = Object.entries(BEAST_EVOLUTIONS)
    .sort(([, a], [, b]) => b.minLevel - a.minLevel)
  for (const [key, val] of evolutions) {
    if (level >= val.minLevel) return key
  }
  return 'baby'
}
