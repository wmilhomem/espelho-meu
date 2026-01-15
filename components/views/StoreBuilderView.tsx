"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import type { User, ImageAsset, Order, StoreStyleCategory } from "../../types"
import {
  getAssets,
  updateAsset,
  addNotification,
  updateUserProfile,
  getStoreOrders,
  uploadBlobToStorage,
} from "../../services/storageService"
import LazyImage from "../LazyImage"
import Button from "../Button"
import ExternalLink from "../ExternalLink"

interface StoreBuilderViewProps {
  currentUser: User
  onNavigate: (view: any) => void
  onPreviewStore: () => void
}

type Tab = "products" | "appearance" | "orders"

// Helper robusto para tratar qualquer formato que venha do banco (String, JSON String, Array)
const parseBanners = (input: any): string[] => {
  if (!input) return []

  // Se já for array, retorna
  if (Array.isArray(input)) return input

  // Se for string, tenta parsear
  if (typeof input === "string") {
    try {
      // Remove aspas extras se houver dupla serialização
      const cleaned = input.startsWith('"') && input.endsWith('"') ? JSON.parse(input) : input

      // Tenta parsear como JSON
      const parsed = JSON.parse(cleaned)
      if (Array.isArray(parsed)) return parsed

      // Se parseou mas não é array, envelopa
      return [parsed.toString()]
    } catch (e) {
      // Se falhar o JSON.parse, assume que é uma URL direta (legado)
      return input.length > 5 ? [input] : []
    }
  }

  return []
}

const STORE_STYLES: StoreStyleCategory[] = [
  "Luxo",
  "Streetwear",
  "Casual",
  "Alfaiataria",
  "Fitness",
  "Praia",
  "Vintage",
  "Alternativo",
  "Noiva/Festa",
  "Infantil",
  "Outros",
]

export const StoreBuilderView: React.FC<StoreBuilderViewProps> = ({ currentUser, onNavigate, onPreviewStore }) => {
  const [activeTab, setActiveTab] = useState<Tab>("products")
  const [products, setProducts] = useState<ImageAsset[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState("Todos")
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Banner & Appearance States
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  // Estados locais de aparência
  const [banners, setBanners] = useState<string[]>([])
  const [logoPreview, setLogoPreview] = useState("")
  const [storeName, setStoreName] = useState("")
  const [storeStyle, setStoreStyle] = useState<StoreStyleCategory>("Outros")
  const [whatsapp, setWhatsapp] = useState("")

  // Social Media States
  const [instagram, setInstagram] = useState("")
  const [tiktok, setTiktok] = useState("")
  const [pinterest, setPinterest] = useState("")

  const [isSavingAppearance, setIsSavingAppearance] = useState(false)

  // Share Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  // Sincronização inicial e quando currentUser muda
  useEffect(() => {
    if (currentUser) {
      const config = currentUser.storeConfig || {}
      setStoreName(config.storeName || "")
      setLogoPreview(config.storeLogo || "")
      setStoreStyle(config.storeStyle || "")
      setWhatsapp(config.whatsapp || "")
      setInstagram((config.socialLinks as any)?.instagram || "")
      setTiktok((config.socialLinks as any)?.tiktok || "")
      setPinterest((config.socialLinks as any)?.pinterest || "")

      const bannerData = config.storeBanner
      console.log("[v0] StoreBuilderView: Loading banners from storeConfig:", bannerData, typeof bannerData)

      let parsedBanners: string[] = []
      if (bannerData) {
        if (typeof bannerData === "string") {
          if (bannerData.length === 0 || bannerData === "[]") {
            parsedBanners = []
          } else {
            try {
              const parsed = JSON.parse(bannerData)
              parsedBanners = Array.isArray(parsed) ? parsed.filter(Boolean) : []
            } catch {
              // If not JSON, assume it's a single URL
              parsedBanners = bannerData.length > 5 ? [bannerData] : []
            }
          }
        } else if (Array.isArray(bannerData)) {
          parsedBanners = bannerData.filter(Boolean)
        }
      }

      console.log("[v0] StoreBuilderView: Parsed banners:", parsedBanners)
      setBanners(parsedBanners)
    }
  }, [currentUser])

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === "products") {
        const assets = await getAssets("product")
        setProducts(assets)
      } else if (activeTab === "orders") {
        const fetchedOrders = await getStoreOrders()
        setOrders(fetchedOrders)
      }
    } catch (err) {
      console.error(err)
      addNotification({
        id: Date.now().toString(),
        type: "error",
        title: "Erro",
        message: "Falha ao carregar dados.",
        read: false,
        timestamp: Date.now(),
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePublish = async (asset: ImageAsset) => {
    if (!asset.id || updatingId) return
    setUpdatingId(asset.id)
    try {
      const newStatus = !asset.published
      await updateAsset(asset.id, { published: newStatus })
      setProducts((prev) => prev.map((p) => (p.id === asset.id ? { ...p, published: newStatus } : p)))
      addNotification({
        id: Date.now().toString(),
        type: "success",
        title: newStatus ? "Ativado" : "Pausado",
        message: newStatus ? `Produto visível.` : `Produto oculto.`,
        read: false,
        timestamp: Date.now(),
      })
    } catch (err) {
      addNotification({
        id: Date.now().toString(),
        type: "error",
        title: "Erro",
        message: "Falha ao atualizar.",
        read: false,
        timestamp: Date.now(),
      })
    } finally {
      setUpdatingId(null)
    }
  }

  const handlePublishAll = async () => {
    const unpublished = products.filter((p) => !p.published)
    if (unpublished.length === 0) return

    if (!window.confirm(`Deseja publicar todos os ${unpublished.length} produtos ocultos?`)) return

    setLoading(true)
    try {
      const updates = unpublished.map((p) => {
        if (p.id) {
          return updateAsset(p.id, { published: true })
        }
        return Promise.resolve()
      })

      await Promise.all(updates)
      setProducts((prev) => prev.map((p) => ({ ...p, published: true })))

      addNotification({
        id: Date.now().toString(),
        type: "success",
        title: "Sucesso",
        message: `${unpublished.length} produtos foram publicados na loja!`,
        read: false,
        timestamp: Date.now(),
      })
    } catch (err: any) {
      console.error("Erro ao publicar todos:", err)
      addNotification({
        id: Date.now().toString(),
        type: "error",
        title: "Erro Parcial",
        message: "Alguns produtos podem não ter sido atualizados.",
        read: false,
        timestamp: Date.now(),
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenStore = () => {
    // Usa a função dedicada para definir o viewingStoreId corretamente no App
    onPreviewStore()
  }

  // --- SHARE LOGIC ---
  const storeLink = `${window.location.origin}?store=${currentUser.id}&view=public-store`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(storeLink)
    addNotification({
      id: Date.now().toString(),
      type: "success",
      title: "Copiado",
      message: "Link da loja copiado!",
      read: false,
      timestamp: Date.now(),
    })
  }

  const handleNativeShare = async () => {
    const shareData = {
      title: storeName || "Minha Loja Espelho Meu",
      text: `Confira minha vitrine virtual e experimente os looks agora!`,
      url: storeLink,
    }

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        console.log("Share canceled")
      }
    } else {
      handleCopyLink()
    }
  }

  // --- APPEARANCE HANDLERS ---

  const saveAppearanceConfig = async (newLogo?: string, newBanners?: string[], newName?: string) => {
    setIsSavingAppearance(true)
    const finalLogo = newLogo !== undefined ? newLogo : logoPreview
    const finalBanners = newBanners !== undefined ? newBanners : banners
    const finalName = newName !== undefined ? newName : storeName

    try {
      await updateUserProfile(currentUser.id, {
        storeConfig: {
          ...currentUser.storeConfig,
          isSalesPageEnabled: true,
          storeName: finalName,
          storeLogo: finalLogo,
          storeBanner: JSON.stringify(finalBanners),
          storeStyle: storeStyle,
          socialLinks: {
            instagram,
            tiktok,
            pinterest,
          },
          whatsapp,
        },
      })
      return true
    } catch (err: any) {
      console.error("Erro ao salvar aparência:", err)
      addNotification({
        id: Date.now().toString(),
        type: "error",
        title: "Erro de Salvamento",
        message: err.message || "Falha ao atualizar loja.",
        read: false,
        timestamp: Date.now(),
      })
      return false
    } finally {
      setIsSavingAppearance(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsSavingAppearance(true)
      try {
        const file = e.target.files[0]
        const { publicUrl } = await uploadBlobToStorage(file, currentUser.id, "uploads")

        if (publicUrl) {
          setLogoPreview(publicUrl)
          const success = await saveAppearanceConfig(publicUrl, undefined, undefined)
          if (success)
            addNotification({
              id: Date.now().toString(),
              type: "success",
              title: "Logo Atualizado",
              message: "Sua marca foi salva.",
              read: false,
              timestamp: Date.now(),
            })
        }
      } catch (err) {
        addNotification({
          id: Date.now().toString(),
          type: "error",
          title: "Erro",
          message: "Falha no upload do logo.",
          read: false,
          timestamp: Date.now(),
        })
        setIsSavingAppearance(false)
      }
    }
  }

  const handleAddBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > 10 * 1024 * 1024) {
        addNotification({
          id: Date.now().toString(),
          type: "error",
          title: "Arquivo Grande",
          message: "Máximo 10MB.",
          read: false,
          timestamp: Date.now(),
        })
        return
      }

      setIsSavingAppearance(true)
      try {
        const { publicUrl } = await uploadBlobToStorage(file, currentUser.id, "banners")

        if (publicUrl) {
          const newBanners = [...banners, publicUrl]
          setBanners(newBanners)
          const success = await saveAppearanceConfig(undefined, newBanners, undefined)
          if (success)
            addNotification({
              id: Date.now().toString(),
              type: "success",
              title: "Banner Adicionado",
              message: "Carrossel atualizado.",
              read: false,
              timestamp: Date.now(),
            })
        }
      } catch (err: any) {
        addNotification({
          id: Date.now().toString(),
          type: "error",
          title: "Erro no Upload",
          message: err.message,
          read: false,
          timestamp: Date.now(),
        })
        setIsSavingAppearance(false)
      } finally {
        if (bannerInputRef.current) bannerInputRef.current.value = ""
      }
    }
  }

  const handleRemoveBanner = async (indexToRemove: number) => {
    if (!window.confirm("Remover este banner?")) return
    const newBanners = banners.filter((_, index) => index !== indexToRemove)
    setBanners(newBanners)
    await saveAppearanceConfig(undefined, newBanners, undefined)
    addNotification({
      id: Date.now().toString(),
      type: "info",
      title: "Banner Removido",
      message: "Atualizado.",
      read: false,
      timestamp: Date.now(),
    })
  }

  const handlePublishPage = async () => {
    const success = await saveAppearanceConfig(undefined, undefined, storeName)
    if (success) {
      addNotification({
        id: Date.now().toString(),
        type: "success",
        title: "Página Publicada",
        message: "Sua loja está online!",
        read: false,
        timestamp: Date.now(),
      })
    }
  }

  const filteredProducts =
    activeCategory === "Todos" ? products : products.filter((p) => (p.category || "Outros") === activeCategory)
  const categories = ["Todos", ...Array.from(new Set(products.map((p) => p.category || "Outros")))]

  return (
    <div className="flex flex-col h-full animate-[fadeIn_0.5s] max-w-7xl mx-auto w-full relative">
      {/* SHARE MODAL */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsShareModalOpen(false)}
          ></div>
          <div className="relative bg-[#0f0518] border border-theme-accent/30 rounded-2xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(255,215,0,0.2)] animate-[zoomIn_0.3s_ease-out]">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-theme-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-theme-accent/30">
                <svg className="w-8 h-8 text-theme-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2 font-serif">Divulgar Loja</h3>
              <p className="text-gray-400 text-xs">
                Compartilhe o link da sua vitrine com seus clientes. Eles poderão ver e comprar sem cadastro.
              </p>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-xl p-4 mb-6 flex items-center gap-3">
              <p className="text-white text-xs truncate flex-1 font-mono">{storeLink}</p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleCopyLink}
                className="flex-1 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                  />
                </svg>
                Copiar
              </button>
              <button
                onClick={handleNativeShare}
                className="flex-1 py-3 gold-gradient-bg text-black rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg hover:shadow-[0_0_20px_rgba(255,215,0,0.3)] flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                Compartilhar
              </button>
            </div>

            <button
              onClick={() => setIsShareModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white p-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
        <div>
          <h2 className="text-3xl font-serif font-bold text-white mb-2">Painel da Loja</h2>
          <p className="text-gray-400 text-sm font-light">Gerencie aparência, produtos e pedidos.</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="px-5 py-2.5 rounded-xl border border-theme-accent/50 text-theme-accent hover:bg-theme-accent/10 transition-all font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_15px_rgba(255,215,0,0.1)]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            Divulgar Link
          </button>
          <Button
            onClick={() => {
              // Open store in new tab at /loja/[storeId]
              window.open(`/loja/${currentUser.id}`, "_blank")
            }}
            className="gold-gradient-bg text-black font-semibold hover:opacity-90"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Visualizar Loja
          </Button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-4 mb-8 border-b border-white/10">
        {[
          { id: "products", label: "Vitrine" },
          { id: "appearance", label: "Aparência" },
          { id: "orders", label: "Vendas" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`pb-4 px-4 text-sm font-bold uppercase tracking-wider border-b-2 transition-all ${activeTab === tab.id ? "border-theme-accent text-theme-accent" : "border-transparent text-gray-500 hover:text-white"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 bg-white/5 rounded-2xl border border-white/10 p-6 overflow-hidden flex flex-col">
        {/* --- PRODUCTS TAB --- */}
        {activeTab === "products" && (
          <div className="flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div className="flex gap-2 overflow-x-auto gold-scrollbar">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${activeCategory === cat ? "bg-theme-accent text-black" : "bg-black/40 text-gray-400 hover:text-white"}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <button
                onClick={handlePublishAll}
                className="hidden md:flex bg-theme-accent text-black px-4 py-2 rounded-lg text-[10px] uppercase font-bold hover:bg-white hover:scale-105 transition-all items-center gap-2 shadow-lg"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>{" "}
                Publicar Todos
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
              {loading ? (
                <div className="text-center py-20">
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-20 text-gray-500 text-sm">Nenhum produto encontrado.</div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="group relative bg-[#0a0112] rounded-xl overflow-hidden border border-white/10 hover:border-white/30 transition-all"
                    >
                      <div className="aspect-[4/5] relative">
                        <LazyImage
                          src={product.preview}
                          alt={product.name || ""}
                          className={`w-full h-full object-cover transition-opacity ${product.published ? "opacity-100" : "opacity-50 grayscale"}`}
                        />
                        <button
                          onClick={() => handleTogglePublish(product)}
                          className={`absolute top-2 right-2 p-2 rounded-full shadow-lg ${product.published ? "bg-green-500 text-black" : "bg-red-500/80 text-white"} hover:scale-110 transition-transform`}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </button>
                      </div>
                      {/* Added product details */}
                      <div className="p-3">
                        <p className="text-white text-xs font-bold truncate">{product.name}</p>
                        <p className="text-gray-400 text-[10px]">{product.category}</p>
                        <p className="text-theme-accent text-xs font-bold mt-1">R$ {(product.price || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- APPEARANCE TAB --- */}
        {activeTab === "appearance" && (
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold text-white">Identidade Visual</h3>
              <button
                onClick={handlePublishPage}
                disabled={isSavingAppearance}
                className="bg-green-500 text-black px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-green-400 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingAppearance ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mb-2"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {isSavingAppearance ? "Salvando..." : "Publicar Página"}
              </button>
            </div>

            <div className="space-y-12 pb-10">
              {/* Banners Section */}
              <div>
                <div className="flex justify-between items-end mb-3">
                  <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider">
                    Carrossel de Banners (Capa)
                  </label>
                  <span className="text-xs text-gray-500">{banners.length} imagens ativas</span>
                </div>

                <div className="flex flex-col lg:flex-row gap-6 items-start">
                  {/* Upload Button */}
                  <div
                    className="w-full lg:w-1/3 aspect-video rounded-xl border-2 border-dashed border-white/20 hover:border-theme-accent/50 bg-black/40 relative overflow-hidden group cursor-pointer transition-all flex flex-col items-center justify-center text-center p-4 hover:bg-white/5 flex-shrink-0"
                    onClick={() => !isSavingAppearance && bannerInputRef.current?.click()}
                  >
                    {isSavingAppearance ? (
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 border-2 border-theme-accent border-t-transparent rounded-full animate-spin mb-2"></div>
                        <span className="text-[10px] uppercase font-bold text-theme-accent animate-pulse">
                          Enviando...
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-2 text-theme-accent group-hover:scale-110 transition-transform">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <span className="text-xs uppercase tracking-widest font-bold text-white">Novo Banner</span>
                        <span className="text-[10px] text-gray-500 mt-1">1920x600px</span>
                      </>
                    )}
                    <input
                      type="file"
                      ref={bannerInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleAddBanner}
                      disabled={isSavingAppearance}
                    />
                  </div>

                  {/* Existing Banners */}
                  <div className="flex-1 w-full grid grid-cols-2 md:grid-cols-3 gap-3">
                    {banners.map((url, idx) => (
                      <div
                        key={idx}
                        className="aspect-video rounded-lg border border-white/10 relative overflow-hidden group bg-black shadow-lg"
                      >
                        <LazyImage
                          src={url}
                          alt={`Banner ${idx}`}
                          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                        />
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemoveBanner(idx)
                            }}
                            className="p-1.5 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-colors transform hover:scale-110"
                            title="Remover Banner"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                        <div className="absolute bottom-1 left-1 bg-black/60 px-1.5 py-0.5 rounded text-[9px] font-mono text-white backdrop-blur-sm pointer-events-none z-10">
                          {idx + 1}
                        </div>
                      </div>
                    ))}
                    {banners.length === 0 && (
                      <div className="col-span-full h-full flex items-center justify-center text-gray-500 text-xs italic py-10 border border-white/5 rounded-xl bg-white/5">
                        Nenhum banner ativo. Adicione imagens para o carrossel.
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-gray-500 text-xs mt-2">
                  A ordem de upload define a ordem de exibição no carrossel da loja.
                </p>
              </div>

              <div className="w-full h-[1px] bg-white/10"></div>

              {/* Logo and Store Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Logo da Loja
                  </label>
                  <div
                    className="aspect-square max-w-[200px] rounded-xl border-2 border-dashed border-white/20 hover:border-theme-accent/50 bg-black/40 relative overflow-hidden group cursor-pointer transition-all flex items-center justify-center"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    {logoPreview ? (
                      <LazyImage src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-4">
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-2 text-theme-accent mx-auto group-hover:scale-110 transition-transform">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <span className="text-[10px] uppercase tracking-widest font-bold text-white">
                          Adicionar Logo
                        </span>
                      </div>
                    )}
                    <input
                      type="file"
                      ref={logoInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleLogoUpload}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Nome da Loja
                    </label>
                    <input
                      type="text"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="Digite o nome da sua loja"
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-theme-accent focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Estilo da Loja
                    </label>
                    <select
                      value={storeStyle}
                      onChange={(e) => setStoreStyle(e.target.value as StoreStyleCategory)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-theme-accent focus:outline-none transition-colors"
                    >
                      {STORE_STYLES.map((style) => (
                        <option key={style} value={style}>
                          {style}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                      WhatsApp
                    </label>
                    <input
                      type="text"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="Número do WhatsApp"
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-theme-accent focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="w-full h-[1px] bg-white/10"></div>

              {/* Social Media */}
              <div>
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Redes Sociais</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Instagram</label>
                    <input
                      type="text"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="@sualoja"
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:border-theme-accent focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">TikTok</label>
                    <input
                      type="text"
                      value={tiktok}
                      onChange={(e) => setTiktok(e.target.value)}
                      placeholder="@sualoja"
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:border-theme-accent focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Pinterest</label>
                    <input
                      type="text"
                      value={pinterest}
                      onChange={(e) => setPinterest(e.target.value)}
                      placeholder="@sualoja"
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:border-theme-accent focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- ORDERS TAB --- */}
        {activeTab === "orders" && (
          <div className="animate-[fadeIn_0.5s] flex-1 overflow-y-auto custom-scrollbar">
            {orders.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                </div>
                <h3 className="text-white font-serif text-xl">Sem pedidos ainda.</h3>
                <p className="text-gray-500 text-sm mt-2">Publique seus produtos para começar a vender.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-black/30 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-all"
                  >
                    <div className="flex justify-between items-start mb-4 border-b border-white/5 pb-4">
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">
                          Pedido #{order.id.slice(0, 8)}
                        </p>
                        <p className="text-white font-bold">{order.customer_details?.name || "Cliente"}</p>
                        <p className="text-gray-400 text-xs">{order.customer_details?.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-theme-accent font-bold text-lg">R$ {(order.total_amount || 0).toFixed(2)}</p>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-1 rounded mt-1 inline-block ${order.status === "paid" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}
                        >
                          {order.status === "paid" ? "Pago" : order.status}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-white/5 p-2 rounded-lg">
                          <div className="w-10 h-10 rounded overflow-hidden bg-black">
                            <img
                              src={item.product_image || "/placeholder.svg"}
                              className="w-full h-full object-cover"
                              alt=""
                            />
                          </div>
                          <div className="flex-1">
                            <p className="text-white text-xs font-bold">{item.product_name}</p>
                            <p className="text-gray-500 text-[10px]">Qtd: {item.quantity}</p>
                          </div>
                          <p className="text-white text-xs font-mono">R$ {(item.price_at_purchase || 0).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/5 flex justify-end gap-3">
                      <button className="text-xs text-gray-400 hover:text-white uppercase font-bold tracking-wider">
                        Detalhes
                      </button>
                      <button className="bg-white text-black px-4 py-2 rounded text-xs font-bold uppercase tracking-wider hover:bg-gray-200">
                        Marcar Enviado
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
