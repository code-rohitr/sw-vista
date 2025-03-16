"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"

import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    // Directly toggle between light and dark, ignoring system preference
    const newTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark'
    
    // Update both localStorage values to ensure consistency
    localStorage.setItem('theme', newTheme)
    localStorage.setItem('NEXT-TS-SHADCN-UI-THEME', newTheme)
    
    // Apply the theme directly to the document
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(newTheme)
    
    // Update the theme state
    setTheme(newTheme as any)
  }

  return (
    <Button
      variant="outline"
      size="icon"
      className="rounded-full bg-white dark:bg-black border-black dark:border-white transition-transform duration-300 hover:scale-110"
      onClick={toggleTheme}
    >
      {document.documentElement.classList.contains('dark') ? (
        <Sun className="h-[1.2rem] w-[1.2rem] text-white" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem] text-black" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}