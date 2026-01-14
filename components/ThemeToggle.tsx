"use client"

import { useTheme, type Theme } from "../context/ThemeContext"

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const themes: { id: Theme; label: string; icon: string }[] = [
    { id: "luxury", label: "Luxury", icon: "✨" },
    { id: "dark", label: "Dark", icon: "🌙" },
    { id: "light", label: "Light", icon: "☀️" },
  ]

  return (
    <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-full p-1">
      {themes.map((t) => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id)}
          className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
            theme === t.id ? "bg-theme-accent text-black" : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
          title={t.label}
        >
          {t.icon}
        </button>
      ))}
    </div>
  )
}
