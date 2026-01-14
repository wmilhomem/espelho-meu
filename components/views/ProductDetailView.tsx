"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { ImageAsset } from "../../types"
import LazyImage from "../LazyImage"

interface ProductDetailViewProps {
  product: ImageAsset
  storeName?: string
  onBack: () => void
  onAddToCart: (product: ImageAsset) => void
  onTryOn: (product: ImageAsset) => void
}

export const ProductDetailView: React.FC<ProductDetailViewProps> = ({
  product,
  storeName,
  onBack,
  onAddToCart,
  onTryOn,
}) => {
  const [selectedSize, setSelectedSize] = useState<string>("M")
  const [selectedColor, setSelectedColor] = useState<number>(0)
  const [activeImage, setActiveImage] = useState(product.preview)

  // Simulação de cores (extraídas visualmente ou mockadas)
  const colors = [
    { name: "Original", hex: "transparent", image: product.preview },
    { name: "Preto", hex: "#000000", image: product.preview },
    { name: "Bege", hex: "#D2B48C", image: product.preview },
  ]

  // Simulação de Ângulos/Miniaturas
  // Como não temos imagens reais, usamos a mesma para demo, mas em um app real viriam do backend
  const thumbnails = [product.preview, product.preview, product.preview, product.preview]

  // Reset active image when product changes
  useEffect(() => {
    setActiveImage(product.preview)
  }, [product])

  return (
    <div className="w-full h-full flex flex-col md:flex-row bg-white relative">
      {/* --- LEFT: IMMERSIVE IMAGE (STICKY/FIXED) --- */}
      <div className="w-full md:w-1/2 h-[45vh] md:h-full bg-gray-50 relative overflow-hidden flex flex-col">
        {/* Main Image Area */}
        <div className="flex-1 relative flex items-center justify-center group overflow-hidden">
          <LazyImage
            src={activeImage}
            alt={product.name}
            className="w-full h-full object-contain md:object-cover mix-blend-multiply md:mix-blend-normal transition-transform duration-700 animate-[fadeIn_0.3s]"
          />

          {/* Mobile Close Button (Overlay) */}
          <button
            onClick={onBack}
            className="md:hidden absolute top-4 right-4 bg-white/80 p-2 rounded-full shadow-lg backdrop-blur-md z-20"
          >
            <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Thumbnails Strip (Overlay at bottom or separate block) */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3 px-4 z-20">
          {thumbnails.map((thumb, idx) => (
            <button
              key={idx}
              onClick={() => setActiveImage(thumb)}
              className={`w-12 h-16 md:w-16 md:h-20 rounded-lg overflow-hidden border-2 transition-all shadow-lg bg-white ${activeImage === thumb && idx === thumbnails.indexOf(activeImage) ? "border-black scale-110" : "border-white opacity-70 hover:opacity-100 hover:scale-105"}`}
            >
              <LazyImage src={thumb} alt={`Angle ${idx}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* --- RIGHT: SCROLLABLE DETAILS --- */}
      <div className="w-full md:w-1/2 h-full flex flex-col relative bg-white">
        {/* Desktop Close Header */}
        <div className="hidden md:flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="text-xs text-gray-400 font-medium tracking-wide breadcrumbs">
            <span className="text-black font-bold uppercase">{storeName || "Loja"}</span> / {product.category || "Item"}
          </div>
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <svg
              className="w-5 h-5 text-gray-400 hover:text-black"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 mb-2 leading-tight">{product.name}</h1>

          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-2xl font-bold text-gray-900">R$ {(product.price || 0).toFixed(2)}</span>
            <span className="text-sm text-gray-400 line-through">R$ {((product.price || 0) * 1.2).toFixed(2)}</span>
            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded uppercase tracking-wider">
              Em Estoque
            </span>
          </div>

          <div className="space-y-6">
            {/* Colors */}
            <div>
              <span className="text-xs font-bold text-gray-900 uppercase tracking-wide block mb-3">
                Cor: <span className="text-gray-500 font-normal ml-1">{colors[selectedColor].name}</span>
              </span>
              <div className="flex gap-2">
                {colors.map((c, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedColor(idx)}
                    className={`w-8 h-8 rounded-full border p-0.5 transition-all ${selectedColor === idx ? "border-black scale-110" : "border-transparent hover:border-gray-200"}`}
                  >
                    <div
                      className="w-full h-full rounded-full border border-black/10 overflow-hidden relative shadow-sm"
                      style={{ backgroundColor: c.hex === "transparent" ? "#fff" : c.hex }}
                    >
                      {c.hex === "transparent" && (
                        <img src={c.image} className="w-full h-full object-cover opacity-80" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Sizes */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-gray-900 uppercase tracking-wide">Tamanho</span>
                <button className="text-[10px] text-gray-400 underline hover:text-black">Guia de Medidas</button>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {["PP", "P", "M", "G", "GG"].map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`h-10 rounded border text-xs font-bold transition-all ${selectedSize === size ? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-200 hover:border-black"}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Description (Concise) */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-2">Detalhes</h3>
              <p className="text-xs text-gray-600 leading-relaxed line-clamp-4">
                {product.description ||
                  "Peça exclusiva confeccionada com materiais de alta qualidade para garantir conforto e durabilidade. O design moderno valoriza o estilo pessoal, ideal para compor looks versáteis."}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions (Sticky Bottom) */}
        <div className="p-4 md:p-6 border-t border-gray-100 bg-white shadow-[0_-5px_15px_rgba(0,0,0,0.02)] z-10 flex flex-col gap-3">
          <button
            onClick={() => onAddToCart(product)}
            className="w-full bg-black text-white py-3.5 rounded-lg font-bold uppercase tracking-widest text-xs hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            Adicionar à Sacola
          </button>

          <button
            onClick={() => onTryOn(product)}
            className="w-full border border-black text-black py-3.5 rounded-lg font-bold uppercase tracking-widest text-xs hover:bg-gray-50 transition-all flex items-center justify-center gap-2 group"
          >
            <svg
              className="w-4 h-4 group-hover:scale-110 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
              />
            </svg>
            Provador Virtual
          </button>
        </div>
      </div>
    </div>
  )
}
