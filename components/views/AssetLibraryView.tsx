"use client"

import type React from "react"
import { useState } from "react"
import type { ImageAsset } from "../../types"
import LazyImage from "../LazyImage"
import { updateAsset, addNotification } from "../../services/storageService"
import { useTheme } from "../../context/ThemeContext"

interface AssetLibraryViewProps {
  viewType: "products" | "models"
  assets: ImageAsset[]
  onAdd: () => void
  onEdit?: (asset: ImageAsset) => void
  onSharePage: () => void
  onToggleLike: (e: React.MouseEvent, asset: ImageAsset) => void
  onShareUrl: (e: React.MouseEvent, url: string, title: string) => void
  onUse: (e: React.MouseEvent, asset: ImageAsset) => void
  onDelete: (e: React.MouseEvent, asset: ImageAsset) => void
  onViewStores?: () => void // Nova prop para navegação
  isSellerMode?: boolean
}

export const AssetLibraryView: React.FC<AssetLibraryViewProps> = ({
  viewType,
  assets,
  onAdd,
  onEdit,
  onSharePage,
  onToggleLike,
  onShareUrl,
  onUse,
  onDelete,
  onViewStores,
  isSellerMode,
}) => {
  const { theme } = useTheme()
  const [searchTerm, setSearchTerm] = useState("")
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const filteredAssets = (type: "product" | "model") => {
    return assets.filter(
      (a) => a.type === type && (searchTerm === "" || (a.name || "").toLowerCase().includes(searchTerm.toLowerCase())),
    )
  }

  const handleTogglePublish = async (e: React.MouseEvent, asset: ImageAsset) => {
    e.stopPropagation()
    if (!asset.id || updatingId) return
    setUpdatingId(asset.id)

    try {
      const newStatus = !asset.published
      await updateAsset(asset.id, { published: newStatus })
      asset.published = newStatus // Optimistic update (refetch happens on parent, but this gives immediate feedback)
      addNotification({
        id: Date.now().toString(),
        type: "success",
        title: newStatus ? "Publicado" : "Ocultado",
        message: `Produto ${newStatus ? "visível" : "oculto"} na loja.`,
        read: false,
        timestamp: Date.now(),
      })
    } catch (err) {
      console.error(err)
    } finally {
      setUpdatingId(null)
    }
  }

  const handlePublishAll = async () => {
    const unpublished = filteredAssets("product").filter((a) => !a.published)
    if (unpublished.length === 0) return

    const confirm = window.confirm(`Deseja publicar todos os ${unpublished.length} produtos?`)
    if (!confirm) return

    for (const asset of unpublished) {
      if (asset.id) await updateAsset(asset.id, { published: true })
    }
    addNotification({
      id: Date.now().toString(),
      type: "success",
      title: "Sucesso",
      message: "Todos os produtos foram publicados.",
      read: false,
      timestamp: Date.now(),
    })
    // Force reload ideally triggered via parent, but local state update simulation helps UX
    unpublished.forEach((a) => (a.published = true))
  }

  const isLuxury = theme === "luxury"

  return (
    <div className="max-w-7xl mx-auto animate-[fadeIn_0.5s_ease-out]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2
            className={`text-3xl font-bold mb-2 tracking-wide font-serif ${isLuxury ? "text-transparent bg-clip-text bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#AA771C] bg-[length:200%_auto] animate-shine" : "text-theme-text"}`}
          >
            {viewType === "products" ? "Produtos" : "Modelos"}
          </h2>
          <p className="text-white text-sm font-light">
            Gerencie{" "}
            {viewType === "products"
              ? "seus produtos e preços para a loja"
              : "fotos de pessoas para experimentar os looks"}
          </p>
        </div>
        <div className="flex gap-3">
          {viewType === "products" && isSellerMode && (
            <button
              onClick={handlePublishAll}
              className="px-4 py-3 rounded-xl border border-theme-accent/30 text-theme-accent hover:bg-theme-accent hover:text-black transition-all font-bold text-xs uppercase tracking-wider"
            >
              Publicar Todos
            </button>
          )}
          <button
            onClick={onAdd}
            className="gold-gradient-bg px-6 py-3 rounded-xl text-black font-bold text-sm flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:scale-105 hover:shadow-[0_0_30px_rgba(255,215,0,0.5)]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            ADICIONAR {viewType === "products" ? "PRODUTO" : "MODELO"}
          </button>
        </div>
      </div>

      {/* --- EXPLORE STORES SUGGESTION BANNER --- */}
      {viewType === "products" && onViewStores && (
        <div className="mb-8 relative group overflow-hidden rounded-2xl border border-white/10">
          <div className="absolute inset-0 bg-gradient-to-r from-[#240046] via-[#3c096c] to-[#0a0112] opacity-80"></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>

          <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center border border-white/20 shadow-[0_0_30px_rgba(255,215,0,0.2)]">
                <svg className="w-8 h-8 text-theme-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-serif font-bold text-white mb-1">Sem fotos para upload?</h3>
                <p className="text-gray-300 text-sm font-light max-w-lg">
                  Não precisa ter peças próprias. Navegue pelas vitrines dos nossos parceiros e experimente looks
                  profissionais instantaneamente.
                </p>
              </div>
            </div>
            <button
              onClick={onViewStores}
              className="px-8 py-3 bg-white text-black font-bold uppercase tracking-widest text-xs rounded-full hover:bg-theme-accent transition-all shadow-lg hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] whitespace-nowrap"
            >
              Explorar Vitrines
            </button>
          </div>
        </div>
      )}

      <div className="mb-8 flex flex-col md:flex-row gap-4 items-stretch">
        <div className="glass-card-block rounded-xl p-2 flex items-center bg-black/20 flex-1 border border-white/10 hover:border-theme-accent/50 transition-colors">
          <div className="p-3 text-theme-textMuted">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder={`Buscar ${viewType === "products" ? "produtos" : "modelos"}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none text-theme-text text-sm w-full h-full p-2 placeholder-theme-textMuted"
          />
        </div>

        {isSellerMode && viewType === "products" && (
          <button
            onClick={onSharePage}
            className="px-6 py-2 rounded-xl border border-theme-accent/30 text-theme-accent hover:bg-theme-accent hover:text-black transition-all font-bold text-sm flex items-center justify-center gap-2 uppercase tracking-wider hover:shadow-[0_0_15px_rgba(var(--color-accent),0.4)]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            Compartilhar Loja
          </button>
        )}
      </div>

      {viewType === "products" ? (
        // VISUALIZAÇÃO POR CATEGORIAS (CARROSSEL COM ESTILO VITRINE) - Com Scroll Vertical Limitado
        <div className="space-y-12 max-h-[65vh] overflow-y-auto custom-scrollbar pr-2 pb-4">
          {Array.from(new Set(filteredAssets("product").map((a) => a.category || "Geral"))).map((category) => {
            const categoryAssets = filteredAssets("product").filter((a) => (a.category || "Geral") === category)
            if (categoryAssets.length === 0) return null

            return (
              <div key={category} className="animate-[fadeIn_0.5s_ease-out]">
                <div className="flex items-center gap-3 mb-6 sticky top-0 bg-theme-bg/95 backdrop-blur-sm z-30 py-2">
                  <h3 className="text-xl font-bold text-theme-text uppercase tracking-widest">{category}</h3>
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-theme-border to-transparent"></div>
                </div>

                {/* Alterado de scrollbar-hide para gold-scrollbar */}
                <div className="flex overflow-x-auto gap-6 pb-6 gold-scrollbar snap-x">
                  {categoryAssets.map((asset) => (
                    <div
                      key={asset.id}
                      className="min-w-[200px] md:min-w-[240px] snap-center cursor-pointer rounded-lg group flex flex-col"
                    >
                      {/* CARD IMAGE CONTAINER (VITRINE STYLE) */}
                      <div
                        className={`aspect-[3/4] relative rounded-xl overflow-hidden border transition-all duration-500 bg-[#0a0112] shadow-lg group-hover:shadow-[0_0_30px_rgba(255,215,0,0.15)] ${asset.published ? "border-white/10 group-hover:border-theme-accent/50" : "border-red-500/30 opacity-80 hover:opacity-100"}`}
                      >
                        <LazyImage
                          src={asset.preview}
                          alt={asset.name || "Asset"}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />

                        {/* TOP RIGHT: ADMIN UTILS (Delete & Publish) */}
                        <div className="absolute top-2 right-2 flex flex-col gap-2 z-20">
                          {isSellerMode && (
                            <button
                              onClick={(e) => handleTogglePublish(e, asset)}
                              className={`p-2.5 rounded-full backdrop-blur-xl transition-all shadow-lg hover:scale-110 ${asset.published ? "bg-green-500 text-black border border-green-400" : "bg-red-500 text-white border border-red-400"}`}
                              title={asset.published ? "Visível na Loja" : "Oculto na Loja"}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d={
                                    asset.published
                                      ? "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                      : "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                  }
                                />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={(e) => onDelete(e, asset)}
                            className="p-2.5 rounded-full bg-black/60 text-white border border-white/20 hover:bg-red-600 hover:border-red-600 backdrop-blur-xl transition-all shadow-lg"
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
                          {onEdit && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onEdit(asset)
                              }}
                              className="p-2.5 rounded-full bg-black/30 text-white border border-white/20 hover:bg-[#BF953F]/80 hover:border-[#BF953F] backdrop-blur-xl transition-all shadow-lg hover:scale-110"
                              title="Editar"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                          )}
                        </div>

                        {/* BOTTOM SLIDE-UP: PRIMARY ACTIONS */}
                        <div className="absolute inset-x-0 bottom-0 p-3 flex flex-col gap-2">
                          <button
                            onClick={(e) => onUse(e, asset)}
                            className="w-full bg-gradient-to-r from-[#BF953F]/20 to-[#FCF6BA]/20 backdrop-blur-md border border-[#BF953F]/40 text-[#FCF6BA] text-xs font-bold py-3 uppercase tracking-widest hover:bg-[#BF953F]/30 hover:border-[#BF953F]/60 transition-all flex items-center justify-center gap-2 rounded-lg shadow-lg hover:shadow-[0_0_20px_rgba(191,149,63,0.4)]"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 10V3L4 14h7v7l9-11h-7z"
                              />
                            </svg>
                            EXPERIMENTAR
                          </button>
                        </div>
                      </div>

                      {/* INFO BELOW IMAGE */}
                      <div className="pt-3 px-1">
                        <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">
                          {asset.category || "Geral"}
                        </p>
                        <div className="flex justify-between items-start">
                          <h4 className="text-white text-sm font-bold font-serif truncate pr-2">
                            {asset.name || "Sem nome"}
                          </h4>
                          {asset.price !== undefined && asset.price !== null && (
                            <p className="text-theme-accent text-sm font-mono font-bold whitespace-nowrap">
                              R$ {asset.price.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        // VISUALIZAÇÃO EM GRID (MODELOS) - Com Scroll Vertical Limitado
        <div className="max-h-[65vh] overflow-y-auto custom-scrollbar pr-2 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAssets("model").map((asset) => (
              <div
                key={asset.id}
                className="group relative bg-gradient-to-b from-[#0a0112]/80 to-[#05010a] border border-white/10 hover:border-[#BF953F]/40 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(191,149,63,0.2)]"
              >
                <div className="aspect-[3/4] relative rounded-xl overflow-hidden border border-white/10 bg-[#0a0112] shadow-lg hover:shadow-[0_0_30px_rgba(176,38,255,0.15)] transition-all">
                  <LazyImage
                    src={asset.preview}
                    alt={asset.name || "Model"}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />

                  {/* TOP RIGHT ICONS */}
                  <div className="absolute top-2 right-2 flex flex-col gap-2 z-20">
                    <button
                      onClick={(e) => onToggleLike(e, asset)}
                      className={`p-2.5 rounded-full backdrop-blur-xl transition-all shadow-lg hover:scale-110 ${asset.isFavorite ? "bg-red-500 text-white border border-red-400" : "bg-black/60 text-white border border-white/20"}`}
                      title="Favorito"
                    >
                      <svg
                        className="w-4 h-4"
                        fill={asset.isFavorite ? "currentColor" : "none"}
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
                    <button
                      onClick={(e) => onDelete(e, asset)}
                      className="p-2.5 rounded-full bg-black/60 text-white border border-white/20 hover:bg-red-600 hover:border-red-600 backdrop-blur-xl transition-all shadow-lg"
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
                    {onEdit && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onEdit(asset)
                        }}
                        className="p-2.5 rounded-full bg-black/30 text-white border border-white/20 hover:bg-[#BF953F]/80 hover:border-[#BF953F] backdrop-blur-xl transition-all shadow-lg hover:scale-110"
                        title="Editar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* BOTTOM SLIDE-UP */}
                  <div className="absolute inset-x-0 bottom-0 p-3 flex flex-col gap-2">
                    <button
                      onClick={(e) => onUse(e, asset)}
                      className="w-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-md border border-purple-400/40 text-purple-200 text-xs font-bold py-3 uppercase tracking-widest hover:bg-purple-500/30 hover:border-purple-400/60 transition-all flex items-center justify-center gap-2 rounded-lg shadow-lg hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      EXPERIMENTAR
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
