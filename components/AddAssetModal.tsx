"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { X } from "lucide-react"
import ImageInput from "./ImageInput"
import type { ImageData } from "@/types"

interface AddAssetModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (assetData: any) => Promise<void>
  type: "product" | "model"
  isSellerMode?: boolean
  existingAsset?: any // Added existingAsset prop for editing
}

export default function AddAssetModal({
  isOpen,
  onClose,
  onSave,
  type,
  isSellerMode = false,
  existingAsset,
}: AddAssetModalProps) {
  const [name, setName] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [category, setCategory] = useState<string>("")
  const [price, setPrice] = useState<number>(0)
  const [published, setPublished] = useState<boolean>(false)
  const [imageData, setImageData] = useState<ImageData | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log("[v0] AddAssetModal - existingAsset:", existingAsset)
    if (existingAsset) {
      console.log("[v0] AddAssetModal - existingAsset.preview:", existingAsset.preview)
      setName(existingAsset.name || "")
      setDescription(existingAsset.description || "")
      setCategory(existingAsset.category || "")
      setPrice(existingAsset.price || 0)
      setPublished(existingAsset.published || false)
      // Set image preview from existing asset - use preview field
      if (existingAsset.preview) {
        const imagePreview = {
          preview: existingAsset.preview,
          source: "url",
          originalUrl: existingAsset.preview,
          mimeType: existingAsset.mimeType || "image/jpeg",
        } as ImageData
        console.log("[v0] AddAssetModal - Setting imageData:", imagePreview)
        setImageData(imagePreview)
      }
    } else {
      // Reset form when not editing
      setName("")
      setDescription("")
      setCategory("")
      setPrice(0)
      setPublished(false)
      setImageData(null)
    }
  }, [existingAsset, isOpen])

  const handleImageSelect = (data: ImageData) => {
    setImageData(data)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log("[v0] AddAssetModal - handleSubmit iniciado")

    if (!imageData && !existingAsset) {
      setError("Por favor, selecione uma imagem")
      console.log("[v0] AddAssetModal - Erro: Imagem não selecionada")
      return
    }

    if (!name.trim()) {
      setError("Por favor, insira um nome")
      console.log("[v0] AddAssetModal - Erro: Nome vazio")
      return
    }

    setIsSaving(true)
    setError(null)
    console.log("[v0] AddAssetModal - isSaving = true")

    try {
      const assetData = {
        ...(existingAsset && { id: existingAsset.id }), // Include ID when editing
        name: name.trim(),
        description: description.trim(),
        category: category.trim() || "Sem categoria",
        mimeType: imageData?.mimeType || existingAsset?.mimeType || "image/jpeg",
        source: imageData?.source || "url",
        preview: imageData?.preview || existingAsset?.preview,
        data: imageData?.data,
        originalUrl: imageData?.originalUrl,
        file: imageData?.file,
        ...(isSellerMode && type === "product" && { price, published }),
      }

      console.log("[v0] AddAssetModal - Dados preparados:", {
        id: assetData.id,
        name: assetData.name,
        source: assetData.source,
        hasFile: !!assetData.file,
        hasData: !!assetData.data,
      })

      console.log("[v0] AddAssetModal - Chamando onSave...")
      await onSave(assetData)
      console.log("[v0] AddAssetModal - onSave concluído com sucesso")

      setName("")
      setDescription("")
      setCategory("")
      setPrice(0)
      setPublished(false)
      setImageData(null)
      console.log("[v0] AddAssetModal - Formulário resetado, fechando modal")

      // Small delay to ensure state updates are processed
      setTimeout(() => {
        onClose()
      }, 100)
    } catch (err: any) {
      console.error("[v0] AddAssetModal - Erro ao salvar:", err)
      console.error("[v0] AddAssetModal - Stack trace:", err.stack)
      setError(err.message || "Erro ao salvar item. Verifique sua conexão e tente novamente.")
    } finally {
      console.log("[v0] AddAssetModal - isSaving = false")
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  const title = existingAsset
    ? type === "product"
      ? "Editar Peça"
      : "Editar Modelo"
    : type === "product"
      ? "Adicionar Peça"
      : "Adicionar Modelo"

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#05010a]/95 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-b from-[#0a0112] to-[#05010a] border border-[#BF953F]/30 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-[#BF953F]/50 to-transparent"></div>

        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-b from-[#0a0112] to-[#05010a]/95 backdrop-blur-sm border-b border-[#BF953F]/20 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-serif font-bold text-white">{title}</h2>
            <p className="text-sm text-gray-400 mt-1">
              {existingAsset ? "Edite as informações abaixo" : "Preencha as informações abaixo"}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors" disabled={isSaving}>
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Image Input */}
          <div>
            <label className="block text-sm font-bold text-white mb-3">
              Imagem * {existingAsset && <span className="text-gray-400 text-xs">(Não editável)</span>}
            </label>
            {existingAsset ? (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10">
                <img
                  src={imageData?.preview || existingAsset.preview}
                  alt={existingAsset.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <p className="text-white text-sm font-bold">Imagem não pode ser alterada</p>
                </div>
              </div>
            ) : (
              <ImageInput
                label={type === "product" ? "PEÇA" : "MODELO"}
                subLabel={type === "product" ? "Adicione a imagem da peça" : "Adicione a imagem do modelo"}
                placeholderText={type === "product" ? "Cole o link da peça aqui" : "Cole o link do modelo aqui"}
                value={imageData}
                onChange={handleImageSelect}
                accentColor="gold"
              />
            )}
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-bold text-white mb-2">Nome *</label>
            <input
              type="text"
              value={name || ""} // Ensure value is never undefined
              onChange={(e) => setName(e.target.value)}
              placeholder={type === "product" ? "Ex: Vestido de Festa" : "Ex: Modelo Verão"}
              className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#BF953F]"
              disabled={isSaving}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-white mb-2">Descrição</label>
            <textarea
              value={description || ""} // Ensure value is never undefined
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o item..."
              rows={3}
              className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#BF953F] resize-none"
              disabled={isSaving}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-bold text-white mb-2">Categoria</label>
            <input
              type="text"
              value={category || ""} // Ensure value is never undefined
              onChange={(e) => setCategory(e.target.value)}
              placeholder={type === "product" ? "Ex: Vestidos, Blusas, Calças" : "Ex: Editorial, Casual"}
              className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#BF953F]"
              disabled={isSaving}
            />
          </div>

          {/* Seller Mode Fields */}
          {isSellerMode && type === "product" && (
            <>
              {/* Price */}
              <div>
                <label className="block text-sm font-bold text-white mb-2">Preço (R$)</label>
                <input
                  type="number"
                  value={price ?? 0} // Ensure value is never undefined or null
                  onChange={(e) => setPrice(Number(e.target.value))}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#BF953F]"
                  disabled={isSaving}
                />
              </div>

              {/* Published */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="published"
                  checked={published ?? false} // Ensure value is never undefined
                  onChange={(e) => setPublished(e.target.checked)}
                  className="w-5 h-5 rounded border-white/20 text-[#BF953F] focus:ring-2 focus:ring-[#BF953F]"
                  disabled={isSaving}
                />
                <label htmlFor="published" className="text-sm font-bold text-white cursor-pointer">
                  Publicar na loja
                </label>
              </div>
            </>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-black/30 border border-white/10 rounded-xl font-bold text-white hover:bg-white/10 transition-all"
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 gold-gradient-bg text-black rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSaving}
            >
              {isSaving ? "Salvando..." : existingAsset ? "Atualizar" : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
