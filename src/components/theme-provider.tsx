"use client"

import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)
  
  // Initialize theme from localStorage only on client-side
  useEffect(() => {
    // Check both possible localStorage keys
    const storedTheme = localStorage.getItem(storageKey) as Theme
    const shadcnTheme = localStorage.getItem('NEXT-TS-SHADCN-UI-THEME') as Theme
    
    if (storedTheme) {
      setTheme(storedTheme)
      document.documentElement.classList.remove('light', 'dark')
      document.documentElement.classList.add(storedTheme)
    } else if (shadcnTheme) {
      setTheme(shadcnTheme)
      document.documentElement.classList.remove('light', 'dark')
      document.documentElement.classList.add(shadcnTheme)
    }
  }, [storageKey])

  // This effect now only runs when theme changes via setTheme
  useEffect(() => {
    if (theme === 'light' || theme === 'dark') {
      const root = window.document.documentElement
      root.classList.remove("light", "dark")
      root.classList.add(theme)
      
      // Sync both localStorage values
      localStorage.setItem(storageKey, theme)
      localStorage.setItem('NEXT-TS-SHADCN-UI-THEME', theme)
    }
  }, [theme, storageKey])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}