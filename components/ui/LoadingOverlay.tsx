"use client"

import type React from "react"

import { useState, useEffect } from "react"

const LOADING_PHRASES = [
  "Analisando geometria corporal...",
  "A beleza começa no momento em que você decide ser você mesma.",
  "Calculando caimento do tecido...",
  "A elegância é a única beleza que não desaparece.",
  "Ajustando iluminação de estúdio...",
  "A moda sai de moda, o estilo jamais.",
  "Renderizando texturas em alta definição...",
  "Você é sua própria musa.",
  "Finalizando o toque mágico...",
]

interface LoadingOverlayProps {
  isVisible: boolean
  message?: string
  isGlobal?: boolean
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isVisible, message, isGlobal = false }) => {
  const [loadingPhraseIndex, setLoadingPhraseIndex] = useState(0)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isVisible) {
      interval = setInterval(() => {
        setLoadingPhraseIndex((prev) => (prev + 1) % LOADING_PHRASES.length)
      }, 3000)
    } else {
      setLoadingPhraseIndex(0)
    }
    return () => clearInterval(interval)
  }, [isVisible])

  if (!isVisible) return null

  if (isGlobal) {
    return (
      <div className="absolute inset-0 bg-theme-bg/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-theme-accent border-t-transparent rounded-full animate-spin mx-auto mb-6 shadow-[0_0_20px_var(--color-theme-accent)]"></div>
          <p className="text-theme-accent text-sm uppercase tracking-widest font-bold mb-6 animate-pulse">
            {message || "Carregando..."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 z-50 bg-[#05010a]/95 backdrop-blur-xl flex flex-col items-center justify-center animate-[fadeIn_0.5s]">
      <div className="relative w-40 h-40 mb-6">
        <div className="absolute inset-0 border-4 border-theme-accent border-t-transparent rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 bg-theme-accent/20 rounded-full animate-pulse"></div>
        </div>
      </div>
      <h3 className="text-3xl font-serif text-white mb-2 animate-pulse font-bold gold-gradient-text">
        Gerando Look...
      </h3>
      <p className="text-theme-textMuted text-sm mt-4 font-light tracking-wider animate-pulse">
        {LOADING_PHRASES[loadingPhraseIndex]}
      </p>
    </div>
  )
}
