import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getToday, formatDate, parseLocalDate } from '../utils/date'
import { calculateLevel, getXPProgress, getBeastEvolution } from '../utils/points'
import { BeastType, BEAST_DEFS } from '../components/BeastCompanion'

export type TaskCategory = 'work' | 'sport' | 'craft' | 'study' | 'yoga'

export interface SubTask {
  id: string
  text: string
  completed: boolean
}

export interface Task {
  id: string
  text: string
  completed: boolean
  completedAt: string | null
  date: string
  hasEarnedPoints: boolean
  subtasks: SubTask[]
  category: TaskCategory
  locked: boolean
}

export interface DayLog {
  date: string
  tasksCompleted: number
  tasksAdded: number
  allCompleted: boolean
  points: number
}

export interface Settings {
  soundEnabled: boolean
  notificationsEnabled: boolean
  theme: 'light' | 'dark' | 'auto'
}

interface AppState {
  tasks: Task[]
  dayLogs: DayLog[]
  totalPoints: number
  totalXP: number
  currentStreak: number
  longestStreak: number
  lastActiveDate: string | null
  graceDaysUsed: number
  currentWeekStart: string
  beastMood: 'happy' | 'work' | 'celebrating' | 'sleeping' | 'anxious'
  premium: boolean
  freeFocusUsed: boolean
  onboardingCompleted: boolean
  settings: Settings
  confettiVisible: boolean
  lastLevelUp: number
  unlockedBeasts: BeastType[]
  activeBeast: BeastType
  newlyUnlockedBeast: BeastType | null
  beastNames: Record<string, string>

  addTask: (text: string, category?: TaskCategory) => void
  completeTask: (id: string) => void
  uncompleteTask: (id: string) => void
  updateTask: (id: string, text: string) => void
  splitTask: (id: string, subtasks: string[]) => void
  completeSubTask: (taskId: string, subtaskId: string) => void
  deleteTask: (id: string) => void
  useFreeFocus: () => boolean
  getBeastState: () => { level: number; xp: ReturnType<typeof getXPProgress>; evolution: string }
  getTodayTasks: () => Task[]
  getGraceDaysLeft: () => number
  refreshWeek: () => void
  checkStreak: () => void
  dismissConfetti: () => void
  completeOnboarding: () => void
  updateSettings: (s: Partial<Settings>) => void
  addFocusXP: (xp: number) => void
  setActiveBeast: (beast: BeastType) => void
  setBeastName: (beast: BeastType, name: string) => void
  dismissUnlock: () => void
}

const DEFAULT_SETTINGS: Settings = {
  soundEnabled: true,
  notificationsEnabled: false,
  theme: 'auto',
}

function checkBeastUnlocks(prevXP: number, newXP: number, current: BeastType[], isPremium: boolean): BeastType[] {
  const newlyUnlocked: BeastType[] = []
  for (const [key, def] of Object.entries(BEAST_DEFS)) {
    if (current.includes(key as BeastType)) continue
    if (def.premiumOnly && !isPremium) continue
    if (def.unlockXP > 0 && prevXP < def.unlockXP && newXP >= def.unlockXP) {
      newlyUnlocked.push(key as BeastType)
    }
  }
  return newlyUnlocked
}

let _lastActionAt = 0
function checkThrottle(minIntervalMs: number = 200): boolean {
  const now = Date.now()
  if (now - _lastActionAt < minIntervalMs) return false
  _lastActionAt = now
  return true
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      tasks: [],
      dayLogs: [],
      totalPoints: 0,
      totalXP: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      graceDaysUsed: 0,
      currentWeekStart: (() => {
        const now = new Date()
        const day = now.getDay()
        const diff = now.getDate() - day + (day === 0 ? -6 : 1)
        const monday = new Date(now.getFullYear(), now.getMonth(), diff)
        return formatDate(monday)
      })(),
      beastMood: 'happy' as const,
      premium: false,
      freeFocusUsed: false,
      onboardingCompleted: false,
      settings: DEFAULT_SETTINGS,
      confettiVisible: false,
      lastLevelUp: 1,
      unlockedBeasts: ['dog'] as BeastType[],
      activeBeast: 'dog' as BeastType,
      newlyUnlockedBeast: null as BeastType | null,
      beastNames: { dog: 'Dog', cat: 'Cat', monkey: 'Monkey', rabbit: 'Rabbit', fox: 'Fox', lion: 'Lion' } as Record<string, string>,

      addTask: (text: string, category: TaskCategory = 'work') => {
        const today = getToday()
        const todayTasks = get().tasks.filter(t => t.date === today)
        if (todayTasks.length >= 3) return

        const sanitized = text.replace(/[\x00-\x1F\x7F]/g, '').trim().slice(0, 50)
        if (!sanitized) return

        const newTask: Task = {
          id: Date.now().toString(36) + Math.random().toString(36).substring(2, 7),
          text: sanitized,
          completed: false,
          completedAt: null,
          date: today,
          hasEarnedPoints: false,
          subtasks: [],
          category,
          locked: false,
        }

        set((state) => {
          const updatedTasks = [...state.tasks, newTask]
          const todayT = updatedTasks.filter(t => t.date === today)
          return {
            tasks: updatedTasks,
            beastMood: 'work' as const,
            dayLogs: state.dayLogs.some(l => l.date === today)
              ? state.dayLogs.map(l => l.date === today ? { ...l, tasksAdded: todayT.length } : l)
              : [...state.dayLogs, { date: today, tasksCompleted: 0, tasksAdded: todayT.length, allCompleted: false, points: 0 }],
          }
        })
      },

      completeTask: (id: string) => {
        if (!checkThrottle()) return
        const state = get()
        const task = state.tasks.find(t => t.id === id)
        if (!task || task.completed) return

        const today = getToday()
        const todayTasks = state.tasks.filter(t => t.date === today)
        const completedCount = todayTasks.filter(t => t.completed).length
        const willBeAllCompleted = completedCount + 1 === todayTasks.length && todayTasks.length > 0

        const shouldEarnPoints = !task.hasEarnedPoints
        let pointsEarned = 0
        if (shouldEarnPoints) {
          pointsEarned = 10
        }

        const prevLevel = calculateLevel(state.totalXP)

        set((state) => {
          const updatedTasks = state.tasks.map(t =>
            t.id === id ? { ...t, completed: true, completedAt: new Date().toISOString(), hasEarnedPoints: true, locked: true } : t
          )
          const todayT = updatedTasks.filter(t => t.date === today)
          const newXP = state.totalXP + pointsEarned
          const newLevel = calculateLevel(newXP)
          const newStreak = state.lastActiveDate !== today
            ? state.currentStreak + 1
            : state.currentStreak
          const unlocked = checkBeastUnlocks(state.totalXP, newXP, state.unlockedBeasts, state.premium)

          return {
            tasks: updatedTasks,
            totalPoints: state.totalPoints + pointsEarned,
            totalXP: newXP,
            currentStreak: newStreak,
            longestStreak: Math.max(state.longestStreak, newStreak),
            lastActiveDate: today,
            beastMood: willBeAllCompleted ? 'celebrating' as const : 'work' as const,
            confettiVisible: willBeAllCompleted || (shouldEarnPoints && newLevel > prevLevel) || unlocked.length > 0,
            lastLevelUp: shouldEarnPoints && newLevel > prevLevel ? newLevel : state.lastLevelUp,
            unlockedBeasts: unlocked.length > 0 ? [...new Set([...state.unlockedBeasts, ...unlocked])] : state.unlockedBeasts,
            newlyUnlockedBeast: unlocked.length > 0 ? unlocked[unlocked.length - 1] : state.newlyUnlockedBeast,
            dayLogs: state.dayLogs.some(l => l.date === today)
              ? state.dayLogs.map(l => l.date === today ? {
                  ...l,
                  tasksCompleted: todayT.filter(t => t.completed).length,
                  tasksAdded: todayT.length,
                  allCompleted: willBeAllCompleted,
                  points: l.points + pointsEarned,
                } : l)
              : [...state.dayLogs, {
                  date: today,
                  tasksCompleted: todayT.filter(t => t.completed).length,
                  tasksAdded: todayT.length,
                  allCompleted: willBeAllCompleted,
                  points: pointsEarned,
                }],
          }
        })
      },

      deleteTask: (id: string) => {
        set((state) => ({ tasks: state.tasks.filter(t => t.id !== id) }))
      },

      uncompleteTask: (id: string) => {
        const state = get()
        const task = state.tasks.find(t => t.id === id)
        if (!task || !task.completed) return

        const today = getToday()

        set((state) => {
          const updatedTasks = state.tasks.map(t =>
            t.id === id ? { ...t, completed: false, completedAt: null, hasEarnedPoints: false, locked: false } : t
          )
          const todayT = updatedTasks.filter(t => t.date === today)
          const pointsLost = task.hasEarnedPoints ? 10 : 0
          const newXP = Math.max(0, state.totalXP - pointsLost)

          return {
            tasks: updatedTasks,
            totalPoints: Math.max(0, state.totalPoints - pointsLost),
            totalXP: newXP,
            beastMood: 'work' as const,
            dayLogs: state.dayLogs.some(l => l.date === today)
              ? state.dayLogs.map(l => l.date === today ? {
                  ...l,
                  tasksCompleted: todayT.filter(t => t.completed).length,
                  tasksAdded: todayT.length,
                  allCompleted: false,
                  points: Math.max(0, l.points - pointsLost),
                } : l)
              : state.dayLogs,
          }
        })
      },

      updateTask: (id: string, text: string) => {
        const sanitized = text.replace(/[\x00-\x1F\x7F]/g, '').trim().slice(0, 50)
        if (!sanitized) return
        set((state) => ({
          tasks: state.tasks.map(t =>
            t.id === id ? { ...t, text: sanitized } : t
          ),
        }))
      },

      splitTask: (id: string, subtaskTexts: string[]) => {
        const sanitized = subtaskTexts
          .map(s => s.replace(/[\x00-\x1F\x7F]/g, '').trim().slice(0, 50))
          .filter(s => s.length > 0)
        if (sanitized.length === 0) return
        set((state) => ({
          tasks: state.tasks.map(t =>
            t.id === id ? {
              ...t,
              subtasks: sanitized.map((s, i) => ({
                id: `${t.id}-sub-${i}`,
                text: s,
                completed: false,
              })),
            } : t
          ),
        }))
      },

      completeSubTask: (taskId: string, subtaskId: string) => {
        if (!checkThrottle()) return
        const state = get()
        const task = state.tasks.find(t => t.id === taskId)
        if (!task || task.completed) return

        const existingSub = task.subtasks.find(s => s.id === subtaskId)
        if (existingSub?.completed) return

        const today = getToday()
        const pointsPerSub = 5

        set((state) => {
          const updatedTasks = state.tasks.map(t => {
            if (t.id !== taskId) return t
            const updatedSubs = t.subtasks.map(s =>
              s.id === subtaskId ? { ...s, completed: true } : s
            )
            const allSubsDone = updatedSubs.length > 0 && updatedSubs.every(s => s.completed)
            return { ...t, subtasks: updatedSubs, completed: allSubsDone, hasEarnedPoints: allSubsDone ? true : t.hasEarnedPoints, locked: allSubsDone ? true : t.locked }
          })

          const updatedTask = updatedTasks.find(t => t.id === taskId)
          const prevLevel = calculateLevel(state.totalXP)
          const newXP = state.totalXP + pointsPerSub
          const newLevel = calculateLevel(newXP)

          const todayTasks = updatedTasks.filter(t => t.date === today)
          const completedCount = todayTasks.filter(t => t.completed).length
          const willBeAllCompleted = !!(completedCount === todayTasks.length && todayTasks.length > 0 && updatedTask?.completed)

          return {
            tasks: updatedTasks,
            totalPoints: state.totalPoints + pointsPerSub,
            totalXP: newXP,
            currentStreak: state.lastActiveDate !== today ? state.currentStreak + 1 : state.currentStreak,
            longestStreak: Math.max(state.longestStreak, state.lastActiveDate !== today ? state.currentStreak + 1 : state.currentStreak),
            lastActiveDate: today,
            beastMood: willBeAllCompleted ? 'celebrating' as const : 'work' as const,
            confettiVisible: willBeAllCompleted || newLevel > prevLevel,
            lastLevelUp: newLevel > prevLevel ? newLevel : state.lastLevelUp,
            dayLogs: state.dayLogs.some(l => l.date === today)
              ? state.dayLogs.map(l => l.date === today ? {
                  ...l,
                  tasksCompleted: todayTasks.filter(t => t.completed).length,
                  tasksAdded: todayTasks.length,
                  allCompleted: willBeAllCompleted,
                  points: l.points + pointsPerSub,
                } : l)
              : [...state.dayLogs, {
                  date: today,
                  tasksCompleted: todayTasks.filter(t => t.completed).length,
                  tasksAdded: todayTasks.length,
                  allCompleted: willBeAllCompleted,
                  points: pointsPerSub,
                }],
          }
        })
      },

      useFreeFocus: () => {
        if (get().freeFocusUsed) return false
        set({ freeFocusUsed: true })
        return true
      },

      getBeastState: () => {
        const state = get()
        const level = calculateLevel(state.totalXP)
        const xp = getXPProgress(state.totalXP)
        const evolution = getBeastEvolution(level)
        return { level, xp, evolution }
      },

      getTodayTasks: () => {
        return get().tasks.filter(t => t.date === getToday())
      },

      getGraceDaysLeft: () => {
        const state = get()
        const weekStart = state.currentWeekStart
        const now = new Date()
        const ws = parseLocalDate(weekStart)
        const daysSinceWeekStart = Math.floor((now.getTime() - ws.getTime()) / (1000 * 60 * 60 * 24))
        if (daysSinceWeekStart >= 7) {
          return 1
        }
        return 1 - state.graceDaysUsed
      },

      refreshWeek: () => {
        const state = get()
        const weekStart = state.currentWeekStart
        const now = new Date()
        const ws = parseLocalDate(weekStart)
        const daysSinceWeekStart = Math.floor((now.getTime() - ws.getTime()) / (1000 * 60 * 60 * 24))
        if (daysSinceWeekStart >= 7) {
          const n = new Date()
          const d = n.getDay()
          const diff = n.getDate() - d + (d === 0 ? -6 : 1)
          const m = new Date(n.getFullYear(), n.getMonth(), diff)
          set({
            graceDaysUsed: 0,
            currentWeekStart: formatDate(m),
          })
        }
      },

      checkStreak: () => {
        const state = get()
        const today = getToday()
        if (state.lastActiveDate === today) return

        const lastDate = state.lastActiveDate
        if (!lastDate) return

        const last = parseLocalDate(lastDate)
        const now = parseLocalDate(today)
        const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))

        if (diffDays > 1) {
          const graceLeft = get().getGraceDaysLeft()
          if (graceLeft > 0) {
            set({
              graceDaysUsed: state.graceDaysUsed + 1,
              beastMood: 'anxious' as const,
            })
          } else {
            set({
              currentStreak: 0,
              beastMood: 'anxious' as const,
            })
          }
        }
      },

      dismissConfetti: () => set({ confettiVisible: false }),

      completeOnboarding: () => set({ onboardingCompleted: true }),

      updateSettings: (s: Partial<Settings>) => {
        set((state) => ({ settings: { ...state.settings, ...s } }))
      },

      addFocusXP: (xp: number) => {
        if (!checkThrottle()) return
        set((state) => {
          const newXP = state.totalXP + xp
          const newLevel = calculateLevel(newXP)
          const unlocked = checkBeastUnlocks(state.totalXP, newXP, state.unlockedBeasts, state.premium)
          return {
            totalXP: newXP,
            totalPoints: state.totalPoints + xp,
            lastActiveDate: getToday(),
            confettiVisible: newLevel > calculateLevel(state.totalXP) || unlocked.length > 0,
            lastLevelUp: newLevel > calculateLevel(state.totalXP) ? newLevel : state.lastLevelUp,
            unlockedBeasts: unlocked.length > 0 ? [...new Set([...state.unlockedBeasts, ...unlocked])] : state.unlockedBeasts,
            newlyUnlockedBeast: unlocked.length > 0 ? unlocked[unlocked.length - 1] : state.newlyUnlockedBeast,
          }
        })
      },

      setActiveBeast: (beast: BeastType) => {
        const state = get()
        if (state.unlockedBeasts.includes(beast)) {
          set({ activeBeast: beast })
        }
      },

      setBeastName: (beast: BeastType, name: string) => {
        set((state) => ({ beastNames: { ...state.beastNames, [beast]: name.trim().slice(0, 20) } }))
      },

      dismissUnlock: () => set({ newlyUnlockedBeast: null }),
    }),
    {
      name: 'focusbeast-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => {
        const {
          addTask, completeTask, uncompleteTask, updateTask, splitTask, completeSubTask, deleteTask, useFreeFocus,
          getBeastState, getTodayTasks, getGraceDaysLeft,
          checkStreak, dismissConfetti, completeOnboarding,
          updateSettings, addFocusXP, setActiveBeast, dismissUnlock,
          confettiVisible, newlyUnlockedBeast, beastMood,
          ...persisted
        } = state
        return persisted
      },
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            AsyncStorage.removeItem('focusbeast-store')
          }
        }
      },
    }
  )
)
