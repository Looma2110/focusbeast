export const TASK_SUGGESTIONS = [
  'Drink water',
  'Read 10 pages',
  'Stretch 5 min',
  'Reply to emails',
  'Clean desk',
  'Walk 10 min',
  'Write 1 page',
  'Meditate 5 min',
  'Review notes',
  'Cook a meal',
  'Do laundry',
  'Call a friend',
  'Plan tomorrow',
  'Organize files',
  'Take vitamins',
]

export const XP_PER_LEVEL = (level: number) => level * 50

export const BEAST_EVOLUTIONS: Record<string, { name: string; minLevel: number }> = {
  baby: { name: 'Seedling', minLevel: 1 },
  teen: { name: 'Spark', minLevel: 4 },
  adult: { name: 'Flux', minLevel: 7 },
  mega: { name: 'Apex', minLevel: 10 },
}
