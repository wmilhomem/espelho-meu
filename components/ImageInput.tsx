"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { fileToBase64, urlToBase64 } from "../services/geminiService"

export type ImageData = {
  source: "file" | "url"
  data: string
  mimeType: string
  preview: string
  originalUrl?: string
  file?: File
}

interface ImageInputProps {
  label: string
  subLabel: string
  placeholderText: string
  value: ImageData | null
  onChange: (assetData: ImageData | null) => void
  accentColor: "gold" | "purple"
}

const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          resolve(file)
          return
        }

        // DIMINUIR: Resolução ajustada para performance (evitar congelamento)
        const MAX_WIDTH = 1024
        const MAX_HEIGHT = 1024

        let width = img.width
        let height = img.height
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height
            height = MAX_HEIGHT
          }
        }
        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: "image/jpeg", lastModified: Date.now() }))
            } else {
              resolve(file)
            }
          },
          "image/jpeg",
          0.8,
        ) // Qualidade ajustada para 0.8
      }
      img.onerror = (err) => reject(err)
    }
    reader.onerror = (err) => reject(err)
  })
}

const ImageInput: React.FC<ImageInputProps> = ({ label, subLabel, placeholderText, value, onChange, accentColor }) => {
  const [inputType, setInputType] = useState<"url" | "upload">("upload")
  const [urlInput, setUrlInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const activeColor =
    accentColor === "gold" ? "text-theme-accent border-theme-accent" : "text-theme-secondary border-theme-secondary"
  const inactiveColor = "text-gray-500 border-transparent hover:text-white"
  const glowClass =
    accentColor === "gold"
      ? "shadow-[0_0_15px_rgba(var(--color-accent),0.2)]"
      : "shadow-[0_0_15px_rgba(157,78,221,0.2)]"
  const btnClass =
    accentColor === "gold" ? "gold-gradient-bg text-black" : "bg-theme-secondary hover:bg-purple-600 text-white"

  useEffect(() => {
    return () => {
      if (value?.preview && value.preview.startsWith("blob:")) URL.revokeObjectURL(value.preview)
    }
  }, [value])

  const processFile = async (fileInput: File) => {
    setIsLoading(true)
    setError(null)
    try {
      let processedFile = fileInput
      // Sempre comprime se for imagem para garantir redução de tamanho
      if (fileInput.type.startsWith("image/")) processedFile = await compressImage(fileInput)
      const base64 = await fileToBase64(processedFile)
      const preview = URL.createObjectURL(processedFile)
      onChange({ source: "file", data: base64, mimeType: processedFile.type, preview: preview, file: processedFile })
    } catch (err: any) {
      console.error(err)
      setError("Erro ao processar o arquivo.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) await processFile(e.target.files[0])
  }
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) await processFile(e.dataTransfer.files[0])
  }

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return
    setIsLoading(true)
    setError(null)
    try {
      const result = await urlToBase64(urlInput)
      onChange({
        source: "url",
        data: result.data,
        mimeType: result.mimeType || "image/jpeg",
        preview: result.preview,
        originalUrl: urlInput,
      })
      setUrlInput("")
    } catch (err: any) {
      setError(err.message || "Erro ao carregar imagem.")
    } finally {
      setIsLoading(false)
    }
  }

  const hasPreview = !!(value && value.preview)

  return (
    <div
      className={`p-6 rounded-xl border border-white/10 transition-all duration-500 bg-black/20 ${hasPreview ? glowClass : "hover:border-white/20"}`}
    >
      <div className="flex justify-between items-end mb-6">
        <div>
          <h3
            className={`text-xl font-bold uppercase tracking-widest ${accentColor === "gold" ? "text-theme-accent" : "text-theme-secondary"}`}
          >
            {label}
          </h3>
          <p className="text-gray-400 text-[10px] tracking-wider uppercase font-light mt-1">{subLabel}</p>
        </div>
        {hasPreview && !isLoading && (
          <button
            onClick={() => onChange(null)}
            className="text-[10px] uppercase font-bold hover:text-white text-gray-500 transition-colors border border-white/10 px-3 py-1 rounded-full hover:bg-white/10"
          >
            Trocar
          </button>
        )}
      </div>

      <div className="relative min-h-[300px] flex flex-col justify-center">
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl animate-[fadeIn_0.3s]">
            <div
              className={`w-10 h-10 rounded-full border-4 border-t-transparent animate-spin mb-4 ${accentColor === "gold" ? "border-theme-accent" : "border-theme-secondary"}`}
            ></div>
            <span
              className={`text-xs font-bold uppercase tracking-widest animate-pulse ${accentColor === "gold" ? "text-theme-accent" : "text-theme-secondary"}`}
            >
              Carregando...
            </span>
          </div>
        )}

        {hasPreview ? (
          <div className="relative w-full h-[300px] rounded-xl overflow-hidden group animate-[fadeIn_0.5s_ease-out] shadow-2xl">
            <img
              src={value!.preview}
              alt="Selected"
              className="w-full h-full object-contain bg-[#0a0112]"
              onError={(e) => {
                e.currentTarget.style.display = "none"
                setError("Erro ao exibir imagem.")
                onChange(null)
              }}
            />
          </div>
        ) : (
          <>
            {!isLoading && (
              <div className="flex gap-4 border-b border-white/10 mb-6">
                <button
                  onClick={() => {
                    setInputType("upload")
                    setError(null)
                  }}
                  className={`text-[10px] font-bold uppercase tracking-widest pb-2 border-b-2 transition-all ${inputType === "upload" ? activeColor : inactiveColor}`}
                >
                  Upload Arquivo
                </button>
                <button
                  onClick={() => {
                    setInputType("url")
                    setError(null)
                  }}
                  className={`text-[10px] font-bold uppercase tracking-widest pb-2 border-b-2 transition-all ${inputType === "url" ? activeColor : inactiveColor}`}
                >
                  Link URL
                </button>
              </div>
            )}

            <div className="flex-grow flex items-center justify-center w-full">
              {inputType === "url" ? (
                <div className="w-full h-full flex flex-col justify-center">
                  <input
                    type="text"
                    placeholder={placeholderText}
                    value={urlInput}
                    onChange={(e) => {
                      setUrlInput(e.target.value)
                      if (error) setError(null)
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
                    disabled={isLoading}
                    className={`w-full bg-black/40 border p-4 rounded-xl text-sm text-white focus:outline-none transition-colors mb-3 placeholder-gray-600 ${error ? "border-red-500/50" : `border-white/10 ${accentColor === "gold" ? "focus:border-theme-accent" : "focus:border-theme-secondary"}`}`}
                  />
                  {error && (
                    <div className="flex items-center gap-2 mb-4 text-red-400 text-xs bg-red-500/10 p-2 rounded">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {error}
                    </div>
                  )}
                  <button
                    onClick={handleUrlSubmit}
                    disabled={!urlInput || isLoading}
                    className={`w-full py-4 rounded-xl text-xs uppercase tracking-widest font-bold shadow-lg transition-all ${btnClass} ${!urlInput || isLoading ? "opacity-50 cursor-not-allowed" : "hover:shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:-translate-y-1"}`}
                  >
                    Importar Agora
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => !isLoading && fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`w-full h-full border-2 border-dashed rounded-xl bg-black/30 flex flex-col items-center justify-center cursor-pointer transition-all min-h-[200px] group ${error ? "border-red-500/50" : isDragging ? `${accentColor === "gold" ? "border-theme-accent bg-theme-accent/5" : "border-theme-secondary bg-theme-secondary/5"}` : "border-white/10 hover:border-white/30 hover:bg-white/5"}`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {error ? (
                    <div className="text-center p-4">
                      <span className="text-xs text-red-400 font-bold block mb-1">{error}</span>
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider">Tentar novamente</span>
                    </div>
                  ) : (
                    <>
                      <div
                        className={`mb-4 p-4 rounded-full bg-white/5 transition-transform group-hover:scale-110 ${accentColor === "gold" ? "text-theme-accent" : "text-theme-secondary"}`}
                      >
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                      </div>
                      <span className="text-xs uppercase tracking-widest text-white font-bold group-hover:text-theme-accent transition-colors">
                        Arraste ou Clique
                      </span>
                      <span className="text-[10px] text-gray-500 mt-1">JPG, PNG (Max 10MB)</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ImageInput
