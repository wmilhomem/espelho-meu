"use client"

import type React from "react"
import LazyImage from "./LazyImage"
import type { HistoryItem } from "../types"
import { useTheme } from "../context/ThemeContext"

interface HistoryGalleryProps {
  history: HistoryItem[]
  onSelect: (item: HistoryItem) => void
  onShare: (item: HistoryItem) => void
  onDelete?: (e: React.MouseEvent, item: HistoryItem) => void
}

const HistoryGallery: React.FC<HistoryGalleryProps> = ({ history, onSelect, onShare, onDelete }) => {
  const { theme } = useTheme()
  const isLuxury = theme === "luxury"

  return (
    <div className="animate-[fadeIn_0.5s_ease-out]">
      <h2
        className={`text-3xl font-bold mb-8 font-serif ${isLuxury ? "text-transparent bg-clip-text bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#AA771C] bg-[length:200%_auto] animate-shine" : "text-white"}`}
      >
        Meus Looks de Transformação
      </h2>

      {/* Container com efeito "Reflexo Opaco" (Vidro Fosco) */}
      <div className="rounded-3xl p-8 h-[65vh] flex flex-col border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/0 to-white/5 relative overflow-hidden">
        {/* Brilho sutil no topo para acentuar o efeito de vidro */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

        {!history || history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-[fadeIn_0.5s] relative z-10">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10 backdrop-blur-sm">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white font-serif">Galeria Vazia</h3>
            <p className="text-gray-400 text-sm mt-2 max-w-md">
              Seus looks gerados aparecerão aqui. Comece criando sua primeira combinação no Atelier.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {history.map((item, i) => (
                <div
                  key={item.id}
                  onClick={() => item.status === "completed" && onSelect(item)}
                  className="group relative cursor-pointer"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  {/* Card Container - Premium Look */}
                  <div className="relative aspect-[4/5] rounded-3xl overflow-hidden border border-white/10 shadow-lg group-hover:shadow-[0_20px_50px_rgba(157,78,221,0.3)] group-hover:-translate-y-2 transition-all duration-500 bg-black/40">
                    {/* Main Result Image */}
                    <LazyImage
                      src={item.resultImage}
                      alt={`Look ${i}`}
                      className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${item.status !== "completed" ? "opacity-50 blur-sm" : ""}`}
                    />

                    {/* ORIGIN BADGE (TOP LEFT) */}
                    <div className="absolute top-3 left-3 z-20">
                      {item.origin === "store" ? (
                        <div className="flex items-center gap-1.5 bg-theme-accent/95 text-black px-2 py-1 rounded-full shadow-lg backdrop-blur-sm border border-white/10">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                            />
                          </svg>
                          <span className="text-[9px] font-bold uppercase tracking-wide truncate max-w-[80px]">
                            {item.storeName || "Loja"}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 bg-black/60 text-gray-300 px-2 py-1 rounded-full shadow-lg backdrop-blur-md border border-white/10">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                          <span className="text-[9px] font-bold uppercase tracking-wide">Pessoal</span>
                        </div>
                      )}
                    </div>

                    {/* DELETE OVERLAY ICON */}
                    {onDelete && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(e, item)
                        }}
                        className="absolute top-3 right-3 p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-red-500/80 transition-all opacity-0 group-hover:opacity-100 z-20 border border-white/10"
                        title="Excluir da Galeria"
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
                    )}

                    {/* Status Overlays */}
                    {item.status === "processing" && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                        <div className="w-8 h-8 border-2 border-theme-accent border-t-transparent rounded-full animate-spin mb-2"></div>
                        <span className="text-[10px] text-theme-accent font-bold uppercase tracking-widest animate-pulse">
                          Criando...
                        </span>
                      </div>
                    )}

                    {item.status === "failed" && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                        <svg
                          className="w-8 h-8 text-red-500 mb-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="text-[10px] text-red-400 font-bold uppercase tracking-widest">Falhou</span>
                      </div>
                    )}

                    {/* Hover Info - Slide Up */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f0219] via-[#0f0219]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 pointer-events-none">
                      <div className="flex justify-between items-end transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <span className="text-[10px] text-theme-accent font-bold uppercase tracking-widest">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </span>
                        <div className="flex gap-2">
                          {/* Mini previews of sources */}
                          <div className="w-8 h-8 rounded-lg border border-white/20 overflow-hidden bg-black shadow-lg">
                            <img src={item.productPreview} className="w-full h-full object-cover" />
                          </div>
                          <div className="w-8 h-8 rounded-lg border border-white/20 overflow-hidden bg-black shadow-lg">
                            <img src={item.modelPreview} className="w-full h-full object-cover" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default HistoryGallery
