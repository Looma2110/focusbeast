import React, { createContext, useContext, useState, useEffect } from 'react'
import { useColorScheme } from 'react-native'
import { useAppStore } from '../store'

type Theme = 'light' | 'dark' | 'auto'

interface ThemeContextType {
  isDark: boolean
  theme: Theme
  setTheme: (t: Theme) => void
  colors: typeof import('../constants/colors').Colors
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  theme: 'auto',
  setTheme: () => {},
  colors: require('../constants/colors').Colors,
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme()
  const { settings } = useAppStore()
  const [theme, setTheme] = useState<Theme>(settings.theme)

  const isDark = theme === 'dark' || (theme === 'auto' && systemScheme === 'dark')

  const { getColors } = require('../constants/colors')
  const colors = getColors(isDark)

  return (
    <ThemeContext.Provider value={{ isDark, theme, setTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
