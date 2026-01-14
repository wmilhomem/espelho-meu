"use client"

import type React from "react"
import type { TryOnStyle } from "../types"

interface StyleSelectorProps {
  value: TryOnStyle
  onChange: (style: TryOnStyle) => void
}

export const StyleSelector: React.FC<StyleSelectorProps> = ({ value, onChange }) => {
  const styles: { id: TryOnStyle; label: string }[] = [
    { id: "editorial", label: "Editorial Vogue" },
    { id: "seda", label: "Seda / Cetim" },
    { id: "justa", label: "Anatômica / Justa" },
    { id: "transparente", label: "Renda / Tule" },
    { id: "casual", label: "Casual Influencer" },
    { id: "passarela", label: "Passarela" },
  ]

  return (
    <div>
      <label className="block text-xs font-bold text-white uppercase mb-4 tracking-widest flex items-center gap-2">
        <svg className="w-4 h-4 text-theme-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
          />
        </svg>
        Definir Estética
      </label>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {styles.map((style) => (
          <button
            key={style.id}
            onClick={() => onChange(style.id)}
            className={`p-4 rounded-xl text-left border transition-all relative overflow-hidden group ${
              value === style.id
                ? "bg-theme-accent/10 border-theme-accent text-white shadow-[0_0_15px_rgba(var(--color-accent),0.2)]"
                : "bg-black/40 border-white/10 text-gray-400 hover:border-white/30 hover:text-white"
            }`}
          >
            <span className="text-xs font-bold uppercase tracking-wider relative z-10">{style.label}</span>
            {value === style.id && <div className="absolute bottom-0 left-0 h-1 bg-theme-accent w-full"></div>}
          </button>
        ))}
      </div>
    </div>
  )
}
