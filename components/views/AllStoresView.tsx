"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { getAllStores } from "../../services/storageService"
import LazyImage from "../LazyImage"
import type { StoreStyleCategory } from "../../types"

interface AllStoresViewProps {
  onNavigateToStore: (storeId: string) => void
  onBack: () => void
}

const CATEGORIES: (StoreStyleCategory | "Todos")[] = [
  "Todos",
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

export const AllStoresView: React.FC<AllStoresViewProps> = ({ onNavigateToStore, onBack }) => {
  const [stores, setStores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>("Todos")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"newest" | "popular">("popular")

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const data = await getAllStores()
        setStores(data)
        setError(null)
      } catch (err) {
        console.error("[v0] Error loading stores:", err)
        setError("Banco de dados não configurado")
        setStores([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filteredStores = stores.filter((store) => {
    const matchCategory = activeCategory === "Todos" || store.style === activeCategory
    const matchSearch = store.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCategory && matchSearch
  })

  const sortedStores = [...filteredStores].sort((a, b) => {
    if (sortBy === "newest") return b.id.localeCompare(a.id) // Mock timestamp via ID
    return 0 // Popular seria default
  })

  return (
    <div className="min-h-screen bg-[#05010a] text-white animate-[fadeIn_0.5s] relative overflow-hidden flex flex-col">
      {/* ATMOSPHERE BACKGROUND (Copied from LandingPage/Hero) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 w-full h-[60vh] bg-gradient-to-b from-[#240046] via-[#3c096c] to-transparent opacity-80"></div>
        <div className="absolute top-[-10%] left-1/2 transform -translate-x-1/2 w-[80vw] h-[80vw] bg-luxury-gold/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 w-full h-[50vh] bg-gradient-to-t from-[#0f0219] via-[#150822] to-transparent"></div>
        <div className="absolute bottom-0 w-full h-[40vh] bg-[linear-gradient(to_bottom,transparent_0%,rgba(255,215,0,0.03)_50%,transparent_100%)] bg-[length:100%_4px]"></div>
      </div>

      {/* HEADER - GOLDEN GRADIENT LUXURY */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#AA771C] shadow-[0_10px_40px_rgba(0,0,0,0.5)] py-5 transition-all duration-300 border-b border-[#BF953F]/50">
        <div className="max-w-7xl mx-auto px-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-[#0a0112]/10 rounded-full transition-colors text-[#0a0112]"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </button>
              <h1 className="text-3xl font-serif font-bold text-[#0a0112] tracking-wide drop-shadow-sm">
                Vitrines e Lojas
              </h1>
            </div>

            {/* Search Bar (Dark Text version) */}
            <div className="hidden md:block relative w-96">
              <input
                type="text"
                placeholder="Buscar loja ou marca..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0a0112]/5 border border-[#0a0112]/20 rounded-full py-2.5 pl-10 pr-4 text-sm text-[#0a0112] font-medium placeholder-[#0a0112]/50 focus:border-[#0a0112]/50 focus:bg-[#0a0112]/10 focus:outline-none transition-all shadow-inner"
              />
              <svg
                className="w-4 h-4 text-[#0a0112]/60 absolute left-3.5 top-1/2 -translate-y-1/2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Filters (Contrast Adjusted) */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="w-full overflow-x-auto custom-scrollbar pb-2">
              <div className="flex gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-5 py-2 rounded-full text-xs font-extrabold uppercase tracking-wider whitespace-nowrap transition-all border shadow-sm ${activeCategory === cat ? "bg-[#0a0112] text-[#BF953F] border-[#0a0112] shadow-md transform scale-105" : "bg-transparent text-[#0a0112]/70 border-[#0a0112]/20 hover:border-[#0a0112]/50 hover:text-[#0a0112] hover:bg-[#0a0112]/5"}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4 shrink-0">
              <button
                onClick={() => setSortBy("popular")}
                className={`text-xs font-bold uppercase tracking-wider transition-colors ${sortBy === "popular" ? "text-[#0a0112] underline decoration-2 underline-offset-4" : "text-[#0a0112]/60 hover:text-[#0a0112]"}`}
              >
                Populares
              </button>
              <button
                onClick={() => setSortBy("newest")}
                className={`text-xs font-bold uppercase tracking-wider transition-colors ${sortBy === "newest" ? "text-[#0a0112] underline decoration-2 underline-offset-4" : "text-[#0a0112]/60 hover:text-[#0a0112]"}`}
              >
                Novidades
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT GRID */}
      <div className="flex-grow max-w-7xl mx-auto px-6 py-12 relative z-10 w-full min-h-[50vh]">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-theme-accent border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-center py-20 max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-400">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Banco de Dados Não Configurado</h3>
            <p className="text-gray-400 mb-6 leading-relaxed">
              O banco de dados Supabase está vazio. Para começar a usar a plataforma, você precisa executar os scripts
              SQL de configuração.
            </p>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-left mb-6">
              <h4 className="text-theme-accent font-bold mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Configuração Rápida
              </h4>
              <ol className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-theme-accent font-bold">1.</span>
                  <span>
                    Abra o arquivo{" "}
                    <code className="bg-black/30 px-2 py-0.5 rounded text-theme-accent">DATABASE_SETUP.md</code> na raiz
                    do projeto
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-theme-accent font-bold">2.</span>
                  <span>
                    Execute os scripts SQL na pasta{" "}
                    <code className="bg-black/30 px-2 py-0.5 rounded text-theme-accent">scripts/</code> no Supabase
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-theme-accent font-bold">3.</span>
                  <span>
                    Configure o bucket de storage chamado{" "}
                    <code className="bg-black/30 px-2 py-0.5 rounded text-theme-accent">assets</code>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-theme-accent font-bold">4.</span>
                  <span>Recarregue esta página</span>
                </li>
              </ol>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="bg-theme-accent text-black px-8 py-3 rounded-full font-bold hover:bg-theme-accent/90 transition-colors shadow-lg"
            >
              Recarregar Página
            </button>
          </div>
        ) : sortedStores.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-600">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Nenhuma loja encontrada</h3>
            <p className="text-gray-500 text-sm">Tente ajustar os filtros ou busque por outro termo.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedStores.map((store, i) => (
              <div
                key={store.id}
                onClick={() => onNavigateToStore(store.id)}
                className="group glass-card-block p-0 rounded-2xl overflow-hidden cursor-pointer hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(var(--color-accent),0.1)] transition-all duration-500 bg-[#0a0112]/40 backdrop-blur-md border border-white/10"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {/* Cover Banner */}
                <div className="h-32 bg-gray-800 relative overflow-hidden">
                  {store.banner ? (
                    <LazyImage
                      src={store.banner}
                      alt="Cover"
                      className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-[#1a0b2e] to-[#0f0518]"></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0112] to-transparent"></div>
                </div>

                {/* Store Info */}
                <div className="px-6 pb-6 relative -mt-12 flex flex-col items-center text-center">
                  {/* Logo */}
                  <div className="w-24 h-24 rounded-full border-4 border-[#0a0112] bg-[#0a0112] overflow-hidden shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300">
                    {store.logo ? (
                      <LazyImage src={store.logo} alt={store.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-theme-accent flex items-center justify-center text-black font-bold text-2xl">
                        {store.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  <h3 className="text-xl font-serif font-bold text-white mb-1 group-hover:text-theme-accent transition-colors">
                    {store.name}
                  </h3>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mb-4 border border-white/10 px-3 py-1 rounded-full inline-block">
                    {store.style || "Variado"}
                  </p>

                  <div className="w-full pt-4 border-t border-white/5 flex justify-between items-center text-xs text-gray-500 font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                      Ver Perfil
                    </span>
                    <span className="group-hover:translate-x-1 transition-transform text-theme-accent">Visitar →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FOOTER (UNIFORM WITH PUBLIC STORE) */}
      <footer className="mt-auto py-10 border-t border-theme-accent/20 bg-gradient-to-b from-theme-accent/20 to-[#05010a] relative overflow-hidden backdrop-blur-sm z-10 w-full flex-shrink-0">
        {/* Decorative Top Line Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-theme-accent/50 to-transparent shadow-[0_0_20px_var(--color-accent)]"></div>

        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 text-center md:text-left">
            {/* Column 1: Links (Optional Left Side) */}
            <div className="flex gap-6 justify-center md:justify-start text-[10px] uppercase tracking-widest font-bold text-gray-500">
              <span className="hover:text-white transition-colors cursor-pointer flex items-center gap-1 hover:underline decoration-theme-accent/50">
                Termos
              </span>
              <span className="hover:text-white transition-colors cursor-pointer flex items-center gap-1 hover:underline decoration-theme-accent/50">
                Privacidade
              </span>
            </div>

            {/* Column 2: Center Copyright */}
            <div className="flex justify-center w-full">
              <p className="text-[10px] text-gray-500">© 2025 Todos os direitos reservados Vitrine Global</p>
            </div>

            {/* Column 3: Right Aligned Espelho Meu Link */}
            <div className="flex justify-center md:justify-end w-full">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-[10px] text-gray-500 hover:text-white transition-colors group uppercase tracking-widest font-bold"
              >
                Conheça a{" "}
                <span className="text-yellow-500 group-hover:text-yellow-400 transition-colors">Espelho Meu</span>
                <svg
                  className="w-3 h-3 text-gray-600 group-hover:text-white transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
