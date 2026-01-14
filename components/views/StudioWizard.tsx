"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { ImageAsset, TryOnStyle } from "../../types"
import LazyImage from "../LazyImage"
import { StyleSelector } from "../StyleSelector"
import { LoadingOverlay } from "../ui/LoadingOverlay"

interface StudioWizardProps {
  assets: ImageAsset[]
  onNavigate: (view: any) => void
  onAddAsset: () => void
  onGenerate: (product: ImageAsset, model: ImageAsset, style: TryOnStyle, instructions: string) => Promise<void>
  isProcessing: boolean
}

const getStyleInfo = (styleId: TryOnStyle) => {
  const styles = [
    { id: "editorial", label: "Editorial Vogue", desc: "Contraste suave, definição premium." },
    { id: "seda", label: "Seda / Cetim", desc: "Simulação de tecido fluido com brilho." },
    { id: "justa", label: "Anatômica / Justa", desc: "Caimento aderente com sombras profundas." },
    { id: "transparente", label: "Renda / Tule", desc: "Preservação de pele com texturas translúcidas." },
    { id: "casual", label: "Casual Influencer", desc: "Luz natural diurna, cores vivas." },
    { id: "passarela", label: "Passarela", desc: "Iluminação dramática, foco nítido e atitude." },
  ]
  return styles.find((s) => s.id === styleId) || styles[0]
}

export const StudioWizard: React.FC<StudioWizardProps> = ({
  assets,
  onNavigate,
  onAddAsset,
  onGenerate,
  isProcessing,
}) => {
  const [studioStep, setStudioStep] = useState<1 | 2 | 3 | 4>(() => {
    const prod = sessionStorage.getItem("studio_product")
    const mod = sessionStorage.getItem("studio_model")

    if (prod && mod) {
      return 3
    }

    const saved = sessionStorage.getItem("studio_step")
    return saved ? (Number.parseInt(saved) as 1 | 2 | 3 | 4) : 1
  })

  const [selectedProduct, setSelectedProduct] = useState<ImageAsset | null>(() => {
    const saved = sessionStorage.getItem("studio_product")
    return saved ? JSON.parse(saved) : null
  })
  const [selectedModel, setSelectedModel] = useState<ImageAsset | null>(() => {
    const saved = sessionStorage.getItem("studio_model")
    return saved ? JSON.parse(saved) : null
  })
  const [instructions, setInstructions] = useState(() => {
    return sessionStorage.getItem("studio_instructions") || ""
  })

  const [selectedStyle, setSelectedStyle] = useState<TryOnStyle>(() => {
    const savedStyle = localStorage.getItem("espelho_tryon_style")
    return (savedStyle as TryOnStyle) || "editorial"
  })

  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (selectedModel && !selectedProduct && studioStep > 1) {
      setStudioStep(1)
    }
    if (selectedProduct && !selectedModel && studioStep > 2) {
      setStudioStep(2)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("espelho_tryon_style", selectedStyle)
  }, [selectedStyle])

  useEffect(() => {
    sessionStorage.setItem("studio_step", studioStep.toString())
    if (selectedProduct) sessionStorage.setItem("studio_product", JSON.stringify(selectedProduct))
    else sessionStorage.removeItem("studio_product")

    if (selectedModel) sessionStorage.setItem("studio_model", JSON.stringify(selectedModel))
    else sessionStorage.removeItem("studio_model")

    sessionStorage.setItem("studio_instructions", instructions)
  }, [studioStep, selectedProduct, selectedModel, instructions])

  useEffect(() => {
    setSearchTerm("")
  }, [studioStep])

  const currentStyleInfo = getStyleInfo(selectedStyle)

  const handleGenerateClick = async () => {
    console.log("[v0] 🎯 StudioWizard - handleGenerateClick CALLED")
    console.log("[v0] selectedProduct:", selectedProduct)
    console.log("[v0] selectedModel:", selectedModel)
    console.log("[v0] selectedStyle:", selectedStyle)
    console.log("[v0] instructions:", instructions)
    console.log("[v0] isProcessing:", isProcessing)

    if (selectedProduct && selectedModel) {
      console.log("[v0] ✅ Both product and model selected, calling onGenerate...")
      try {
        await onGenerate(selectedProduct, selectedModel, selectedStyle, instructions)
        console.log("[v0] ✅ onGenerate completed successfully")
      } catch (error) {
        console.error("[v0] ❌ Error in onGenerate:", error)
      }
    } else {
      console.log("[v0] ❌ Missing selection - Product:", !!selectedProduct, "Model:", !!selectedModel)
    }
  }

  const handleStep1Next = () => {
    if (!selectedProduct) return
    setStudioStep(2)
  }

  const handleStep2Next = () => {
    if (!selectedModel) return
    if (selectedProduct) {
      setStudioStep(3)
    } else {
      setStudioStep(1)
    }
  }

  const renderStep = (num: number, label: string) => {
    const isActive = studioStep >= num
    const isCurrent = studioStep === num

    return (
      <div
        onClick={() => setStudioStep(num as 1 | 2 | 3 | 4)}
        className={`relative flex items-center gap-3 px-6 py-3 rounded-full border transition-all duration-500 backdrop-blur-md cursor-pointer hover:bg-white/10 ${
          isActive
            ? "border-[#BF953F]/50 bg-[#BF953F]/10 shadow-[0_0_25px_rgba(191,147,63,0.3)]"
            : "border-white/5 bg-white/5 text-gray-500"
        }`}
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
            isActive
              ? "bg-gradient-to-br from-[#BF953F] via-[#FCF6BA] to-[#AA771C] text-black scale-110 shadow-lg"
              : "bg-white/10 text-gray-400"
          }`}
        >
          {isActive && num < studioStep ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            num
          )}
        </div>
        <span className={`text-xs font-bold uppercase tracking-widest ${isActive ? "text-white" : "text-gray-500"}`}>
          {label}
        </span>
        {isCurrent && (
          <div className="absolute inset-0 rounded-full border border-[#BF953F] animate-pulse opacity-40 pointer-events-none"></div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col animate-[fadeIn_0.5s_ease-out]">
      <div className="text-center mb-10 relative z-10">
        <h2 className="text-5xl font-serif text-white mb-2 gold-gradient-text font-bold tracking-tight drop-shadow-lg">
          Atelier Virtual
        </h2>
        <p className="text-theme-textMuted text-xs uppercase tracking-[0.4em]">Sua visão. Nossa criação.</p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 mb-10 relative z-10">
        {renderStep(1, "Peça")}
        <div
          className={`w-12 h-[1px] transition-all duration-500 ${studioStep >= 2 ? "bg-gradient-to-r from-[#BF953F] to-[#AA771C]" : "bg-white/10"}`}
        ></div>
        {renderStep(2, "Modelo")}
        <div
          className={`w-12 h-[1px] transition-all duration-500 ${studioStep >= 3 ? "bg-gradient-to-r from-[#BF953F] to-[#AA771C]" : "bg-white/10"}`}
        ></div>
        {renderStep(3, "Direção")}
        <div
          className={`w-12 h-[1px] transition-all duration-500 ${studioStep >= 4 ? "bg-gradient-to-r from-[#BF953F] to-[#AA771C]" : "bg-white/10"}`}
        ></div>
        {renderStep(4, "Revelação")}
      </div>

      <div className="glass-card-block rounded-3xl p-0 flex-1 relative h-[65vh] overflow-hidden flex flex-col bg-black/20 backdrop-blur-2xl border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.8)]">
        {/* STEP 1: PRODUTO */}
        {studioStep === 1 && (
          <>
            <div className="text-center p-8 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent">
              <h3 className="text-2xl font-serif text-white">O que vamos provar hoje?</h3>
              <p className="text-gray-400 text-sm font-light mt-1 tracking-wide">
                Selecione uma peça de luxo do acervo
              </p>
            </div>

            <div className="px-8 pt-6 pb-4">
              <input
                type="text"
                placeholder="Buscar no acervo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0a0112] border border-white/10 rounded-xl py-4 pl-6 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-theme-accent focus:shadow-[0_0_15px_rgba(255,215,0,0.2)] transition-all text-sm"
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                <div
                  onClick={() => {
                    onNavigate("products")
                    onAddAsset()
                  }}
                  className="aspect-[4/5] border border-dashed border-theme-accent/30 rounded-2xl flex flex-col items-center justify-center text-theme-accent hover:bg-theme-accent/5 cursor-pointer transition-all group"
                >
                  <div className="w-14 h-14 rounded-full bg-theme-accent/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(255,215,0,0.2)]">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest">Adicionar Nova</span>
                </div>
                {assets
                  .filter(
                    (a) =>
                      a.type === "product" &&
                      (searchTerm === "" || (a.name || "").toLowerCase().includes(searchTerm.toLowerCase())),
                  )
                  .map((asset) => (
                    <div
                      key={asset.id}
                      onClick={() => setSelectedProduct(asset)}
                      className={`aspect-[4/5] group cursor-pointer relative rounded-2xl overflow-hidden border transition-all duration-300 ${selectedProduct?.id === asset.id ? "border-theme-accent shadow-[0_0_40px_rgba(255,215,0,0.3)] ring-1 ring-theme-accent scale-105 z-10" : "border-white/10 hover:border-white/30 hover:-translate-y-2"}`}
                    >
                      <LazyImage
                        src={asset.preview}
                        alt={asset.name || "Product"}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>
                      <div className="absolute bottom-0 left-0 right-0 p-5">
                        <p className="text-white text-sm font-bold truncate font-serif">{asset.name}</p>
                        <p className="text-[10px] text-theme-accent uppercase tracking-wider mt-1">
                          {asset.category || "Peça"}
                        </p>
                      </div>
                      {selectedProduct?.id === asset.id && (
                        <div className="absolute top-3 right-3 w-8 h-8 bg-theme-accent text-black rounded-full flex items-center justify-center shadow-lg animate-[bounce_0.5s]">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
            <div className="p-6 border-t border-white/5 flex justify-between items-center bg-[#05010a]/50 backdrop-blur-md">
              <div className="flex-1">
                {selectedModel && (
                  <div className="flex items-center gap-2 text-xs text-theme-secondary/80 bg-theme-secondary/10 px-3 py-1.5 rounded-full w-fit border border-theme-secondary/20 animate-pulse">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>
                      Modelo já selecionado: <strong>{selectedModel.name}</strong>
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={handleStep1Next}
                disabled={!selectedProduct}
                className="gold-gradient-bg text-black px-10 py-4 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg hover:shadow-[0_0_30px_rgba(255,215,0,0.4)] hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100 flex items-center gap-3"
              >
                Continuar
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </>
        )}

        {/* STEP 2: MODELO */}
        {studioStep === 2 && (
          <>
            <div className="text-center p-8 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent">
              <h3 className="text-2xl font-serif text-white">Quem será a musa?</h3>
              <p className="text-gray-400 text-sm font-light mt-1 tracking-wide">
                {selectedModel
                  ? "Confirme a modelo abaixo ou selecione outra."
                  : "Escolha um modelo ou envie sua foto."}
              </p>
            </div>

            <div className="px-8 pt-6 pb-4">
              <input
                type="text"
                placeholder="Buscar modelo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0a0112] border border-white/10 rounded-xl py-4 pl-6 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-theme-secondary focus:shadow-[0_0_15px_rgba(176,38,255,0.2)] transition-all text-sm"
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                <div
                  onClick={() => {
                    onNavigate("models")
                    onAddAsset()
                  }}
                  className="aspect-[4/5] border border-dashed border-theme-secondary/30 rounded-2xl flex flex-col items-center justify-center text-theme-secondary hover:bg-theme-secondary/5 cursor-pointer transition-all group"
                >
                  <div className="w-14 h-14 rounded-full bg-theme-secondary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(176,38,255,0.2)]">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest">Novo Modelo</span>
                </div>
                {assets
                  .filter(
                    (a) =>
                      a.type === "model" &&
                      (searchTerm === "" || (a.name || "").toLowerCase().includes(searchTerm.toLowerCase())),
                  )
                  .map((asset) => (
                    <div
                      key={asset.id}
                      onClick={() => setSelectedModel(asset)}
                      className={`aspect-[4/5] group cursor-pointer relative rounded-2xl overflow-hidden border transition-all duration-300 ${selectedModel?.id === asset.id ? "border-theme-secondary shadow-[0_0_40px_rgba(176,38,255,0.3)] ring-2 ring-theme-secondary scale-105 z-10" : "border-white/10 hover:border-white/30 hover:-translate-y-2"}`}
                    >
                      <LazyImage
                        src={asset.preview}
                        alt={asset.name || "Model"}
                        className="w-full h-full object-cover"
                      />
                      <div
                        className={`absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent transition-opacity ${selectedModel?.id === asset.id ? "opacity-90" : "opacity-60"}`}
                      ></div>
                      <div className="absolute bottom-0 left-0 right-0 p-5">
                        <p className="text-white text-sm font-bold truncate font-serif">{asset.name}</p>
                        <p className="text-[10px] text-theme-secondary uppercase tracking-wider mt-1">Modelo</p>
                      </div>

                      {selectedModel?.id === asset.id && (
                        <>
                          <div className="absolute top-3 right-3 w-8 h-8 bg-theme-secondary text-white rounded-full flex items-center justify-center shadow-lg animate-[bounce_0.5s]">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div className="absolute top-3 left-3 bg-theme-secondary/90 backdrop-blur-md px-3 py-1 rounded-full shadow-lg">
                            <span className="text-[9px] font-bold text-white uppercase tracking-widest">
                              Selecionado
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
              </div>
            </div>
            <div className="p-6 border-t border-white/5 flex justify-between items-center bg-[#05010a]/50 backdrop-blur-md">
              <button
                onClick={() => setStudioStep(1)}
                className="text-gray-400 hover:text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Voltar
              </button>
              <div className="flex items-center gap-4">
                {selectedProduct && (
                  <div className="hidden sm:flex items-center gap-2 text-xs text-theme-accent/80 bg-theme-accent/5 px-3 py-1.5 rounded-full border border-theme-accent/20">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>
                      Peça: <strong>{selectedProduct.name}</strong>
                    </span>
                  </div>
                )}
                <button
                  onClick={handleStep2Next}
                  disabled={!selectedModel}
                  className={`px-10 py-4 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg transition-all flex items-center gap-3 disabled:opacity-50 disabled:scale-100 ${selectedModel ? "gold-gradient-bg text-black hover:scale-105 hover:shadow-[0_0_30px_rgba(255,215,0,0.4)]" : "bg-gray-700 text-gray-400 cursor-not-allowed"}`}
                >
                  {selectedModel ? "Confirmar & Continuar" : "Selecione um Modelo"}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}

        {/* STEP 3: ESTILO & AJUSTES */}
        {studioStep === 3 && (
          <div className="flex flex-col h-full animate-[fadeIn_0.5s_ease-out] p-6 lg:p-10 overflow-y-auto custom-scrollbar">
            <div className="text-center mb-12">
              <h3 className="text-2xl font-serif text-white">Direção Criativa</h3>
              <p className="text-gray-400 text-sm mt-1">Defina a atmosfera e os detalhes finais</p>
            </div>

            <div className="flex justify-center items-center gap-8 lg:gap-16 mb-12 perspective-1000">
              <div
                className="flex flex-col items-center gap-4 group relative transform transition-transform hover:scale-105 duration-500 cursor-pointer"
                onClick={() => setStudioStep(1)}
              >
                <div className="w-36 h-48 lg:w-44 lg:h-60 rounded-2xl border border-theme-accent/30 overflow-hidden bg-[#0a0112] shadow-[0_20px_50px_rgba(0,0,0,0.5)] group-hover:shadow-[0_0_40px_rgba(255,215,0,0.2)] group-hover:border-theme-accent transition-all transform -rotate-2 group-hover:rotate-0">
                  {selectedProduct ? (
                    <LazyImage
                      src={selectedProduct.preview}
                      alt="Selected Product"
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                  <div className="absolute top-3 left-3 z-10 w-8 h-8 bg-theme-accent text-black rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                      />
                    </svg>
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white border border-white px-2 py-1 rounded">
                      Trocar
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-theme-accent uppercase tracking-widest bg-theme-accent/5 px-4 py-1.5 rounded-full border border-theme-accent/20">
                  A Peça
                </span>
              </div>

              <div className="text-white/20 animate-pulse flex flex-col items-center justify-center gap-2">
                <div className="w-20 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center bg-white/5 backdrop-blur-md shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                  <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div className="w-20 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
              </div>

              <div
                className="flex flex-col items-center gap-4 group relative transform transition-transform hover:scale-105 duration-500 cursor-pointer"
                onClick={() => setStudioStep(2)}
              >
                <div className="w-36 h-48 lg:w-44 lg:h-60 rounded-2xl border border-theme-secondary/30 overflow-hidden bg-[#0a0112] shadow-[0_20px_50px_rgba(0,0,0,0.5)] group-hover:shadow-[0_0_40px_rgba(176,38,255,0.2)] group-hover:border-theme-secondary transition-all transform rotate-2 group-hover:rotate-0">
                  {selectedModel ? (
                    <LazyImage
                      src={selectedModel.preview}
                      alt="Selected Model"
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                  <div className="absolute top-3 right-3 z-10 w-8 h-8 bg-theme-secondary text-white rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white border border-white px-2 py-1 rounded">
                      Trocar
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-theme-secondary uppercase tracking-widest bg-theme-secondary/5 px-4 py-1.5 rounded-full border border-theme-secondary/20">
                  A Musa
                </span>
              </div>
            </div>

            <div className="flex-1 max-w-4xl mx-auto w-full space-y-10 bg-[#0a0112]/50 p-8 rounded-3xl border border-white/5 shadow-inner">
              <StyleSelector value={selectedStyle} onChange={setSelectedStyle} />
              <div className="border-t border-white/5 pt-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-6 h-6 rounded-full bg-theme-accent/20 flex items-center justify-center text-theme-accent">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </div>
                  <label className="text-xs font-bold text-white uppercase tracking-widest">
                    Ajustes Finos (Prompt)
                  </label>
                </div>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full h-28 bg-[#020005] border border-white/10 rounded-2xl p-5 text-white text-sm outline-none resize-none focus:border-theme-accent focus:shadow-[0_0_20px_rgba(255,215,0,0.1)] transition-all placeholder-gray-600 font-sans"
                  placeholder="Ex: Ajustar caimento na cintura, manter iluminação dramática..."
                />
              </div>
            </div>

            <div className="mt-12 flex justify-between items-center pb-8">
              <button
                onClick={() => setStudioStep(2)}
                className="text-gray-400 hover:text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Voltar
              </button>
              <button
                onClick={() => setStudioStep(4)}
                className="gold-gradient-bg text-black px-12 py-5 rounded-full font-bold text-base hover:shadow-[0_0_30px_rgba(191,147,63,0.5)] transition-all disabled:opacity-50 uppercase tracking-[0.15em]"
                disabled={!selectedProduct || !selectedModel}
              >
                Finalizar Criação
                <div className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: REVELAÇÃO */}
        {studioStep === 4 && (
          <div className="flex flex-col h-full animate-[fadeIn_0.8s_ease-out] p-6 lg:p-10 relative overflow-y-auto custom-scrollbar justify-center items-center">
            <LoadingOverlay isVisible={isProcessing} />

            <div className="text-center mb-10">
              <h3 className="text-4xl font-serif text-white mb-3">Tudo Pronto.</h3>
              <p className="text-gray-400 text-sm font-light tracking-wide">A IA está pronta para tecer a realidade.</p>
            </div>

            <div className="w-full max-w-lg mx-auto flex flex-col items-center">
              <div className="relative w-80 h-80 mb-12">
                <div className="absolute inset-0 rounded-full border border-theme-accent/20 animate-[spin_10s_linear_infinite]"></div>
                <div className="absolute inset-4 rounded-full border border-theme-secondary/20 animate-[spin_15s_linear_infinite_reverse]"></div>

                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-gradient-to-br from-theme-accent/10 to-theme-secondary/10 backdrop-blur-xl border border-white/20 shadow-[0_0_60px_rgba(255,255,255,0.1)] flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                  <svg
                    className="w-16 h-16 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] animate-pulse-slow"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                    />
                  </svg>
                </div>

                <div className="absolute top-0 left-1/2 w-16 h-16 -ml-8 -mt-8 rounded-full overflow-hidden border-2 border-theme-accent shadow-[0_0_30px_rgba(255,215,0,0.4)] animate-bounce">
                  <LazyImage src={selectedProduct?.preview || ""} alt="" className="w-full h-full object-cover" />
                </div>
                <div
                  className="absolute bottom-0 left-1/2 w-16 h-16 -ml-8 -mb-8 rounded-full overflow-hidden border-2 border-theme-secondary shadow-[0_0_30px_rgba(176,38,255,0.4)] animate-bounce"
                  style={{ animationDelay: "0.5s" }}
                >
                  <LazyImage src={selectedModel?.preview || ""} alt="" className="w-full h-full object-cover" />
                </div>
              </div>

              <button
                onClick={handleGenerateClick}
                disabled={isProcessing}
                className="w-full relative group overflow-hidden rounded-full shadow-[0_0_50px_rgba(191,149,63,0.3)] hover:shadow-[0_0_100px_rgba(191,149,63,0.6)] transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#AA771C] animate-[shine_3s_linear_infinite] opacity-100"></div>
                <div className="relative px-10 py-6 flex items-center justify-center gap-4">
                  <span className="text-black font-extrabold uppercase tracking-[0.3em] text-sm group-hover:tracking-[0.4em] transition-all duration-500 drop-shadow-sm">
                    Revelar Look
                  </span>
                  <svg
                    className="w-5 h-5 text-black drop-shadow-sm"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </button>

              <button
                onClick={() => setStudioStep(3)}
                disabled={isProcessing}
                className="mt-8 text-gray-600 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"
              >
                Voltar para Ajustes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
