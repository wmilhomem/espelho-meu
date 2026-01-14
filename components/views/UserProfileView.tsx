"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import type { User, KYCData, AIModel, ImageAsset } from "../../types"
import {
  updateUserProfile,
  uploadStoreLogo,
  uploadBlobToStorage,
  addNotification,
  getCurrentUserProfile,
  getAssets,
  updateAsset,
} from "../../services/storageService"
import { useTheme, type Theme } from "../../context/ThemeContext"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { AI_MODEL_OPTIONS, getAIModelConfig } from "../../constants/ai-models"

interface UserProfileViewProps {
  currentUser: User | null
  stats: any
  onAvatarChange: (file: File) => Promise<void>
  onLogout: () => void
  onUserUpdate: (user: User) => void
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  currentUser,
  stats,
  onAvatarChange,
  onLogout,
  onUserUpdate,
}) => {
  const { theme, setTheme } = useTheme()

  const avatarInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const kycDocInputRef = useRef<HTMLInputElement>(null)

  const [publishedProducts, setPublishedProducts] = useState<ImageAsset[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)

  // Estados locais para edição
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState("") // State for save errors

  // Loading específico do avatar
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  const [name, setName] = useState("")
  const [emailNotifications, setEmailNotifications] = useState(true)

  const [selectedAIModel, setSelectedAIModel] = useState<AIModel>("gemini-2.5-flash-image-preview")

  // Configurações de Loja
  const [isSalesPageEnabled, setIsSalesPageEnabled] = useState(false)
  const [storeName, setStoreName] = useState("")
  const [storeLogo, setStoreLogo] = useState<string | null>(null)
  const [storeBanner, setStoreBanner] = useState<string | null>(null)
  const [whatsapp, setWhatsapp] = useState("")
  const [storeConfig, setStoreConfig] = useState<any>(null) // Unified storeConfig state

  // KYC States
  const [kycType, setKycType] = useState<"cpf" | "cnpj">("cpf")
  const [kycLegalName, setKycLegalName] = useState("")
  const [kycDocNumber, setKycDocNumber] = useState("")
  const [kycBankInfo, setKycBankInfo] = useState("")
  const [kycDocUrl, setKycDocUrl] = useState<string | null>(null)
  const [isUploadingDoc, setIsUploadingDoc] = useState(false)

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name)
      setEmailNotifications(currentUser.preferences.emailNotifications)

      setSelectedAIModel(currentUser.preferences?.aiModel || "gemini-2.5-flash-image-preview")

      setIsSalesPageEnabled(currentUser.storeConfig?.isSalesPageEnabled || false)
      setStoreName(currentUser.storeConfig?.storeName || "")
      setStoreLogo(currentUser.storeConfig?.storeLogo || null)
      setStoreBanner(currentUser.storeConfig?.storeBanner || null)
      setWhatsapp(currentUser.storeConfig?.whatsapp || "")

      // Unified storeConfig state
      setStoreConfig({
        isSalesPageEnabled: currentUser.storeConfig?.isSalesPageEnabled || false,
        storeName: currentUser.storeConfig?.storeName || "",
        storeLogo: currentUser.storeConfig?.storeLogo || null,
        storeBanner: currentUser.storeConfig?.storeBanner || null,
        whatsapp: currentUser.storeConfig?.whatsapp || "",
        kyc: currentUser.storeConfig?.kyc || null,
      })

      // Load KYC Data
      if (currentUser.storeConfig?.kyc) {
        setKycType(currentUser.storeConfig.kyc.type)
        setKycLegalName(currentUser.storeConfig.kyc.legalName)
        setKycDocNumber(currentUser.storeConfig.kyc.documentNumber)
        setKycBankInfo(currentUser.storeConfig.kyc.bankInfo)
        setKycDocUrl(currentUser.storeConfig.kyc.documentUrl || null)
      } else {
        // Pre-fill Name if empty
        setKycLegalName(currentUser.name)
      }

      if (currentUser.storeConfig?.isSalesPageEnabled) {
        loadPublishedProducts()
      }
    }
  }, [currentUser])

  const loadPublishedProducts = async () => {
    if (!currentUser?.id) return

    setLoadingProducts(true)
    try {
      console.log("[v0] Loading published products for user:", currentUser.id)
      const products = await getAssets("product", currentUser.id, true)
      console.log("[v0] Published products loaded:", products.length)
      setPublishedProducts(products)
    } catch (error) {
      console.error("[v0] Error loading published products:", error)
    } finally {
      setLoadingProducts(false)
    }
  }

  const handleTogglePublish = async (product: ImageAsset) => {
    if (!product.id) return

    try {
      const newStatus = !product.published
      await updateAsset(product.id, { published: newStatus })

      // Update local state
      setPublishedProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, published: newStatus } : p)))

      // Remove from list if unpublished
      if (!newStatus) {
        setPublishedProducts((prev) => prev.filter((p) => p.id !== product.id))
      }

      addNotification({
        id: Date.now().toString(),
        type: "success",
        title: newStatus ? "Publicado" : "Ocultado",
        message: `Produto ${newStatus ? "visível" : "oculto"} na loja.`,
        read: false,
        timestamp: Date.now(),
      })
    } catch (error) {
      console.error("[v0] Error toggling publish:", error)
      addNotification({
        id: Date.now().toString(),
        type: "error",
        title: "Erro",
        message: "Não foi possível alterar o status do produto.",
        read: false,
        timestamp: Date.now(),
      })
    }
  }

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      // Validação básica de tamanho
      if (file.size > 5 * 1024 * 1024) {
        addNotification({
          id: Date.now().toString(),
          type: "error",
          title: "Arquivo Grande",
          message: "A imagem deve ter no máximo 5MB.",
          read: false,
          timestamp: Date.now(),
        })
        return
      }

      setIsUploadingAvatar(true)
      try {
        await onAvatarChange(file)
        addNotification({
          id: Date.now().toString(),
          type: "success",
          title: "Sucesso",
          message: "Foto de perfil atualizada.",
          read: false,
          timestamp: Date.now(),
        })
      } catch (err) {
        console.error(err)
        addNotification({
          id: Date.now().toString(),
          type: "error",
          title: "Erro",
          message: "Falha ao atualizar foto.",
          read: false,
          timestamp: Date.now(),
        })
      } finally {
        setIsUploadingAvatar(false)
        // Limpar o input para permitir selecionar o mesmo arquivo novamente se falhar
        if (avatarInputRef.current) avatarInputRef.current.value = ""
      }
    }
  }

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && currentUser) {
      const file = e.target.files[0]
      try {
        const publicUrl = await uploadStoreLogo(currentUser.id, file)
        if (publicUrl) {
          setStoreLogo(publicUrl)
          setStoreConfig((prev) => ({ ...prev, storeLogo: publicUrl })) // Update unified state
        } else throw new Error("Upload falhou - URL não retornada")
      } catch (err) {
        console.error(err)
        addNotification({
          id: Date.now().toString(),
          type: "error",
          title: "Erro",
          message: "Falha no upload do logo.",
          read: false,
          timestamp: Date.now(),
        })
      }
    }
  }

  const handleBannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && currentUser) {
      const file = e.target.files[0]
      try {
        const publicUrl = await uploadStoreLogo(currentUser.id, file) // Reusing logic for public url
        if (publicUrl) {
          setStoreBanner(publicUrl)
          setStoreConfig((prev) => ({ ...prev, storeBanner: publicUrl })) // Update unified state
        } else throw new Error("Upload falhou - URL não retornada")
      } catch (err) {
        console.error(err)
        addNotification({
          id: Date.now().toString(),
          type: "error",
          title: "Erro",
          message: "Falha no upload do banner.",
          read: false,
          timestamp: Date.now(),
        })
      }
    }
  }

  const handleKycDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && currentUser) {
      const file = e.target.files[0]
      setIsUploadingDoc(true)
      try {
        const { publicUrl } = await uploadBlobToStorage(file, currentUser.id, "uploads")
        if (publicUrl) {
          setKycDocUrl(publicUrl)
          setStoreConfig((prev) => ({ ...prev, kyc: { ...prev?.kyc, documentUrl: publicUrl } })) // Update unified state
          addNotification({
            id: Date.now().toString(),
            type: "success",
            title: "Upload OK",
            message: "Documento anexado.",
            read: false,
            timestamp: Date.now(),
          })
        }
      } catch (err) {
        addNotification({
          id: Date.now().toString(),
          type: "error",
          title: "Erro",
          message: "Falha no upload do documento.",
          read: false,
          timestamp: Date.now(),
        })
      } finally {
        setIsUploadingDoc(false)
      }
    }
  }

  const handleSave = async () => {
    console.log("[v0] 💾 UserProfileView - handleSave START")
    console.log("[v0] Current selectedAIModel:", selectedAIModel)
    console.log("[v0] Current name:", name)
    console.log("[v0] Current storeConfig:", storeConfig)

    if (!currentUser) {
      console.log("[v0] ❌ No current user")
      addNotification({
        id: Date.now().toString(),
        type: "error",
        title: "Erro",
        message: "Usuário não autenticado.",
        read: false,
        timestamp: Date.now(),
      })
      return
    }

    if (isSalesPageEnabled) {
      if (!storeName.trim()) {
        addNotification({
          id: Date.now().toString(),
          type: "error",
          title: "Nome da Loja Obrigatório",
          message: "Preencha o nome da loja para ativar a Página Pública.",
          read: false,
          timestamp: Date.now(),
        })
        return
      }

      if (!kycLegalName || !kycLegalName.trim()) {
        addNotification({
          id: Date.now().toString(),
          type: "error",
          title: "Dados de Verificação Incompletos",
          message: "Preencha o Nome Legal / Razão Social para ativar a Página Pública.",
          read: false,
          timestamp: Date.now(),
        })
        return
      }

      if (!kycDocNumber || !kycDocNumber.trim()) {
        addNotification({
          id: Date.now().toString(),
          type: "error",
          title: "Dados de Verificação Incompletos",
          message: "Preencha o CPF ou CNPJ para ativar a Página Pública.",
          read: false,
          timestamp: Date.now(),
        })
        return
      }

      if (!kycBankInfo || !kycBankInfo.trim()) {
        addNotification({
          id: Date.now().toString(),
          type: "error",
          title: "Dados de Verificação Incompletos",
          message: "Preencha as Informações Bancárias para ativar a Página Pública.",
          read: false,
          timestamp: Date.now(),
        })
        return
      }

      if (!kycDocUrl || !kycDocUrl.trim()) {
        addNotification({
          id: Date.now().toString(),
          type: "error",
          title: "Documento Obrigatório",
          message:
            "Anexe uma cópia do documento (CPF/CNPJ) para ativar a Página Pública. O documento deve estar carregado no sistema.",
          read: false,
          timestamp: Date.now(),
        })
        return
      }

      if (!kycDocUrl.includes("supabase.co/storage") && !kycDocUrl.startsWith("http")) {
        addNotification({
          id: Date.now().toString(),
          type: "error",
          title: "Documento Inválido",
          message: "O documento anexado não é válido. Por favor, faça o upload novamente.",
          read: false,
          timestamp: Date.now(),
        })
        return
      }
    }

    setIsSaving(true)
    setSaveError("") // Clear previous errors

    try {
      console.log("[v0] 📤 Building update payload...")

      const kycData: KYCData | null = isSalesPageEnabled
        ? {
            type: kycType,
            legalName: kycLegalName,
            documentNumber: kycDocNumber,
            bankInfo: kycBankInfo,
            documentUrl: kycDocUrl || undefined,
            status: currentUser.storeConfig?.kyc?.status || "pending",
          }
        : null

      const updates: Partial<User> = {
        name,
        preferences: {
          emailNotifications,
          aiModel: selectedAIModel, // Save the selected AI model
        },
        storeConfig: {
          isSalesPageEnabled,
          storeName,
          storeLogo,
          storeBanner,
          whatsapp,
          kyc: kycData,
        },
      }

      console.log("[v0] 📤 Calling updateUserProfile with:", JSON.stringify(updates, null, 2))
      console.log("[v0] 🎯 AI Model being saved:", selectedAIModel)

      await updateUserProfile(currentUser.id, updates)

      console.log("[v0] ✅ updateUserProfile completed")
      console.log("[v0] 🔄 Reloading user profile...")

      const updatedUser = await getCurrentUserProfile()
      console.log("[v0] 📥 Updated user from DB:", JSON.stringify(updatedUser?.preferences, null, 2))
      console.log("[v0] 🤖 AI Model from DB after save:", updatedUser?.preferences?.aiModel)

      if (updatedUser) {
        onUserUpdate(updatedUser) // Update parent component with the new user data
        console.log("[v0] ✅ User updated in parent component")
      }

      addNotification({
        id: Date.now().toString(),
        type: "success",
        title: "Perfil Atualizado com Sucesso",
        message: `Modelo de IA: ${getAIModelConfig(selectedAIModel).displayName}. Suas próximas transformações usarão este modelo.`,
        read: false,
        timestamp: Date.now(),
        duration: 5000,
      })

      setIsEditing(false)
      console.log("[v0] ✅ handleSave - COMPLETE")
      console.log("[v0] handleSave END")
    } catch (error: any) {
      console.error("[v0] ❌ handleSave - ERROR:", error)
      setSaveError(error.message || "Erro ao salvar perfil.") // Set save error message

      addNotification({
        id: Date.now().toString(),
        type: "error",
        title: "Erro ao Salvar Perfil",
        message: error.message || "Ocorreu um erro inesperado. Tente novamente.",
        read: false,
        timestamp: Date.now(),
        duration: 6000,
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (!currentUser) return null

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-8 animate-[fadeIn_0.5s_ease-out]">
      <div className="glass-card-block p-8 rounded-2xl border border-theme-border/50 relative overflow-hidden bg-theme-bg/80 backdrop-blur-xl">
        {/* Background Glows (Dynamic with theme) */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-theme-accent/5 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-theme-secondary/5 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-8">
            <h2 className="text-3xl font-serif text-theme-text">Meu Perfil</h2>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-5 py-2 rounded-lg bg-theme-surface border border-theme-border/30 text-theme-text hover:border-theme-accent transition-all text-xs font-bold uppercase tracking-widest flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Editar
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                  className="px-5 py-2 rounded-lg text-gray-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="gold-gradient-bg px-6 py-2 rounded-lg text-black font-bold uppercase tracking-widest shadow-lg hover:shadow-[0_0_20px_rgba(255,215,0,0.3)] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving && (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  )}
                  {isSaving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-10 border-b border-theme-border/20 pb-10">
            <div
              className="relative group cursor-pointer"
              onClick={() => !isUploadingAvatar && avatarInputRef.current?.click()}
            >
              <div className="w-28 h-28 rounded-full border-2 border-theme-accent overflow-hidden shadow-[0_0_25px_rgba(var(--color-accent),0.3)] relative bg-black">
                {currentUser.avatar ? (
                  <img src={currentUser.avatar || "/placeholder.svg"} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-theme-accent/20 flex items-center justify-center text-4xl font-bold text-theme-accent">
                    {currentUser.name.charAt(0)}
                  </div>
                )}

                {/* Hover Overlay */}
                <div
                  className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${isUploadingAvatar ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                >
                  {isUploadingAvatar ? (
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                </div>
              </div>
              <input
                type="file"
                ref={avatarInputRef}
                onChange={handleAvatarFileChange}
                className="hidden"
                accept="image/jpeg,image/png,image/webp"
                disabled={isUploadingAvatar}
              />
              <p className="text-center text-[10px] text-gray-500 mt-2 uppercase tracking-wide">
                {isUploadingAvatar ? "Enviando..." : "Alterar Foto"}
              </p>
            </div>

            <div className="flex-1 w-full space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Nome Completo
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-theme-surface/50 border border-theme-border/20 rounded-lg p-3 text-theme-text text-sm focus:border-theme-accent focus:outline-none transition-colors"
                    />
                  ) : (
                    <p className="text-theme-text text-lg font-serif">{currentUser.name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Email (Fixo)
                  </label>
                  <p className="text-gray-400 text-sm font-mono bg-theme-surface/50 p-3 rounded-lg border border-theme-border/20 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 01-2-2V9a2 2 0 012-2h10a2 2 0 012 2v4"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 01-2-2V9a2 2 0 012-2h10a2 2 0 012 2v4"
                      />
                    </svg>
                    {currentUser.email}
                  </p>
                </div>
              </div>

              {!isEditing && (
                <div className="flex gap-2 mt-2">
                  <span className="px-3 py-1 bg-theme-accent/10 border border-theme-accent/30 text-theme-accent text-xs font-bold rounded uppercase tracking-wider">
                    {currentUser.plan} Plan
                  </span>
                </div>
              )}

              {isEditing && (
                <div className="flex items-center gap-4 p-4 bg-theme-surface/50 rounded-lg border border-theme-border/20 mt-2">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-theme-text">Notificações por Email</p>
                    <p className="text-xs text-gray-500">Receba atualizações sobre seus looks.</p>
                  </div>
                  <button
                    onClick={() => setEmailNotifications(!emailNotifications)}
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 flex items-center ${emailNotifications ? "bg-theme-accent justify-end" : "bg-gray-600 justify-start"}`}
                  >
                    <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* --- CONFIGURAÇÃO DE LOJA & KYC --- */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-theme-text mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-theme-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              Página de Vendas
            </h3>

            <div
              className={`p-6 rounded-xl border transition-all duration-500 ${isSalesPageEnabled ? "bg-theme-accent/5 border-theme-accent/30" : "bg-theme-surface/50 border-theme-border/20"}`}
            >
              {isEditing ? (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-theme-text">Ativar Página Pública</p>
                      <p className="text-xs text-gray-500">Permite que seus clientes visualizem seus produtos.</p>
                    </div>
                    <button
                      onClick={() => {
                        setIsSalesPageEnabled(!isSalesPageEnabled)
                        setStoreConfig((prev) => ({ ...prev, isSalesPageEnabled: !isSalesPageEnabled })) // Update unified state
                      }}
                      className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 flex items-center ${isSalesPageEnabled ? "bg-chart-4 justify-end" : "bg-muted justify-start"}`}
                    >
                      <div className="w-4 h-4 bg-white rounded-full shadow-md"></div>
                    </button>
                  </div>

                  {isSalesPageEnabled && (
                    <>
                      {/* 1. DADOS BÁSICOS DA LOJA */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-theme-border/20 animate-[fadeIn_0.3s]">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            Nome da Loja <span className="text-destructive">*</span>
                          </label>
                          <input
                            type="text"
                            value={storeName}
                            onChange={(e) => {
                              setStoreName(e.target.value)
                              setStoreConfig((prev) => ({ ...prev, storeName: e.target.value })) // Update unified state
                            }}
                            placeholder="Ex: Boutique Elegance"
                            className="w-full bg-theme-surface/50 border border-theme-border/20 rounded-lg p-3 text-theme-text text-sm focus:border-theme-accent focus:outline-none transition-colors mb-4"
                          />

                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            WhatsApp Atendimento
                          </label>
                          <input
                            type="text"
                            value={whatsapp}
                            onChange={(e) => {
                              setWhatsapp(e.target.value)
                              setStoreConfig((prev) => ({ ...prev, whatsapp: e.target.value })) // Update unified state
                            }}
                            placeholder="5511999999999"
                            className="w-full bg-theme-surface/50 border border-theme-border/20 rounded-lg p-3 text-theme-text text-sm focus:border-theme-accent focus:outline-none transition-colors"
                          />
                        </div>
                        <div className="space-y-4">
                          {/* LOGO UPLOAD */}
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                              Logomarca
                            </label>
                            <div className="flex items-center gap-4">
                              <div
                                className="w-16 h-16 bg-black rounded-lg border border-white/10 flex items-center justify-center overflow-hidden relative group cursor-pointer"
                                onClick={() => logoInputRef.current?.click()}
                              >
                                {storeLogo ? (
                                  <img src={storeLogo || "/placeholder.svg"} className="w-full h-full object-contain" />
                                ) : (
                                  <svg
                                    className="w-6 h-6 text-gray-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                  </svg>
                                )}
                                <div className="absolute inset-0 bg-theme-accent/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <svg
                                    className="w-4 h-4 text-theme-accent"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 4v16m8-8H4"
                                    />
                                  </svg>
                                </div>
                              </div>
                              <input
                                type="file"
                                ref={logoInputRef}
                                onChange={handleLogoFileChange}
                                className="hidden"
                                accept="image/*"
                              />
                              <div className="flex-1">
                                <button
                                  onClick={() => logoInputRef.current?.click()}
                                  className="text-xs text-theme-accent font-bold uppercase tracking-wider hover:underline"
                                >
                                  Fazer Upload
                                </button>
                                <p className="text-[10px] text-gray-500 mt-1">Recomendado: PNG Transparente</p>
                              </div>
                            </div>
                          </div>

                          {/* BANNER UPLOAD */}
                          <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                              Banner Principal
                            </label>
                            <div
                              className="relative group cursor-pointer h-24 bg-black rounded-lg border border-white/10 overflow-hidden"
                              onClick={() => bannerInputRef.current?.click()}
                            >
                              {storeBanner ? (
                                <img src={storeBanner || "/placeholder.svg"} className="w-full h-full object-cover" />
                              ) : (
                                <div className="flex items-center justify-center h-full text-gray-600">
                                  <span className="text-xs">Clique para adicionar banner</span>
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <svg
                                  className="w-6 h-6 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                                  />
                                </svg>
                              </div>
                            </div>
                            <input
                              type="file"
                              ref={bannerInputRef}
                              onChange={handleBannerFileChange}
                              className="hidden"
                              accept="image/*"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 3. CADASTRO E VERIFICAÇÃO (KYC) */}
                      <div className="pt-6 border-t border-theme-border/20 animate-[fadeIn_0.4s]">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="p-1.5 bg-theme-accent/20 rounded-lg text-theme-accent">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                          <h4 className="text-sm font-bold text-theme-text uppercase tracking-widest">
                            3. Cadastro e Verificação (KYC)
                          </h4>
                        </div>
                        <p className="text-xs text-gray-400 mb-6">
                          Para garantir segurança, transparência e conformidade legal, todo vendedor deve passar por um
                          processo de verificação.
                        </p>

                        <div className="flex gap-4 mb-6">
                          <button
                            onClick={() => {
                              setKycType("cpf")
                              setStoreConfig((prev) => ({ ...prev, kyc: { ...prev?.kyc, type: "cpf" } })) // Update unified state
                            }}
                            className={`flex-1 py-3 rounded-lg border text-xs font-bold uppercase tracking-widest transition-all ${kycType === "cpf" ? "bg-theme-accent/10 border-theme-accent text-theme-text" : "bg-black/20 border-theme-border/20 text-gray-500 hover:text-white"}`}
                          >
                            Pessoa Física (CPF)
                          </button>
                          <button
                            onClick={() => {
                              setKycType("cnpj")
                              setStoreConfig((prev) => ({ ...prev, kyc: { ...prev?.kyc, type: "cnpj" } })) // Update unified state
                            }}
                            className={`flex-1 py-3 rounded-lg border text-xs font-bold uppercase tracking-widest transition-all ${kycType === "cnpj" ? "bg-theme-accent/10 border-theme-accent text-theme-text" : "bg-black/20 border-theme-border/20 text-gray-500 hover:text-white"}`}
                          >
                            Pessoa Jurídica (CNPJ)
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-theme-surface/50 p-6 rounded-xl border border-theme-border/10">
                          <div className="space-y-4">
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                                {kycType === "cpf" ? "Nome Completo" : "Razão Social"}{" "}
                                <span className="text-destructive">*</span>
                              </label>
                              <input
                                type="text"
                                value={kycLegalName}
                                onChange={(e) => {
                                  setKycLegalName(e.target.value)
                                  setStoreConfig((prev) => ({
                                    ...prev,
                                    kyc: { ...prev?.kyc, legalName: e.target.value },
                                  })) // Update unified state
                                }}
                                className="w-full bg-black/40 border border-theme-border/20 rounded-lg p-3 text-theme-text text-sm focus:border-theme-accent focus:outline-none transition-colors"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                                {kycType === "cpf" ? "CPF Válido" : "CNPJ Ativo"}{" "}
                                <span className="text-destructive">*</span>
                              </label>
                              <input
                                type="text"
                                value={kycDocNumber}
                                onChange={(e) => {
                                  setKycDocNumber(e.target.value)
                                  setStoreConfig((prev) => ({
                                    ...prev,
                                    kyc: { ...prev?.kyc, documentNumber: e.target.value },
                                  })) // Update unified state
                                }}
                                placeholder={kycType === "cpf" ? "000.000.000-00" : "00.000.000/0001-00"}
                                className="w-full bg-black/40 border border-theme-border/20 rounded-lg p-3 text-theme-text text-sm focus:border-theme-accent focus:outline-none transition-colors"
                              />
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                                Conta Bancária {kycType === "cpf" ? "(Titularidade Própria)" : "(Conta Jurídica)"}{" "}
                                <span className="text-destructive">*</span>
                              </label>
                              <textarea
                                value={kycBankInfo}
                                onChange={(e) => {
                                  setKycBankInfo(e.target.value)
                                  setStoreConfig((prev) => ({
                                    ...prev,
                                    kyc: { ...prev?.kyc, bankInfo: e.target.value },
                                  })) // Update unified state
                                }}
                                placeholder="Banco, Agência, Conta e PIX"
                                rows={2}
                                className="w-full bg-black/40 border border-theme-border/20 rounded-lg p-3 text-theme-text text-sm focus:border-theme-accent focus:outline-none transition-colors resize-none"
                              />
                            </div>

                            {kycType === "cpf" && (
                              <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                                  Documento com Foto (RG/CNH) <span className="text-destructive">*</span>
                                </label>
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => kycDocInputRef.current?.click()}
                                    disabled={isUploadingDoc}
                                    className="flex-1 py-3 border border-dashed border-theme-border/30 rounded-lg text-xs text-gray-400 hover:text-white hover:border-white transition-colors flex items-center justify-center gap-2"
                                  >
                                    {isUploadingDoc ? (
                                      <div className="w-4 h-4 border-2 border-theme-accent border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M4 16l4-4L19 7"
                                        />
                                      </svg>
                                    )}
                                    {kycDocUrl ? "Alterar Documento" : "Anexar Documento"}
                                  </button>
                                  {kycDocUrl && (
                                    <div className="text-chart-4 flex items-center gap-1 text-[10px] uppercase font-bold">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M5 13l4 4L19 7"
                                        />
                                      </svg>
                                      Anexado
                                    </div>
                                  )}
                                  <input
                                    type="file"
                                    ref={kycDocInputRef}
                                    onChange={handleKycDocUpload}
                                    className="hidden"
                                    accept="image/*,.pdf"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                // Modo Visualização
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${isSalesPageEnabled ? "bg-chart-4 shadow-[0_0_5px_rgba(132,204,22,0.5)]" : "bg-muted"}`}
                      ></div>
                      <span className={`text-sm font-bold ${isSalesPageEnabled ? "text-theme-text" : "text-gray-500"}`}>
                        {isSalesPageEnabled ? "Página Ativa" : "Página Inativa"}
                      </span>
                    </div>
                    {isSalesPageEnabled && (
                      <button className="text-xs text-theme-accent hover:text-white transition-colors flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>{" "}
                        Ver Loja
                      </button>
                    )}
                  </div>
                  {isSalesPageEnabled && (
                    <div className="flex items-center gap-4 bg-theme-surface/50 p-4 rounded-lg border border-theme-border/20">
                      {storeLogo && <img src={storeLogo || "/placeholder.svg"} className="w-12 h-12 object-contain" />}
                      <div>
                        <p className="text-theme-text font-bold">{storeName}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Sua marca online</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* // Removed entire "Peças Publicadas" section - this functionality belongs to "Minha Loja" page
          // The published products management should only be accessed through the StoreBuilderView */}

          {/* --- SELETOR DE TEMA --- */}
          <div className="mb-10 pb-10 border-b border-theme-border/20">
            <h3 className="text-lg font-bold text-theme-text mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-theme-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                />
              </svg>
              Aparência do App
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { id: "luxury", label: "Luxury (Padrão)", colors: ["#05010a", "#FFD700"] },
                { id: "dark", label: "Dark Mode", colors: ["#0f172a", "#38bdf8"] },
                { id: "light", label: "Light Mode", colors: ["#f8fafc", "#7c3aed"] },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id as Theme)}
                  className={`group relative p-4 rounded-xl border transition-all duration-300 flex flex-col gap-3 ${theme === t.id ? "border-theme-accent bg-theme-accent/5 ring-1 ring-theme-accent shadow-lg" : "border-theme-border/20 bg-theme-surface/50 hover:border-theme-border/50"}`}
                >
                  <div className="flex gap-2 mb-1">
                    <div
                      className="w-6 h-6 rounded-full border border-white/10 shadow-sm"
                      style={{ backgroundColor: t.colors[0] }}
                    ></div>
                    <div
                      className="w-6 h-6 rounded-full border border-white/10 shadow-sm"
                      style={{ backgroundColor: t.colors[1] }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-sm font-bold ${theme === t.id ? "text-theme-accent" : "text-theme-textMuted group-hover:text-theme-text"}`}
                    >
                      {t.label}
                    </span>
                    {theme === t.id && (
                      <svg className="w-5 h-5 text-theme-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* --- AI MODEL SELECTION --- */}
          <div className="mb-10 pb-10 border-b border-theme-border/20">
            <h3 className="text-lg font-bold text-theme-text mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-theme-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Modelo de Inteligência Artificial
            </h3>

            {isEditing ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Escolha qual modelo de Inteligência Artificial será usado para processar suas transformações de looks.
                </p>

                {/* CHANGE> Using Select component instead of RadioGroup for better UX */}
                <div className="space-y-2">
                  <label htmlFor="ai-model-select" className="text-sm font-medium text-foreground">
                    Selecione o Modelo
                  </label>
                  <Select
                    value={selectedAIModel}
                    onValueChange={(value) => {
                      console.log("[v0] 🎯 Modelo selecionado via Select:", value)
                      setSelectedAIModel(value as AIModel)
                    }}
                  >
                    <SelectTrigger id="ai-model-select" className="w-full">
                      <SelectValue placeholder="Selecione um modelo de IA" />
                    </SelectTrigger>
                    <SelectContent>
                      {AI_MODEL_OPTIONS.map((option) => {
                        const config = getAIModelConfig(option.value)
                        return (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <span>{option.label}</span>
                              {config.category === "recommended" && (
                                <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-medium rounded uppercase">
                                  Recomendado
                                </span>
                              )}
                              {config.category === "analysis-only" && (
                                <span className="px-1.5 py-0.5 bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 text-[10px] font-medium rounded uppercase">
                                  Análise
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Model details */}
                <div className="p-4 rounded-xl bg-card border border-border">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-1">
                        {getAIModelConfig(selectedAIModel).displayName}
                      </p>
                      <p className="text-xs text-muted-foreground">{getAIModelConfig(selectedAIModel).description}</p>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>{getAIModelConfig(selectedAIModel).rateLimit}</span>
                      </div>
                      {getAIModelConfig(selectedAIModel).freeTier && (
                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded uppercase">
                          Grátis
                        </span>
                      )}
                      {!getAIModelConfig(selectedAIModel).canGenerateImages && (
                        <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 text-xs font-medium rounded uppercase">
                          Não gera imagens
                        </span>
                      )}
                    </div>

                    {!getAIModelConfig(selectedAIModel).canGenerateImages && (
                      <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <p className="text-xs text-yellow-600 dark:text-yellow-500">
                          ⚠️ Este modelo é para análise de imagens apenas e não pode gerar transformações de looks.
                          Selecione um modelo Gemini para gerar imagens.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-card border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-1">
                      {getAIModelConfig(selectedAIModel).displayName}
                    </p>
                    <p className="text-xs text-muted-foreground">{getAIModelConfig(selectedAIModel).description}</p>
                  </div>
                  {getAIModelConfig(selectedAIModel).freeTier && (
                    <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded uppercase">
                      Grátis
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-theme-surface/50 rounded-xl border border-theme-border/20 text-center">
              <p className="text-[10px] text-theme-textMuted uppercase tracking-widest font-bold mb-1">Looks Criados</p>
              <p className="text-2xl font-serif text-theme-text">{stats.jobs}</p>
            </div>
            <div className="p-4 bg-theme-surface/50 rounded-xl border border-theme-border/20 text-center">
              <p className="text-[10px] text-theme-textMuted uppercase tracking-widest font-bold mb-1">Produtos</p>
              <p className="text-2xl font-serif text-theme-text">{stats.products}</p>
            </div>
            <div className="p-4 bg-theme-surface/50 rounded-xl border border-theme-border/20 text-center">
              <p className="text-[10px] text-theme-textMuted uppercase tracking-widest font-bold mb-1">Modelos</p>
              <p className="text-2xl font-serif text-theme-text">{stats.models}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-8 mt-8 border-t border-theme-border/20">
          <button
            onClick={onLogout}
            className="px-6 py-2 border border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors rounded uppercase text-xs font-bold tracking-widest flex items-center gap-2 group"
          >
            <svg
              className="w-4 h-4 group-hover:rotate-180 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Sair da Conta
          </button>
        </div>
      </div>
    </div>
  )
}
