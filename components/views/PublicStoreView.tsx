"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { ImageAsset, User, CartItem } from "../../types"
import LazyImage from "../LazyImage"
import { getAssets, getStoreProfile, getStoreBannersFromStorage } from "../../services/storageService"
import { ProductDetailView } from "./ProductDetailView"
import { X } from "lucide-react"

interface PublicStoreViewProps {
  storeId: string
  onNavigate: (view: any) => void
  onTryOn: (product: ImageAsset) => void
  onAddToCart: (product: ImageAsset) => void
  onRemoveFromCart: (cartId: string) => void
  cart: CartItem[]
  currentUser: User | null
}

const getBanners = (bannerData: any): string[] => {
  if (!bannerData) return []
  if (Array.isArray(bannerData)) return bannerData.filter(Boolean)
  if (typeof bannerData === "string") {
    // Tenta parsear como JSON primeiro
    try {
      const parsed = JSON.parse(bannerData)
      if (Array.isArray(parsed)) return parsed.filter(Boolean)
      // Se parseou mas não é array, retorna como único item
      return [parsed.toString()]
    } catch {
      // Se não é JSON, assume que é URL direta
      return bannerData.length > 5 ? [bannerData] : []
    }
  }
  return []
}

export const PublicStoreView: React.FC<PublicStoreViewProps> = ({
  storeId,
  onNavigate,
  onTryOn,
  onAddToCart,
  onRemoveFromCart,
  cart,
  currentUser,
}) => {
  const [products, setProducts] = useState<ImageAsset[]>([])
  const [storeProfile, setStoreProfile] = useState<{
    name: string
    logo: string
    banner: string
    whatsapp: string
    socialLinks?: any
  } | null>(null)
  const [activeCategory, setActiveCategory] = useState("Todos")
  const [priceRange, setPriceRange] = useState(1000)
  const [loading, setLoading] = useState(true)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [wishlist, setWishlist] = useState<Set<string>>(new Set())
  const [showWishlistOnly, setShowWishlistOnly] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ImageAsset | null>(null)
  const [showCartSummary, setShowCartSummary] = useState(false)
  const [addedFeedback, setAddedFeedback] = useState<string | null>(null)
  const [banners, setBanners] = useState<string[]>([])
  const [currentSlide, setCurrentSlide] = useState(0)

  const defaultCategories = ["Todos", "Roupa", "Acessório", "Calçado", "Outro"]
  const dynamicCategories = Array.from(new Set(products.map((p) => p.category || "Outros"))).filter(
    (c: string) => !defaultCategories.includes(c),
  )
  const categories = [...defaultCategories, ...dynamicCategories]

  const filteredProducts = products.filter((p) => {
    const matchCategory = activeCategory === "Todos" || (p.category || "Outros") === activeCategory
    const matchWishlist = !showWishlistOnly || wishlist.has(p.id!)
    const matchPrice = (p.price || 0) <= priceRange
    return matchCategory && matchWishlist && matchPrice
  })

  useEffect(() => {
    const fetchStore = async () => {
      setLoading(true)
      try {
        console.log("[v0] PublicStoreView: Fetching store data for:", storeId)

        const [profile, assets] = await Promise.all([
          getStoreProfile(storeId),
          getAssets("product", storeId, true), // Pass true to filter only published
        ])

        console.log("[v0] PublicStoreView: Store profile loaded:", profile)
        console.log("[v0] PublicStoreView: Published assets fetched:", assets.length, "assets")

        setStoreProfile(profile as any)
        setProducts(assets)
        console.log("[v0] PublicStoreView: Products set:", assets.length, "products")

        const rawBanner = profile?.banner || ""
        console.log("[v0] PublicStoreView: Raw banner data:", rawBanner, typeof rawBanner)

        const profileBanners = getBanners(rawBanner)
        console.log("[v0] PublicStoreView: Parsed banners:", profileBanners)

        if (profileBanners.length > 0) {
          setBanners(profileBanners)
          console.log("[v0] PublicStoreView: Banners loaded successfully:", profileBanners.length, "banners")
        } else {
          console.log("[v0] PublicStoreView: No banners in profile, trying storage...")
          const storageBanners = await getStoreBannersFromStorage(storeId)
          console.log("[v0] PublicStoreView: Storage banners found:", storageBanners.length)

          if (storageBanners.length > 0) {
            setBanners(storageBanners)
          } else {
            console.log("[v0] PublicStoreView: No banners found, using empty array")
            setBanners([])
          }
        }
      } catch (err) {
        console.error("[v0] PublicStoreView: Error fetching store:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchStore()
  }, [storeId])

  useEffect(() => {
    if (banners.length <= 1) return
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [banners.length])

  useEffect(() => {
    console.log("[v0] PublicStoreView: Filter check - products:", products.length)
    console.log("[v0] PublicStoreView: Active category:", activeCategory)
    console.log("[v0] PublicStoreView: Max price:", priceRange)
    console.log("[v0] PublicStoreView: Show wishlist only:", showWishlistOnly)
    console.log("[v0] PublicStoreView: Filtered products count:", filteredProducts.length)
    if (products.length > 0) {
      console.log("[v0] PublicStoreView: First product:", products[0])
    }
  }, [products, activeCategory, priceRange, showWishlistOnly])

  const toggleWishlist = (id: string) => {
    const newSet = new Set(wishlist)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setWishlist(newSet)
  }

  const handleShareProduct = async (e: React.MouseEvent, product: ImageAsset) => {
    e.stopPropagation()
    const shareData = {
      title: product.name,
      text: `Olha essa peça incrível da ${storeProfile?.name || "loja"}: ${product.name}`,
      url: window.location.href,
    }
    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData)
      } catch (err) {}
    } else {
      navigator.clipboard.writeText(`${shareData.text} ${window.location.href}`)
      alert("Link copiado para a área de transferência!")
    }
  }

  const handleSupportClick = () => {
    if (storeProfile?.whatsapp) {
      const number = storeProfile.whatsapp.replace(/\D/g, "")
      window.open(`https://wa.me/${number}`, "_blank")
    } else {
      alert("WhatsApp não configurado pela loja.")
    }
  }

  const handleAddToCartWithFeedback = (e: React.MouseEvent, product: ImageAsset) => {
    e.stopPropagation()
    onAddToCart(product)
    setAddedFeedback(product.id!)
    setTimeout(() => setAddedFeedback(null), 2000)
  }

  const handleAddToCartFromModal = (product: ImageAsset) => {
    onAddToCart(product)
    setAddedFeedback(product.id!)
    setTimeout(() => setAddedFeedback(null), 2000)
    setSelectedProduct(null)
  }

  const handleTryOnWithStop = (e: React.MouseEvent, product: ImageAsset) => {
    e.stopPropagation()
    onTryOn(product)
  }

  const handleProductClick = (product: ImageAsset) => {
    setSelectedProduct(product)
  }

  const openCart = () => {
    setShowCartSummary(true)
  }

  const storeName = storeProfile?.name || "Nossa Loja"
  const cartTotal = cart.reduce((acc, item) => acc + (item.price || 0), 0)
  const discountAmount = cartTotal > 300 ? cartTotal * 0.1 : 0
  const shippingThreshold = 299
  const shippingCost = cartTotal > shippingThreshold ? 0 : 25.0
  const estimatedTotal = cartTotal - discountAmount + shippingCost
  const shippingProgress = Math.min((cartTotal / shippingThreshold) * 100, 100)
  const deliveryDate = new Date()
  deliveryDate.setDate(deliveryDate.getDate() + 5)
  const deliveryDateString = deliveryDate.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })
  const upsellProducts = products
    .filter((p) => !cart.some((c) => c.id === p.id))
    .sort(() => 0.5 - Math.random())
    .slice(0, 4)

  return (
    <>
      {/* Loading State */}
      {loading && (
        <div className="min-h-screen flex items-center justify-center bg-theme-bg-primary">
          <div className="w-8 h-8 border-2 border-theme-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Main Store Container */}
      <div className="min-h-screen bg-theme-bg-primary pb-0 font-sans text-theme-text-primary animate-[fadeIn_0.5s] relative flex flex-col">
        {selectedProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-theme-bg-primary/70 backdrop-blur-md animate-[fadeIn_0.2s]">
            <div className="relative w-full max-w-5xl h-[85vh] md:h-[80vh] flex overflow-hidden rounded-3xl shadow-2xl animate-[zoomIn_0.3s] bg-theme-card-bg">
              <ProductDetailView
                product={selectedProduct}
                storeName={storeName}
                onBack={() => setSelectedProduct(null)}
                onAddToCart={handleAddToCartFromModal}
                onTryOn={onTryOn}
              />
            </div>
          </div>
        )}

        {showCartSummary && (
          <div className="fixed inset-0 z-[110] flex justify-end animate-[fadeIn_0.2s]">
            {/* Close Button Overlay */}
            <div
              onClick={() => setShowCartSummary(false)}
              className="absolute inset-0 bg-theme-bg-primary/80 backdrop-blur-sm"
              aria-label="Fechar visualização"
            />

            {/* Cart Sidebar */}
            <div className="relative w-full max-w-md md:max-w-lg bg-theme-card-bg h-full shadow-2xl flex flex-col animate-[slideInRight_0.3s]">
              {/* Cart Header */}
              <div className="p-6 border-b border-theme-border-secondary flex justify-between items-center bg-theme-card-bg">
                <div>
                  <h2 className="text-xl font-serif font-bold text-theme-text-primary">Minha Sacola</h2>
                  <p className="text-xs text-theme-text-muted">{cart.length} itens selecionados</p>
                </div>
                <button
                  onClick={() => setShowCartSummary(false)}
                  className="p-2 hover:bg-theme-hover-bg rounded-full transition-colors text-theme-text-muted hover:text-theme-text-primary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Shipping Progress Bar */}
              <div className="px-6 py-4 bg-theme-bg-tertiary border-b border-theme-border-secondary">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-theme-text-primary">
                    {shippingCost === 0
                      ? "Parabéns! Frete Grátis Liberado"
                      : `Faltam R$ ${(shippingThreshold - cartTotal).toFixed(2)} para Frete Grátis`}
                  </span>
                  <span className="text-[10px] font-bold text-theme-text-muted">{Math.round(shippingProgress)}%</span>
                </div>
                <div className="w-full h-1.5 bg-theme-border-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${shippingCost === 0 ? "bg-green-500" : "bg-theme-accent-primary"}`}
                    style={{ width: `${Math.min(shippingProgress, 100)}%` }}
                  />
                </div>
              </div>

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto gold-scrollbar p-6 bg-theme-bg-secondary/50">
                {cart.length > 0 ? (
                  <div className="space-y-4 mb-8">
                    {cart.map((item, idx) => (
                      <div
                        key={`${item.id}-${idx}`}
                        className="flex gap-4 p-4 border border-theme-border-secondary rounded-xl bg-theme-card-bg shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="w-20 h-24 bg-theme-bg-tertiary rounded-lg overflow-hidden flex-shrink-0 border border-theme-border-secondary">
                          <LazyImage src={item.preview} alt={item.name || ""} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start">
                              <p className="text-sm font-bold text-theme-text-primary truncate pr-4">{item.name}</p>
                              <button
                                onClick={() => onRemoveFromCart(item.cartId)}
                                className="text-theme-text-muted hover:text-red-500 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
                                title="Remover Item"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16l1 12H4L5 9z"
                                  />
                                </svg>
                              </button>
                            </div>
                            <p className="text-xs text-theme-text-muted mb-1">{item.category}</p>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold bg-theme-bg-tertiary px-2 py-1 rounded text-theme-text-secondary">
                              Qtd: 1
                            </span>
                            <p className="text-sm font-bold text-theme-text-primary">R$ {item.price?.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 bg-theme-bg-tertiary rounded-full flex items-center justify-center mb-4 text-theme-text-muted">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-theme-text-primary">Sua sacola está vazia</h3>
                    <p className="text-sm text-theme-text-muted mt-1">Explore nossas coleções e adicione itens.</p>
                  </div>
                )}

                {/* Financial Summary */}
                {cart.length > 0 && (
                  <div className="bg-theme-card-bg rounded-xl p-6 border border-theme-border-secondary shadow-sm space-y-3 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-theme-border-secondary via-transparent to-transparent pointer-events-none"></div>

                    <h3 className="text-xs font-bold uppercase tracking-widest text-theme-text-muted mb-4">
                      Resumo Financeiro
                    </h3>

                    <div className="flex justify-between text-sm text-theme-text-secondary">
                      <span>Subtotal ({cart.length} itens)</span>
                      <span className="font-medium">R$ {cartTotal.toFixed(2)}</span>
                    </div>

                    {discountAmount > 0 && (
                      <div className="flex justify-between text-sm text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                            />
                          </svg>{" "}
                          Desconto Aplicado
                        </span>
                        <span className="font-bold">- R$ {discountAmount.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm text-theme-text-secondary">
                      <span>Frete</span>
                      <span className={shippingCost === 0 ? "text-green-600 font-bold" : ""}>
                        {shippingCost === 0 ? "GRÁTIS" : `R$ ${shippingCost.toFixed(2)}`}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm text-theme-text-secondary">
                      <span>Entrega Estimada</span>
                      <span className="font-bold text-theme-text-primary flex items-center gap-1">
                        <svg
                          className="w-3 h-3 text-theme-text-muted"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                          />
                        </svg>{" "}
                        {deliveryDateString}
                      </span>
                    </div>

                    <div className="border-t border-dashed border-theme-border-primary my-4"></div>

                    <div className="flex justify-between items-end">
                      <span className="text-base font-bold text-theme-text-primary uppercase tracking-wider">
                        Total Final
                      </span>
                      <div className="text-right">
                        <span className="text-2xl font-serif font-bold text-theme-text-primary block leading-none">
                          R$ {estimatedTotal.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-theme-text-muted">Em até 12x sem juros</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Trust Badges */}
                <div className="flex justify-center gap-4 mt-6 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                  <div className="flex flex-col items-center">
                    <svg className="w-6 h-6 text-green-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    <span className="text-[9px] font-bold uppercase text-theme-text-muted">Compra Segura</span>
                  </div>
                  <div className="w-[1px] h-8 bg-theme-border-secondary"></div>
                  <div className="flex flex-col items-center">
                    <svg className="w-6 h-6 text-blue-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-[9px] font-bold uppercase text-theme-text-muted">Qualidade Garantida</span>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-theme-border-primary bg-theme-card-bg shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-20">
                <button
                  onClick={() => cart.length > 0 && onNavigate("checkout")}
                  className="w-full gold-gradient-bg py-4 rounded-xl font-bold uppercase tracking-widest hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                  disabled={cart.length === 0}
                >
                  <span className="relative z-10">Fechar Pedido • R$ {estimatedTotal.toFixed(2)}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <header className="sticky top-0 z-50 bg-theme-card-bg/95 backdrop-blur-md shadow-sm border-b border-theme-border-secondary transition-all">
          <div className="gold-gradient-bg text-[10px] py-1.5 text-center uppercase tracking-widest font-bold">
            Envio para todo o Brasil | Frete Grátis acima de R$ 299
          </div>

          <div className="max-w-[1920px] mx-auto px-4 lg:px-8 h-20 flex items-center justify-between gap-4 md:gap-8">
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => {
                setActiveCategory("Todos")
                setShowWishlistOnly(false)
              }}
            >
              {storeProfile?.logo ? (
                <img
                  src={storeProfile.logo || "/placeholder.svg"}
                  className="w-10 h-10 object-contain rounded-full border border-theme-border-secondary"
                  alt="Logo"
                />
              ) : (
                <div className="w-10 h-10 gold-gradient-bg flex items-center justify-center font-bold text-lg rounded-full">
                  {storeName.charAt(0)}
                </div>
              )}
              <h1 className="text-lg md:text-2xl font-serif font-bold tracking-tight text-theme-text-primary truncate max-w-[150px] md:max-w-none">
                {storeName}
              </h1>
            </div>

            <div className="hidden md:flex flex-1 max-w-lg relative">
              <input
                type="text"
                placeholder="Buscar peças..."
                className="w-full bg-theme-input-bg border-none rounded-full py-2.5 pl-5 pr-12 text-sm focus:ring-1 focus:ring-theme-accent-primary outline-none transition-all text-theme-text-primary placeholder:text-theme-text-muted"
              />
              <button className="absolute right-1 top-1 p-1.5 gold-gradient-bg rounded-full hover:opacity-90 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-4 md:gap-6 text-theme-text-primary">
              {/* User Menu */}
              <div
                className="relative group hidden sm:block"
                onMouseEnter={() => setShowUserMenu(true)}
                onMouseLeave={() => setShowUserMenu(false)}
              >
                <button className="hover:text-theme-text-secondary transition-colors py-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-64 z-50 animate-[fadeIn_0.2s]">
                    <div className="bg-theme-card-bg border border-theme-border-primary shadow-xl rounded-lg overflow-hidden py-2">
                      {!currentUser ? (
                        <div className="px-4 py-3 border-b border-theme-border-secondary">
                          <p className="text-xs text-theme-text-muted mb-2">Bem-vindo à {storeName}</p>
                          <button
                            onClick={() => onNavigate("auth")}
                            className="w-full gold-gradient-bg text-xs font-bold py-2 rounded uppercase tracking-wider hover:opacity-90"
                          >
                            Cadastrar / Entrar
                          </button>
                        </div>
                      ) : (
                        <div className="px-4 py-3 border-b border-theme-border-secondary bg-theme-bg-tertiary">
                          <p className="text-xs font-bold text-theme-text-primary">Olá, {currentUser.name}</p>
                        </div>
                      )}
                      <a href="#" className="block px-4 py-2 text-sm hover:bg-theme-hover-bg text-theme-text-secondary">
                        Meus Pedidos
                      </a>
                      {currentUser && (
                        // Changed from border-t text-red-500 to theme-aware
                        <button
                          onClick={() => onNavigate("landing")}
                          className="block w-full text-left px-4 py-2 text-sm hover:bg-theme-hover-bg text-red-500 border-t border-theme-border-secondary mt-1"
                        >
                          Sair
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Wishlist */}
              {/* Changed from text-red-500 to theme-aware */}
              <button
                onClick={() => setShowWishlistOnly(!showWishlistOnly)}
                className={`hover:text-red-500 transition-colors relative ${showWishlistOnly ? "text-red-500" : "text-theme-text-primary"}`}
              >
                <svg
                  className="w-6 h-6"
                  fill={showWishlistOnly ? "currentColor" : "none"}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                {wishlist.size > 0 && (
                  // Changed from bg-red-500 text-white to theme-aware
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {wishlist.size}
                  </span>
                )}
              </button>

              {/* Cart Icon */}
              <button
                onClick={openCart}
                className="hover:text-theme-text-secondary transition-colors relative py-2 group"
              >
                <div className="relative">
                  <svg
                    className="w-6 h-6 group-hover:scale-110 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                  {cart.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-black text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-[bounce_0.3s] border-2 border-white">
                      {cart.length}
                    </span>
                  )}
                </div>
              </button>

              {/* WhatsApp Support */}
              {/* Changed from hover:text-green-600 to theme-aware */}
              <button
                onClick={handleSupportClick}
                className="hover:text-theme-accent-primary transition-colors hidden sm:block"
                title="Atendimento via WhatsApp"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
                  />
                </svg>
              </button>
            </div>
          </div>
        </header>

        <div className="relative w-full h-[300px] md:h-[450px] overflow-hidden bg-gray-100 group flex-shrink-0">
          {banners.length > 0 ? (
            <>
              {banners.map((banner, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"}`}
                >
                  <LazyImage src={banner} alt="Banner" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none"></div>
                </div>
              ))}

              {/* Carousel Controls */}
              {banners.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentSlide((prev) => (prev === 0 ? banners.length - 1 : prev - 1))}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full backdrop-blur-md z-20 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setCurrentSlide((prev) => (prev + 1) % banners.length)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full backdrop-blur-md z-20 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
                    {banners.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentSlide(idx)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentSlide ? "bg-white w-6" : "bg-white/50 hover:bg-white/80"}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-gray-900 to-gray-800 flex items-center justify-center text-center px-4">
              <div className="max-w-2xl text-white">
                <h2 className="text-4xl md:text-6xl font-serif font-bold mb-4">Coleção Exclusiva</h2>
                <p className="text-lg font-light tracking-wide uppercase mb-8">
                  Os looks mais vendidos • Enviamos para todo o Brasil
                </p>
                <button className="bg-white text-black px-8 py-3 rounded-full font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors">
                  Comprar Agora
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="sticky top-20 z-40 bg-white border-b border-gray-100 shadow-sm py-4 flex-shrink-0">
          <div className="max-w-[1920px] mx-auto px-4 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Categories Scrollable */}
            <div className="flex-1 overflow-x-auto custom-scrollbar pb-2 md:pb-0">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-widest text-theme-text-muted mr-2 flex-shrink-0">
                  Categorias:
                </span>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`text-sm px-4 py-2 rounded-full whitespace-nowrap transition-all ${activeCategory === cat ? "bg-theme-accent-primary text-white font-bold" : "bg-theme-bg-tertiary text-theme-text-secondary hover:bg-theme-hover-bg"}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter Linear */}
            {/* Changed from border-gray-200 to theme-aware */}
            <div className="flex items-center gap-4 flex-shrink-0 pl-0 md:pl-6 md:border-l border-theme-border-primary">
              <span className="text-xs font-bold uppercase tracking-widest text-theme-text-muted whitespace-nowrap">
                Preço Máx:
              </span>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="2000"
                  step="50"
                  value={priceRange}
                  onChange={(e) => setPriceRange(Number(e.target.value))}
                  // Changed from bg-gray-200 accent-black to theme-aware
                  className="w-32 md:w-48 h-1 bg-theme-border-secondary rounded-lg appearance-none cursor-pointer accent-theme-accent-primary"
                />
                {/* Changed from font-bold to theme-aware */}
                <span className="text-sm font-bold w-16 text-theme-text-primary">R$ {priceRange}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-grow max-w-[1920px] mx-auto px-4 lg:px-8 py-8 w-full">
          <div className="flex justify-between items-center mb-6">
            {/* Changed from uppercase tracking-wide to theme-aware */}
            <h2 className="text-xl font-bold uppercase tracking-wider text-theme-text-primary">
              {showWishlistOnly ? "Meus Favoritos" : activeCategory === "Todos" ? "Novidades" : activeCategory}
            </h2>
            <span className="text-xs text-theme-text-muted">{filteredProducts.length} itens</span>
          </div>

          {filteredProducts.length === 0 ? (
            // Changed from bg-gray-50 to theme-aware
            <div className="text-center py-20 bg-theme-bg-tertiary rounded-xl">
              <p className="text-theme-text-muted">Nenhum produto encontrado com estes filtros.</p>
              {showWishlistOnly && (
                // Changed from text-black underline font-bold to theme-aware
                <button
                  onClick={() => setShowWishlistOnly(false)}
                  className="mt-4 text-theme-accent-primary underline text-sm font-bold"
                >
                  Ver todos os produtos
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-x-6 gap-y-10">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  className="group relative flex flex-col cursor-pointer"
                >
                  {/* Changed from bg-gray-100 to theme-aware */}
                  <div className="aspect-[3/4] bg-theme-bg-tertiary overflow-hidden relative rounded-lg mb-3 shadow-sm hover:shadow-xl transition-shadow duration-300">
                    <LazyImage
                      src={product.preview}
                      alt={product.name || ""}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />

                    {/* Overlay Icons Top Right */}
                    <div className="absolute top-2 right-2 flex flex-col gap-2 z-20">
                      {/* Wishlist Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleWishlist(product.id!)
                        }}
                        // Changed from bg-white/20 backdrop-blur-md hover:bg-white transition-all shadow-sm to theme-aware
                        className="p-2.5 rounded-full bg-white/30 backdrop-blur-md hover:bg-white transition-all shadow-sm group/btn"
                      >
                        <svg
                          className={`w-5 h-5 ${wishlist.has(product.id!) ? "text-red-500 fill-current" : "text-white group-hover/btn:text-red-500 drop-shadow-md"}`}
                          stroke="currentColor"
                          strokeWidth={1.5}
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          />
                        </svg>
                      </button>
                    </div>

                    {/* Share Button (Floating) */}
                    <div className="absolute top-2 left-2 z-20">
                      <button
                        onClick={(e) => handleShareProduct(e, product)}
                        // Changed from bg-black/10 backdrop-blur-sm border border-white/20 hover:bg-black/30 text-white transition-all shadow-sm to theme-aware
                        className="p-2.5 rounded-full bg-black/20 backdrop-blur-sm border border-white/30 hover:bg-black/30 text-white transition-all shadow-sm group/share"
                        title="Compartilhar"
                      >
                        <svg
                          className="w-5 h-5 drop-shadow-md group-hover/share:scale-110 transition-transform"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684m0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                          />
                        </svg>
                      </button>
                    </div>

                    {/* Action Buttons (Hover Desktop / Always visible Mobile) */}
                    {/* Changed from bg-white/95 backdrop-blur-md to theme-aware */}
                    <div className="absolute inset-x-0 bottom-0 bg-theme-card-bg/95 backdrop-blur-md p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex flex-col gap-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                      <button
                        onClick={(e) => handleTryOnWithStop(e, product)}
                        className="w-full gold-gradient-bg text-white text-[10px] font-bold py-2.5 uppercase tracking-widest hover:opacity-90 transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                        EXPERIMENTAR LOOK
                      </button>
                      <button
                        onClick={(e) => handleAddToCartWithFeedback(e, product)}
                        // Changed from border border-black text-black hover:bg-gray-100 to theme-aware
                        className={`w-full border border-theme-accent-primary text-[10px] font-bold py-2.5 uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${addedFeedback === product.id ? "bg-green-600 border-green-600 text-white" : "text-theme-accent-primary hover:bg-theme-accent-primary/10"}`}
                      >
                        {addedFeedback === product.id ? (
                          <>
                            <svg
                              className="w-4 h-4 animate-bounce"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            ADICIONADO
                          </>
                        ) : (
                          "COMPRAR"
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-theme-text-muted mb-1">{product.category}</p>
                    <h3 className="text-sm font-bold text-theme-text-primary truncate">{product.name}</h3>
                    {/* Changed from font-medium to theme-aware */}
                    <p className="text-sm font-medium mt-1 text-theme-text-primary">
                      R$ {product.price?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Floating Cart Button (Mobile) */}
        {cart.length > 0 && (
          // Changed from bg-black text-white shadow-[0_10px_30px_rgba(0,0,0,0.3)] to theme-aware
          <button
            onClick={openCart}
            className="fixed bottom-6 right-6 z-50 gold-gradient-bg text-white p-4 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:scale-110 transition-transform md:hidden animate-[bounce_1s]"
          >
            <div className="relative">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              {/* Changed from bg-red-500 text-white to theme-aware */}
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold border-2 border-black">
                {cart.length}
              </span>
            </div>
          </button>
        )}

        {/* Footer */}
        {/* Changed from bg-black text-white border-t border-gray-800 to theme-aware */}
        <footer className="bg-black text-white pt-16 pb-8 border-t border-theme-border-dark flex-shrink-0">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
            <div>
              {/* Changed from font-serif font-bold text-white text-gray-400 to theme-aware */}
              <h3 className="font-serif font-bold text-xl mb-4 text-white">{storeName}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">Moda de qualidade, estilo sem limites.</p>
            </div>
            <div>
              {/* Changed from font-bold uppercase tracking-wider text-xs text-gray-300 to theme-aware */}
              <h4 className="font-bold uppercase tracking-wider text-xs text-gray-300 mb-4">Atendimento</h4>
              {/* Changed from space-y-2 text-sm text-gray-400 hover:text-white to theme-aware */}
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contato
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Trocas
                  </a>
                </li>
              </ul>
            </div>
            <div>
              {/* Changed from font-bold uppercase tracking-wider text-xs text-gray-300 to theme-aware */}
              <h4 className="font-bold uppercase tracking-wider text-xs text-gray-300 mb-4">Empresa</h4>
              {/* Changed from space-y-2 text-sm text-gray-400 hover:text-white to theme-aware */}
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Sobre Nós
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Carreiras
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Sustentabilidade
                  </a>
                </li>
              </ul>
            </div>
            <div>
              {/* Changed from font-bold uppercase tracking-wider text-xs text-gray-300 to theme-aware */}
              <h4 className="font-bold uppercase tracking-wider text-xs text-gray-300 mb-4">Legal</h4>
              {/* Changed from space-y-2 text-sm text-gray-400 hover:text-white to theme-aware */}
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacidade
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Termos
                  </a>
                </li>
              </ul>
            </div>
            <div>
              {/* Changed from font-bold uppercase tracking-wider text-xs text-gray-300 to theme-aware */}
              <h4 className="font-bold uppercase tracking-wider text-xs text-gray-300 mb-4">Redes Sociais</h4>
              <div className="flex gap-3">
                {/* Changed from w-8 h-8 bg-white/10 rounded-full hover:bg-white/20 to theme-aware */}
                <a
                  href="#"
                  className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                {/* Changed from w-8 h-8 bg-white/10 rounded-full hover:bg-white/20 to theme-aware */}
                <a
                  href="#"
                  className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
          {/* Changed from border-t border-gray-800 to theme-aware */}
          <div className="border-t border-theme-border-dark pt-8 text-center">
            {/* Changed from text-xs text-gray-400 to theme-aware */}
            <p className="text-xs text-gray-400">© 2025 {storeName}. Powered by Espelho Meu.</p>
          </div>
        </footer>
      </div>
    </>
  )
}

export default PublicStoreView
