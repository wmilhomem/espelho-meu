"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { User, TryOnJob, ImageAsset } from "../../types"
import LazyImage from "../LazyImage"
import { useTheme } from "../../context/ThemeContext"

interface DashboardViewProps {
  currentUser: User | null
  stats: { products: number; models: number; jobs: number; processing: number }
  jobs: TryOnJob[]
  assets: ImageAsset[]
  onNavigate: (view: any) => void
  onAction: (action: "add-product" | "add-model" | "create-look" | "view-history") => void
  onSelectLook: (image: string) => void
  onToggleLikeJob: (e: React.MouseEvent, job: TryOnJob) => void
  onDeleteJob: (e: React.MouseEvent, id: string) => void
  onShareUrl: (e: React.MouseEvent, url: string, title: string) => void
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  stats,
  jobs,
  assets,
  onNavigate,
  onAction,
  onSelectLook,
  onToggleLikeJob,
  onDeleteJob,
  onShareUrl,
}) => {
  const { theme } = useTheme()
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const timeString = currentTime.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  const dateString = currentTime.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })

  const isLuxury = theme === "luxury"

  return (
    <div className="max-w-7xl mx-auto animate-[fadeIn_0.8s_ease-out]">
      {/* HERO BANNER - WELCOME ONLY */}
      <div className="glass-card-block p-8 mb-8 relative overflow-hidden group border border-theme-accent/20 shadow-[0_20px_60px_rgba(0,0,0,0.1)] rounded-3xl bg-theme-surface">
        <div className="absolute inset-0 bg-gradient-to-r from-theme-accent/5 via-theme-secondary/5 to-transparent opacity-60"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-theme-accent/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-theme-accent/20 transition-all duration-1000"></div>

        {/* DATE & TIME DISPLAY */}
        <div className="absolute top-6 right-6 text-right z-20 hidden md:block animate-[fadeIn_1s]">
          <p className="text-3xl font-serif font-bold text-theme-text/90">{timeString}</p>
          <p className="text-xs text-theme-accent uppercase tracking-widest font-semibold">{dateString}</p>
        </div>

        <div className="relative z-10">
          <h2 className="text-3xl md:text-5xl font-serif text-theme-text mb-2 tracking-tight">
            Olá, <span className="gold-gradient-text">{currentUser?.name?.split(" ")[0]}</span>.
          </h2>
          <p className="text-theme-textMuted text-sm md:text-base font-light tracking-wide max-w-md">
            Seu estúdio pessoal está pronto. O que vamos criar hoje?
          </p>
        </div>
      </div>

      {/* QUICK ACTION CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* CARD: NOVO PRODUTO */}
        <div
          onClick={() => onAction("add-product")}
          className="glass-card-block p-6 cursor-pointer group hover:border-theme-accent/50 transition-all hover:-translate-y-1 relative overflow-hidden rounded-3xl bg-theme-surface"
        >
          <div className="absolute inset-0 bg-theme-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <h3 className="text-lg font-serif text-theme-text font-bold tracking-wide group-hover:text-theme-accent transition-colors">
                Novo Produto
              </h3>
              <p className="text-xs text-theme-textMuted mt-1 uppercase tracking-wider">Adicionar ao Acervo</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-theme-accent/10 border border-theme-accent/20 flex items-center justify-center text-theme-accent group-hover:scale-110 group-hover:bg-theme-accent group-hover:text-black transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
          </div>
        </div>

        {/* CARD: NOVO MODELO */}
        <div
          onClick={() => onAction("add-model")}
          className="glass-card-block p-6 cursor-pointer group hover:border-theme-secondary/50 transition-all hover:-translate-y-1 relative overflow-hidden rounded-3xl bg-theme-surface"
        >
          <div className="absolute inset-0 bg-theme-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <h3 className="text-lg font-serif text-theme-text font-bold tracking-wide group-hover:text-theme-secondary transition-colors">
                Novo Modelo
              </h3>
              <p className="text-xs text-theme-textMuted mt-1 uppercase tracking-wider">Casting Virtual</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-theme-secondary/10 border border-theme-secondary/20 flex items-center justify-center text-theme-secondary group-hover:scale-110 group-hover:bg-theme-secondary group-hover:text-white transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* CARD: CRIAR LOOK (HIGHLIGHT) */}
        <div
          onClick={() => onNavigate("studio")}
          className={`relative p-6 rounded-3xl cursor-pointer group overflow-hidden shadow-lg transition-all hover:-translate-y-1 
                ${
                  isLuxury
                    ? "gold-gradient-bg border-2 border-black/10 hover:shadow-[0_0_40px_rgba(255,215,0,0.5)]"
                    : "border border-transparent hover:border-white/20 hover:shadow-[0_0_40px_rgba(255,215,0,0.4)]"
                }`}
        >
          {/* Background conditional */}
          {!isLuxury && (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-theme-accent via-theme-surface to-theme-secondary opacity-20"></div>
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
            </>
          )}

          <div className="flex items-center justify-between relative z-10">
            <div>
              <h3
                className={`text-xl font-serif font-extrabold tracking-wide ${isLuxury ? "text-black" : "text-theme-text"}`}
              >
                Criar Look
              </h3>
              <p
                className={`text-xs font-bold mt-1 uppercase tracking-widest flex items-center gap-1 ${isLuxury ? "text-black/70" : "text-theme-textMuted"}`}
              >
                Iniciar Provador
                <svg
                  className={`w-3 h-3 transition-transform group-hover:translate-x-1 ${isLuxury ? "text-black" : "text-theme-accent"}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </p>
            </div>
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all group-hover:rotate-12 group-hover:scale-110 ${
                isLuxury
                  ? "bg-gradient-to-br from-black to-gray-900 border-2 border-[#FFD700]/40 shadow-lg shadow-[#FFD700]/20"
                  : "bg-gradient-to-br from-theme-accent via-theme-secondary to-theme-accent/90 border border-theme-accent/30 shadow-lg shadow-theme-accent/30"
              }`}
            >
              <svg
                className={`w-7 h-7 ${isLuxury ? "text-[#FFD700]" : "text-white"}`}
                viewBox="0 0 24 24"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth={isLuxury ? "1.5" : "0"}
              >
                <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12">
        {[
          {
            label: "Peças",
            value: stats.products,
            icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z",
            color: "text-theme-accent",
            bg: "bg-theme-accent/10",
            border: "border-theme-accent/20",
            action: () => onNavigate("products"),
          },
          {
            label: "Modelos",
            value: stats.models,
            icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
            color: "text-theme-secondary",
            bg: "bg-theme-secondary/10",
            border: "border-theme-secondary/20",
            action: () => onNavigate("models"),
          },
          {
            label: "Criações",
            value: stats.jobs,
            icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14",
            color: "text-green-400",
            bg: "bg-green-400/10",
            border: "border-green-400/20",
            action: () => onNavigate("gallery"),
          },
          {
            label: "Processando",
            value: stats.processing,
            icon: "M13 10V3L4 14h7v7l9-11h-7z",
            color: "text-blue-400",
            bg: "bg-blue-400/10",
            border: "border-blue-400/20",
            action: null,
          },
        ].map((stat, idx) => (
          <div
            key={idx}
            onClick={stat.action ? stat.action : undefined}
            className={`glass-card-block p-4 md:p-6 flex flex-col items-center justify-center text-center border ${stat.border} hover:bg-theme-surface/80 transition-all group relative overflow-hidden rounded-3xl bg-theme-surface ${stat.action ? "cursor-pointer hover:-translate-y-1" : ""}`}
          >
            <div
              className={`absolute inset-0 ${stat.bg} opacity-0 group-hover:opacity-20 transition-opacity duration-500`}
            ></div>
            <div
              className={`w-10 h-10 md:w-14 md:h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-3 md:mb-4 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all`}
            >
              <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={stat.icon} />
              </svg>
            </div>
            <p className="text-2xl md:text-4xl font-serif font-bold text-theme-text mb-1">{stat.value}</p>
            <p className="text-[10px] font-bold text-theme-textMuted uppercase tracking-[0.2em]">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* RECENT GALLERY */}
      <div className="flex justify-between items-end mb-8">
        <h3 className="text-2xl font-serif text-theme-text flex items-center gap-3">
          <span className="w-1.5 h-8 bg-gradient-to-b from-theme-accent to-theme-secondary rounded-full"></span>
          Galeria Recente
        </h3>
        <button
          onClick={() => onNavigate("gallery")}
          className="group flex items-center gap-2 text-xs font-bold text-theme-textMuted hover:text-theme-accent uppercase tracking-widest transition-colors"
        >
          Ver Coleção Completa
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mb-16">
        {jobs.slice(0, 4).map((job, i) => {
          const preview = job.resultImage || assets.find((a) => a.id === job.productId)?.preview
          return (
            <div
              key={job.id}
              onClick={() => {
                if (job.resultImage) onSelectLook(job.resultImage)
              }}
              className="group relative cursor-pointer"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {/* Card Container */}
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden border border-theme-border/20 shadow-lg group-hover:shadow-[0_20px_50px_rgba(var(--color-secondary),0.1)] group-hover:-translate-y-2 transition-all duration-500 bg-theme-surface">
                {/* Image */}
                {preview ? (
                  <LazyImage
                    src={preview}
                    alt="Look"
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-700"
                  />
                ) : (
                  <div className="w-full h-full bg-theme-surface animate-pulse flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-theme-accent border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}

                {/* Status Overlay */}
                <div className="absolute top-3 left-3 z-20">
                  {job.status === "processing" && (
                    <span className="bg-blue-500/90 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-2 uppercase tracking-wider">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span> Gerando
                    </span>
                  )}
                  {job.status === "failed" && (
                    <span className="bg-red-500/90 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg uppercase tracking-wider">
                      Falhou
                    </span>
                  )}
                </div>

                {/* Actions Overlay (Slide Up) */}
                <div className="absolute inset-0 bg-gradient-to-t from-theme-bg via-theme-bg/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] text-theme-accent uppercase tracking-widest font-bold drop-shadow-md">
                        {assets.find((a) => a.id === job.productId)?.name || "Look Personalizado"}
                      </span>
                    </div>

                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={(e) => onToggleLikeJob(e, job)}
                        className={`p-2.5 rounded-full border backdrop-blur-md transition-all resplendent-hover ${job.isFavorite ? "bg-red-500 border-red-500 text-white" : "bg-white/10 border-white/20 text-white hover:bg-white hover:text-black"}`}
                        title="Curtir"
                      >
                        <svg
                          className="w-4 h-4"
                          fill={job.isFavorite ? "currentColor" : "none"}
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          />
                        </svg>
                      </button>
                      {job.resultImage && (
                        <button
                          onClick={(e) => onShareUrl(e, job.resultImage!, "Novo Look")}
                          className="p-2.5 rounded-full bg-white/10 border border-white/20 text-white hover:bg-theme-accent hover:text-black hover:border-theme-accent backdrop-blur-md transition-all resplendent-hover"
                          title="Compartilhar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                            />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={(e) => job.id && onDeleteJob(e, job.id)}
                        className="p-2.5 rounded-full bg-white/10 border border-white/20 text-white hover:bg-red-500 hover:border-red-500 backdrop-blur-md transition-all resplendent-hover"
                        title="Excluir"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {/* ADD NEW CARD - CTA */}
        <div
          onClick={() => onNavigate("studio")}
          className="group aspect-[4/5] rounded-3xl border-2 border-dashed border-theme-border/20 hover:border-theme-accent/50 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-theme-surface/50 resplendent-hover bg-theme-surface/20"
        >
          <div className="w-16 h-16 rounded-full bg-theme-surface group-hover:bg-theme-accent/20 flex items-center justify-center mb-4 transition-colors">
            <svg
              className="w-8 h-8 text-theme-textMuted group-hover:text-theme-accent transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="text-xs font-bold text-theme-textMuted group-hover:text-theme-text uppercase tracking-widest transition-colors">
            Criar Novo
          </span>
        </div>
      </div>
    </div>
  )
}
