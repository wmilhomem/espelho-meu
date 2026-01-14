"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

export type Theme = "luxury" | "dark" | "light"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check local storage or default to luxury
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("espelho_theme")
      return (saved as Theme) || "luxury"
    }
    return "luxury"
  })

  useEffect(() => {
    // Apply theme to document
    const root = window.document.documentElement
    root.setAttribute("data-theme", theme)
    localStorage.setItem("espelho_theme", theme)

    // Optional: Add class for Tailwind dark mode if needed
    if (theme === "dark" || theme === "luxury") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
  }, [theme])

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
