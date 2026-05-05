import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'
type ThemeColor =
  | 'blue'
  | 'green'
  | 'purple'
  | 'orange'
  | 'rose'
  | 'emerald'
  | 'red'
  | 'indigo'

export type { Theme, ThemeColor }

export interface ThemeContextType {
  theme: Theme
  themeColor: ThemeColor
  setTheme: (theme: Theme) => void
  setThemeColor: (color: ThemeColor) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}


export function ThemeProvider({ children, defaultTheme = 'light', defaultThemeColor = 'orange' }: { children: React.ReactNode, defaultTheme?: Theme, defaultThemeColor?: ThemeColor }) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)
  const [themeColor, setThemeColor] = useState<ThemeColor>(defaultThemeColor)

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
  }, [theme])

  useEffect(() => {
    const root = window.document.documentElement
    const colors = ['orange', 'blue', 'green', 'red', 'purple', 'yellow']
    root.classList.remove(...colors.map(c => `theme-${c}`))
    root.classList.add(`theme-${themeColor}`)
  }, [themeColor])

  const value = {
    theme,
    setTheme,
    themeColor,
    setThemeColor,
    toggleTheme: () => setTheme(prev => prev === 'light' ? 'dark' : 'light'),
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
