"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { upscaleImage } from "../services/geminiService"
import { toggleJobVisibility } from "../services/storageService"
import { useTheme } from "../context/ThemeContext"

interface ResultModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string | null
  jobId?: string // ID do job atual para atualizações
  isPublic?: boolean // Estado inicial
}

const ResultModal: React.FC<ResultModalProps> = ({ isOpen, onClose, imageUrl, jobId, isPublic = false }) => {
  const { theme } = useTheme()
  const [isSharing, setIsSharing] = useState(false)
  const [isUpscaling, setIsUpscaling] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [feedback, setFeedback] = useState<"liked" | "disliked" | null>(null)
  const [isPublished, setIsPublished] = useState(isPublic)
  const [isTogglingPublish, setIsTogglingPublish] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setFeedback(null)
      setZoomLevel(1)
      setIsPublished(isPublic)
    }
  }, [isOpen, imageUrl, isPublic])

  if (!isOpen || !imageUrl) return null

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.5, 3))
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.5, 1))

  const handleTogglePublish = async () => {
    if (!jobId) return
    setIsTogglingPublish(true)
    try {
      const newState = !isPublished
      await toggleJobVisibility(jobId, newState)
      setIsPublished(newState)
    } catch (err) {
      console.error("Erro ao publicar look:", err)
    } finally {
      setIsTogglingPublish(false)
    }
  }

  const handleShare = async () => {
    if (!imageUrl) return
    setIsSharing(true)
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const file = new File([blob], "espelho-look.png", { type: blob.type })
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({ title: "Espelho Meu", text: "Meu look exclusivo criado com IA.", files: [file] })
      } else {
        await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
        alert("Imagem copiada!")
      }
    } catch (error) {
      console.error("Error sharing:", error)
    } finally {
      setIsSharing(false)
    }
  }

  const handleDownload = async () => {
    if (!imageUrl) return
    setIsUpscaling(true)
    try {
      const highResUrl = await upscaleImage(imageUrl)
      const link = document.createElement("a")
      link.href = highResUrl
      link.download = `espelho-look-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Download failed", error)
    } finally {
      setIsUpscaling(false)
    }
  }

  // Definição de estilos baseados no tema
  const isLuxury = theme === "luxury"

  // No tema Luxury, usamos bordas douradas sutis e fundos escuros profundos
  const containerClasses = isLuxury
    ? "border-[#FFD700]/30 shadow-[0_0_80px_rgba(36,0,70,0.6)]"
    : "bg-theme-surface border-theme-border/20 shadow-2xl"

  const sidebarClasses = isLuxury
    ? "bg-[#0a0112]/40 backdrop-blur-md border-l border-white/10"
    : "bg-theme-surface border-l border-theme-border/10"

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/95 backdrop-blur-md transition-opacity duration-700"
        onClick={onClose}
      ></div>

      {/* Main Container */}
      <div
        className={`relative z-10 w-full max-w-7xl h-[90vh] flex flex-col lg:flex-row rounded-3xl overflow-hidden border ${containerClasses} animate-[zoomIn_0.4s_cubic-bezier(0.2,0.8,0.2,1)]`}
      >
        {/* Luxury Background Overlay (Matches Landing Page Hero) */}
        {isLuxury ? (
          <div className="absolute inset-0 pointer-events-none z-0">
            {/* Gradiente Roxo/Azul Profundo idêntico à Hero Section */}
            <div className="absolute top-0 w-full h-full bg-gradient-to-b from-[#240046] via-[#3c096c] to-[#0f0219]"></div>
            {/* Glow Central Dourado */}
            <div className="absolute top-[-10%] left-1/2 transform -translate-x-1/2 w-[80vw] h-[80vw] bg-[#FFD700]/5 rounded-full blur-[130px]"></div>
            {/* Reflexo de "chão" */}
            <div className="absolute bottom-0 w-full h-[40%] bg-gradient-to-t from-[#0f0219] to-transparent"></div>
          </div>
        ) : (
          <div className="absolute inset-0 bg-theme-surface z-0"></div>
        )}

        {/* IMAGE CANVAS */}
        <div className={`relative w-full lg:w-3/4 flex items-center justify-center overflow-hidden group z-10`}>
          {/* Plataforma Opaca/Reflexiva atrás da imagem */}
          {isLuxury && (
            <div className="absolute inset-4 rounded-2xl bg-white/5 backdrop-blur-2xl border border-white/10 shadow-inner pointer-events-none"></div>
          )}

          {/* Floating Controls */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30 flex items-center gap-4 bg-black/60 backdrop-blur-xl px-6 py-3 rounded-full border border-white/10 shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
            <button onClick={handleZoomOut} className="p-2 text-gray-300 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="text-xs font-mono font-bold text-luxury-gold w-12 text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button onClick={handleZoomIn} className="p-2 text-gray-300 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>

          <div className="w-full h-full overflow-auto flex items-center justify-center custom-scrollbar p-4 lg:p-8 z-20">
            <img
              src={imageUrl}
              alt="Generated Look"
              style={{
                transform: `scale(${zoomLevel})`,
                transition: "transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
              }}
              className={`max-w-full max-h-full object-contain shadow-2xl origin-center rounded-lg ${isLuxury ? "drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]" : ""}`}
            />
          </div>
        </div>

        {/* SIDEBAR PANEL */}
        <div
          className={`w-full lg:w-1/4 p-8 flex flex-col justify-between relative z-20 shadow-[-20px_0_60px_rgba(0,0,0,0.2)] ${sidebarClasses}`}
        >
          <div className="animate-[fadeIn_0.5s_0.2s_both]">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-theme-accent to-theme-secondary p-[1px] shadow-[0_0_20px_rgba(var(--color-accent),0.2)]">
                <div className="w-full h-full bg-black/40 backdrop-blur-md rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-theme-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                    />
                  </svg>
                </div>
              </div>
              <div>
                <h2
                  className={`font-serif text-3xl tracking-wide leading-none ${isLuxury ? "text-white" : "text-theme-text"}`}
                >
                  Sublime.
                </h2>
                <p
                  className={`text-[10px] uppercase tracking-[0.2em] mt-1 font-bold ${isLuxury ? "text-luxury-gold" : "text-theme-textMuted"}`}
                >
                  Look Finalizado
                </p>
              </div>
            </div>

            <p
              className={`text-sm font-light leading-relaxed mb-8 border-l pl-5 ${isLuxury ? "text-gray-300 border-luxury-gold/30" : "text-theme-textMuted border-theme-border/20"}`}
            >
              Cada pixel foi ajustado para refletir a melhor versão do seu estilo com precisão de alta costura.
            </p>

            {/* Publicar na Comunidade Toggle */}
            <div
              className={`border rounded-xl p-4 mb-8 flex items-center justify-between transition-colors ${isLuxury ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-theme-bg/50 border-theme-border/10 hover:bg-theme-bg"}`}
            >
              <div>
                <p
                  className={`text-xs font-bold uppercase tracking-wider ${isLuxury ? "text-white" : "text-theme-text"}`}
                >
                  Publicar na Galeria
                </p>
                <p className="text-theme-textMuted text-[10px] mt-1">Visível na Home com link da loja.</p>
              </div>
              <button
                onClick={handleTogglePublish}
                disabled={isTogglingPublish}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${isPublished ? "bg-theme-accent" : "bg-gray-600"}`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${isPublished ? "translate-x-6" : "translate-x-0"}`}
                ></div>
              </button>
            </div>

            {/* Feedback Mini-Interaction */}
            <div className="mb-4">
              <p className="text-[9px] uppercase font-bold text-theme-textMuted tracking-widest mb-3">O que achou?</p>
              <div className="flex gap-2">
                {["liked", "disliked"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFeedback(type as any)}
                    className={`flex-1 py-3 rounded-lg border transition-all duration-300 ${
                      feedback === type
                        ? type === "liked"
                          ? "bg-green-500/20 border-green-500 text-green-500"
                          : "bg-red-500/20 border-red-500 text-red-500"
                        : isLuxury
                          ? "border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                          : "border-theme-border/20 bg-theme-bg/50 text-theme-textMuted hover:bg-theme-bg hover:text-theme-text"
                    }`}
                  >
                    {type === "liked" ? (
                      <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 animate-[fadeIn_0.5s_0.4s_both]">
            <button
              onClick={handleDownload}
              disabled={isUpscaling}
              className="gold-gradient-bg text-black font-extrabold py-4 px-6 rounded-full text-center uppercase tracking-[0.2em] text-xs hover:shadow-[0_0_40px_rgba(255,215,0,0.3)] transition-all flex items-center justify-center gap-3 transform hover:-translate-y-1 border border-black/10"
            >
              {isUpscaling ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
              )}
              Salvar em 4K
            </button>

            <button
              onClick={handleShare}
              disabled={isSharing}
              className={`border py-4 px-6 rounded-full uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:shadow-lg font-bold transition-all ${isLuxury ? "border-white/20 text-white hover:bg-white hover:text-black" : "border-theme-border/50 text-theme-text hover:bg-theme-text hover:text-theme-bg"}`}
            >
              {isSharing ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
              )}
              Compartilhar
            </button>

            <button
              onClick={onClose}
              className="text-theme-textMuted hover:text-theme-text py-3 text-[10px] font-bold uppercase tracking-widest transition-colors mt-2"
            >
              Fechar Janela
            </button>
          </div>
        </div>

        {/* Close Button Mobile */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 lg:hidden text-white bg-black/60 p-2 rounded-full backdrop-blur-md z-50"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default ResultModal
