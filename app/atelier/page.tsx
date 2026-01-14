"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { getUser, signOut } from "@/services/userService"
import { uploadBlobToStorage, createJob } from "@/services/storageService"
import { useAppData } from "@/hooks/use-app-data"
import { useJobWatcher } from "@/hooks/useJobWatcher"
import type { User, ImageAsset, TryOnStyle, TryOnJob, CartItem, Notification } from "@/types"
import { useTheme } from "@/context/ThemeContext"
import Logo from "@/components/Logo"
import ResultModal from "@/components/ResultModal"
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal"
import AddAssetModal from "@/components/AddAssetModal"

// Import Views
import { DashboardView } from "@/components/views/DashboardView"
import { StudioWizard } from "@/components/views/StudioWizard"
import { AssetLibraryView } from "@/components/views/AssetLibraryView"
import HistoryGallery from "@/components/HistoryGallery"
import { MyOrdersView } from "@/components/views/MyOrdersView"
import { StoreBuilderView } from "@/components/views/StoreBuilderView"
import { UserProfileView } from "@/components/views/UserProfileView"
import { CheckoutView } from "@/components/views/CheckoutView"
import { AllStoresView } from "@/components/views/AllStoresView"

type WorkflowStep =
  | "dashboard"
  | "products"
  | "models"
  | "studio"
  | "gallery"
  | "orders"
  | "store"
  | "profile"
  | "store-builder"
  | "my-orders"
  | "public-store"
  | "checkout"
  | "all-stores"

export default function AtelierPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [currentView, setCurrentView] = useState<WorkflowStep>("dashboard")
  const [viewingStoreId, setViewingStoreId] = useState<string | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [isGlobalLoading, setIsGlobalLoading] = useState(false) // Fix global loading initialization - should start as false
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<ImageAsset | null>(null)
  const [processingMessage, setProcessingMessage] = useState<string>("")
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)

  const [pollingJobId, setPollingJobId] = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<string>("")

  const { currentJob, isWatching, statusHistory, elapsedTime } = useJobWatcher({
    enabled: !!pollingJobId,
    jobId: pollingJobId,
    mode: "realtime", // Can be "polling" or "realtime"
    pollingInterval: 4000, // Only used if mode is "polling"
    onStatusChange: (job, prevStatus) => {
      console.log(`[v0][Atelier] Status changed: ${prevStatus} → ${job.status}`)

      // Update UI message based on status
      if (job.status === "queued") {
        setJobStatus("Job em fila, aguardando processamento...")
      } else if (job.status === "processing") {
        setJobStatus("Processando transformação com IA...")
      }
    },
    onComplete: (job) => {
      console.log("[v0][Atelier] Job completed:", job)
      setPollingJobId(null)
      setJobStatus("")
      setActiveJob(job)
      setShowResultModal(true)
      setIsGlobalLoading(false)
      loadData()
      addNotification({
        type: "success",
        title: "Look Revelado!",
        message: `Transformação concluída em ${Math.round(elapsedTime / 1000)}s`,
      })
    },
    onError: (error, job) => {
      console.error("[v0][Atelier] Job error:", error)
      setPollingJobId(null)
      setJobStatus("")
      setIsGlobalLoading(false)
      addNotification({
        type: "error",
        title: "Erro no Processamento",
        message: error || "Não foi possível processar a transformação.",
      })
    },
    timeoutMs: 5 * 60 * 1000, // 5 minutes
  })

  useEffect(() => {
    if (statusHistory.length > 0) {
      console.log("[v0][Atelier] Status history:", statusHistory)
    }
  }, [statusHistory])

  console.log("[v0] AtelierPage rendered, currentView:", currentView, "isGlobalLoading:", isGlobalLoading)

  const {
    assets,
    jobs,
    stats,
    loadData,
    handleImportAsset,
    handleToggleLikeAsset,
    handleToggleLikeJob,
    handleDeleteAsset,
    handleDeleteJob,
  } = useAppData(currentUser, currentView)

  console.log("[v0] Data state - assets:", assets.length, "jobs:", jobs.length, "stats:", stats)

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false)
  const [addModalType, setAddModalType] = useState<"product" | "model">("product")
  const [showResultModal, setShowResultModal] = useState(false)
  const [activeJob, setActiveJob] = useState<TryOnJob | null>(null)

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: "asset" | "job" } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Mobile Menu
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const abortControllerRef = useRef<AbortController | null>(null)
  const isLoadingUserRef = useRef(false)
  const authSubscriptionRef = useRef<{ unsubscribe: () => void } | null>(null)

  useEffect(() => {
    const init = async () => {
      console.log("[v0] Initializing atelier page")
      try {
        // Check URL params
        const params = new URLSearchParams(window.location.search)
        const storeParam = params.get("store")
        const viewParam = params.get("view") as WorkflowStep
        const tryOnProductId = params.get("tryOnProduct")
        const tryOnStoreId = params.get("tryOnStore")

        if (isLoadingUserRef.current) {
          console.log("[v0] User load already in progress, skipping")
          return
        }

        if (abortControllerRef.current) {
          console.log("[v0] Aborting previous user load request")
          abortControllerRef.current.abort()
        }

        abortControllerRef.current = new AbortController()

        isLoadingUserRef.current = true

        await new Promise((resolve) => setTimeout(resolve, 100))

        const user = await getUser()
        isLoadingUserRef.current = false

        console.log("[v0] User loaded:", user ? "Yes" : "No")

        if (!user) {
          console.log("[v0] No user, redirecting to login")
          router.push("/login")
          return
        }

        setCurrentUser(user)

        if (tryOnProductId && tryOnStoreId) {
          console.log("[v0] User returned to try on product:", tryOnProductId)
          setCurrentView("studio")
        } else if (storeParam) {
          setViewingStoreId(storeParam)
          router.push(`/loja/${storeParam}`)
        } else if (
          viewParam &&
          ["dashboard", "products", "models", "studio", "gallery", "profile", "store-builder", "my-orders"].includes(
            viewParam,
          )
        ) {
          setCurrentView(viewParam)
        } else {
          setCurrentView("dashboard")
        }

        console.log("[v0] Initialization complete, loading finished")
      } catch (error) {
        console.error("[v0] Init error:", error)
        isLoadingUserRef.current = false
      } finally {
        setIsGlobalLoading(false)
      }
    }

    init()

    if (authSubscriptionRef.current) {
      authSubscriptionRef.current.unsubscribe()
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("[v0] Auth state changed:", event)

      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && !isLoadingUserRef.current) {
        if (abortControllerRef.current) {
          console.log("[v0] Aborting previous auth state user load")
          abortControllerRef.current.abort()
        }

        abortControllerRef.current = new AbortController()

        isLoadingUserRef.current = true

        try {
          await new Promise((resolve) => setTimeout(resolve, 150))

          const user = await getUser()
          if (user) {
            setCurrentUser(user)
          }
        } catch (error: any) {
          if (error?.name === "AbortError") {
            console.log("[v0] User load aborted (expected)")
          } else {
            console.error("[v0] Error loading user after auth change:", error)
          }
        } finally {
          isLoadingUserRef.current = false
        }
      } else if (event === "SIGNED_OUT") {
        setCurrentUser(null)
        router.push("/")
      }
    })

    authSubscriptionRef.current = subscription

    return () => {
      console.log("[v0] Cleaning up atelier page")

      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }

      // Unsubscribe from auth changes
      if (authSubscriptionRef.current) {
        authSubscriptionRef.current.unsubscribe()
        authSubscriptionRef.current = null
      }

      // Reset loading flag
      isLoadingUserRef.current = false
    }
  }, [router])

  const handleNavigate = (view: WorkflowStep) => {
    console.log("[v0] Navigating to:", view)
    setCurrentView(view)
    setShowMobileMenu(false)
    if (view === "dashboard" || view === "products" || view === "models" || view === "studio") {
      loadData() // Refresh data on nav
    }
  }

  const handleLogout = async () => {
    console.log("[v0] 🚪 Logout initiated")
    try {
      console.log("[v0] 🔄 Calling signOut...")
      await signOut()
      console.log("[v0] ✅ SignOut completed successfully")

      console.log("[v0] 🧹 Clearing local state...")
      setCurrentUser(null)
      console.log("[v0] ✅ User state cleared")

      console.log("[v0] 🔄 Initiating redirect to landing page...")

      // Try multiple redirect methods for reliability
      try {
        router.push("/")
        console.log("[v0] ✅ router.push('/') executed")
      } catch (routerError) {
        console.error("[v0] ❌ router.push failed:", routerError)
        // Fallback to window.location
        console.log("[v0] 🔄 Trying window.location.href fallback...")
        window.location.href = "/"
      }

      // Additional fallback after short delay
      setTimeout(() => {
        console.log("[v0] ⏰ Redirect timeout - forcing navigation...")
        window.location.href = "/"
      }, 1000)
    } catch (error) {
      console.error("[v0] ❌ Logout error:", error)
      // Even on error, try to redirect
      console.log("[v0] 🔄 Error occurred, but still redirecting...")
      window.location.href = "/"
    }
  }

  const handleGenerateLook = async (
    product: ImageAsset,
    model: ImageAsset,
    style: TryOnStyle,
    instructions: string,
  ) => {
    console.log("[v0] 🚀 handleGenerateLook CALLED")
    console.log("[v0] Product ID:", product.id)
    console.log("[v0] Model ID:", model.id)
    console.log("[v0] Style:", style)
    console.log("[v0] Instructions:", instructions)
    console.log("[v0] Current User ID:", currentUser?.id)
    console.log("[v0] 🤖 Current User AI Model:", currentUser?.preferences?.aiModel) // Log AI model

    if (!currentUser) {
      console.log("[v0] ❌ No current user, aborting")
      return
    }

    setIsGlobalLoading(true)
    setJobStatus("Criando job...")
    console.log("[v0] Global loading set to true")

    try {
      console.log("[Atelier] 🎯 Criando job assíncrono")

      console.log("[v0] Calling createJob...")
      const createdJob = await createJob({
        userId: currentUser.id,
        productId: product.id!,
        modelId: model.id!,
        style,
        userInstructions: instructions,
        status: "queued",
      })

      console.log("[v0] createJob returned:", createdJob)

      if (!createdJob || !createdJob.id) {
        throw new Error("Falha ao criar job no banco de dados.")
      }

      console.log("[Atelier] ✅ Job criado:", createdJob.id)

      setJobStatus("Iniciando processamento...")

      console.log("[v0] 🚀 Dispatching process-job API call...")
      console.log("[v0] 🤖 User AI Model preference:", currentUser.preferences?.aiModel)

      const res = await fetch("/api/process-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: createdJob.id }),
      })
        .then(() => console.log("[v0] ✅ process-job fetch completed"))
        .catch((err) => {
          console.error("[Atelier] ❌ Erro ao iniciar processamento:", err)
          console.error("[v0] ❌ process-job fetch error:", err)
        })

      console.log("[v0] Resposta Fetch api :", res.status)
      console.log("[v0] Setting polling job ID:", createdJob.id)
      setPollingJobId(createdJob.id)
      setJobStatus("Job em fila, aguardando processamento...")

      console.log("[v0] Adding notification...")
      addNotification({
        type: "info",
        title: "Job Criado",
        message: "Seu look está sendo processado. Isso pode levar alguns segundos.",
      })
      console.log("[v0] ✅ handleGenerateLook completed successfully")
    } catch (error: any) {
      console.error("[Atelier] ❌ Erro:", error.message)
      console.error("[v0] ❌ handleGenerateLook ERROR:", error)
      setIsGlobalLoading(false) // Reset loading on error
      setJobStatus("")
      addNotification({
        type: "error",
        title: "Erro ao Criar Job",
        message: error.message || "Não foi possível iniciar o processamento.",
      })
    }
  }

  const handleAddToCart = (product: ImageAsset) => {
    setCart((prev) => [...prev, { ...product, cartId: Math.random().toString(36).substr(2, 9) } as CartItem])
  }

  const handleRemoveFromCart = (cartId: string) => {
    setCart((prev) => prev.filter((item) => (item as any).cartId !== cartId))
  }

  const handleSelectProduct = (product: ImageAsset) => {
    if (!currentUser) {
      router.push("/login")
      return
    }

    // Salva o produto
    sessionStorage.setItem("studio_product", JSON.stringify(product))

    // Verifica se já temos um modelo selecionado
    const savedModel = sessionStorage.getItem("studio_model")

    if (savedModel) {
      // Se TEM modelo, vai direto para o Atelier
      setCurrentView("studio")
    } else {
      // Se NÃO TEM modelo, redireciona para a galeria de modelos
      setCurrentView("models")
    }
  }

  const handleSelectModel = (model: ImageAsset) => {
    if (!currentUser) {
      router.push("/login")
      return
    }

    // Salva o modelo
    sessionStorage.setItem("studio_model", JSON.stringify(model))

    // Verifica se já temos um produto selecionado
    const savedProduct = sessionStorage.getItem("studio_product")

    if (savedProduct) {
      // Se TEM produto, vai direto para o Atelier
      setCurrentView("studio")
    } else {
      // Se NÃO TEM produto, redireciona para a galeria de produtos
      setCurrentView("products")
    }
  }

  const openAddModal = (type: "product" | "model") => {
    setAddModalType(type)
    setShowAddModal(true)
  }

  const handleSaveAsset = async (assetData: any) => {
    await handleImportAsset(addModalType, assetData)
    setShowAddModal(false)
    setSelectedAsset(null) // Clear selected asset after saving
  }

  const confirmDelete = async (strategy: "keep-history" | "delete-all") => {
    if (!itemToDelete) return
    setIsDeleting(true)
    try {
      if (itemToDelete.type === "asset") {
        await handleDeleteAsset(itemToDelete.id, strategy)
      } else {
        await handleDeleteJob(itemToDelete.id)
      }
      setDeleteModalOpen(false)
      setItemToDelete(null)
    } catch (err) {
      console.error("[v0] Delete error:", err)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteRequest = (e: React.MouseEvent, item: any, type: "asset" | "job") => {
    e.stopPropagation()
    setItemToDelete({ id: item.id, type })
    setDeleteModalOpen(true)
  }

  const handleShareUrl = async (e: React.MouseEvent, url: string, title: string) => {
    e.stopPropagation()
    if (navigator.share) {
      try {
        await navigator.share({ title, url })
      } catch (error) {
        console.log("[v0] Share cancelled")
      }
    } else {
      await navigator.clipboard.writeText(url)
      alert("Link copiado!")
    }
  }

  const handleAvatarChange = async (file: File) => {
    if (!currentUser) return
    try {
      const { publicUrl } = await uploadBlobToStorage(file, currentUser.id, "avatars")
      setCurrentUser({ ...currentUser, avatar: publicUrl })
    } catch (error) {
      console.error("[v0] Avatar upload error:", error)
      throw error
    }
  }

  const handleUserUpdate = (updatedUser: User) => {
    console.log("[v0] 🔄 handleUserUpdate called with:", updatedUser)
    setCurrentUser(updatedUser)
  }

  const menuItems = [
    {
      id: "dashboard",
      label: "VISÃO GERAL",
      icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    },
    { id: "products", label: "COLEÇÕES", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
    { id: "models", label: "MODELOS", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
    { id: "studio", label: "ATELIER", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
    {
      id: "gallery",
      label: "HISTÓRICO",
      icon: "M4 16l4.586-4.586a2.032 2.032 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 00-4-5.659V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
    },
    { id: "my-orders", label: "MEUS PEDIDOS", icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" },
    {
      id: "store-builder",
      label: "MINHA LOJA",
      icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z",
    },
  ]

  const addNotification = (notification: Omit<Notification, "id" | "read" | "timestamp">) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      read: false,
      timestamp: Date.now(),
    }
    setNotifications((prev) => [newNotification, ...prev])
  }

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const clearAllNotifications = () => {
    setNotifications([])
    setShowNotifications(false)
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  // Show job status in loading overlay
  if (isGlobalLoading) {
    console.log("[v0] Rendering global loading screen")
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-theme-accent border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
          <p className="text-theme-textMuted text-sm uppercase tracking-widest">Iniciando Espelho Meu...</p>
        </div>
      </div>
    )
  }

  console.log("[v0] Rendering main app, currentView:", currentView)

  const renderView = () => {
    switch (currentView) {
      case "dashboard":
        return (
          <DashboardView
            currentUser={currentUser}
            stats={stats}
            jobs={jobs}
            assets={assets}
            onNavigate={handleNavigate}
            onAction={(action) => {
              if (action === "add-product") openAddModal("product")
              else if (action === "add-model") openAddModal("model")
              else if (action === "create-look") handleNavigate("studio")
              else if (action === "view-history") handleNavigate("gallery")
            }}
            onSelectLook={(img) => {
              setActiveJob({ resultImage: img } as any)
              setShowResultModal(true)
            }}
            onToggleLikeJob={(e, job) => {
              e.stopPropagation()
              handleToggleLikeJob(job.id!)
            }}
            onDeleteJob={(e, id) => handleDeleteRequest(e, { id }, "job")}
            onShareUrl={handleShareUrl}
          />
        )
      case "products":
      case "models":
        return (
          <AssetLibraryView
            viewType={currentView === "products" ? "products" : "models"}
            assets={assets}
            onAdd={() => openAddModal(currentView === "products" ? "product" : "model")}
            onEdit={(asset) => {
              setSelectedAsset(asset)
              setAddModalType(currentView === "products" ? "product" : "model")
              setShowAddModal(true)
            }}
            onSharePage={() => {}}
            onToggleLike={(e, asset) => {
              e.stopPropagation()
              handleToggleLikeAsset(asset.id!)
            }}
            onShareUrl={(e, url) => {
              e.stopPropagation()
              navigator.clipboard.writeText(url)
              alert("Link copiado!")
            }}
            onUse={(e, asset) => {
              e.stopPropagation()
              if (currentView === "products") handleSelectProduct(asset)
              else handleSelectModel(asset)
            }}
            onDelete={(e, asset) => handleDeleteRequest(e, asset, "asset")}
            onViewStores={() => setCurrentView("all-stores")}
            isSellerMode={currentUser?.storeConfig?.isSalesPageEnabled}
          />
        )
      case "studio":
        return (
          <StudioWizard
            assets={assets}
            onNavigate={handleNavigate}
            onAddAsset={() => openAddModal("product")}
            onGenerate={handleGenerateLook}
            isProcessing={isProcessing}
            processingMessage={processingMessage}
          />
        )
      case "gallery":
        return (
          <HistoryGallery
            history={jobs.map((j) => ({
              id: j.id!,
              resultImage: j.resultImage!,
              timestamp: new Date(j.createdAt!).getTime(),
              productPreview: j.productPreview || assets.find((a) => a.id === j.productId)?.preview || "",
              modelPreview: assets.find((a) => a.id === j.modelId)?.preview || "",
              status: j.status,
              isFavorite: j.isFavorite,
              origin: j.productOwnerId && j.productOwnerId !== currentUser?.id ? "store" : "personal",
              storeName: j.storeName,
            }))}
            onSelect={(item) => {
              setActiveJob(jobs.find((j) => j.id === item.id) || null)
              setShowResultModal(true)
            }}
            onShare={() => {}}
            onDelete={(e, item) => handleDeleteRequest(e, item, "job")}
          />
        )
      case "my-orders":
        return <MyOrdersView onNavigate={handleNavigate} />
      case "store-builder":
        return (
          currentUser && (
            <StoreBuilderView
              currentUser={currentUser}
              onNavigate={handleNavigate}
              onPreviewStore={() => {
                setViewingStoreId(currentUser.id)
                router.push(`/loja/${currentUser.id}`)
              }}
            />
          )
        )
      case "profile":
        return (
          currentUser && (
            <UserProfileView
              currentUser={currentUser}
              stats={stats}
              onAvatarChange={handleAvatarChange}
              onLogout={handleLogout}
              onUserUpdate={handleUserUpdate}
            />
          )
        )
      case "checkout":
        return (
          <CheckoutView
            cart={cart}
            storeId={viewingStoreId}
            onNavigate={handleNavigate}
            onBack={() => setCurrentView("public-store")}
            onClearCart={() => setCart([])}
            onRemoveItem={handleRemoveFromCart}
          />
        )
      case "all-stores":
        return (
          <AllStoresView
            onNavigateToStore={(id) => {
              setViewingStoreId(id)
              router.push(`/loja/${id}`)
            }}
            onBack={() => router.push("/")}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-[#05010a] text-white font-sans">
      {/* Atmosphere Background - same as landing page */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 w-full h-[60vh] bg-gradient-to-b from-[#240046] via-[#3c096c] to-transparent opacity-80"></div>
        <div className="absolute top-[-10%] left-1/2 transform -translate-x-1/2 w-[80vw] h-[80vw] bg-luxury-gold/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 w-full h-[50vh] bg-gradient-to-t from-[#0f0219] via-[#150822] to-transparent"></div>
        <div className="absolute bottom-0 w-full h-[40vh] bg-[linear-gradient(to_bottom,transparent_0%,rgba(255,215,0,0.03)_50%,transparent_100%)] bg-[length:100%_4px]"></div>
      </div>

      <div className="flex flex-col lg:flex-row min-h-screen relative z-10">
        {/* SIDEBAR - DESKTOP */}
        {currentView !== "public-store" && (
          <aside className="hidden lg:flex w-64 bg-theme-surface border-r border-theme-border flex-col fixed h-screen z-40">
            {/* Logo */}
            <div className="p-6 border-b border-theme-border">
              <div className="flex items-center gap-3">
                <Logo variant="icon-only" className="w-10 h-10" animate={true} />
                <div>
                  <h1 className="text-sm font-serif font-bold gold-gradient-text tracking-wide">ESPELHO MEU</h1>
                  <p className="text-[8px] text-theme-textMuted uppercase tracking-widest">Atelier Virtual</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id as WorkflowStep)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all group ${
                    currentView === item.id
                      ? "gold-gradient-bg text-black font-bold shadow-lg"
                      : "text-theme-textMuted hover:bg-theme-accent/5 hover:text-theme-text"
                  }`}
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                  <span className="text-xs font-bold tracking-wider">{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="p-4 border-t border-theme-border bg-gradient-to-b from-theme-accent/20 to-[#05010a] backdrop-blur-sm relative">
              {/* Decorative Top Line Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-theme-accent/50 to-transparent"></div>

              <div className="flex items-center gap-3">
                {/* User Avatar */}
                <div className="relative">
                  {currentUser?.avatar ? (
                    <img
                      src={currentUser.avatar || "/placeholder.svg"}
                      alt={currentUser.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-theme-accent/30"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-theme-accent to-theme-secondary flex items-center justify-center text-black font-bold text-lg">
                      {currentUser?.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{currentUser?.name}</p>
                  <p className="text-[10px] text-theme-textMuted truncate">{currentUser?.email}</p>
                </div>

                {/* Settings Icon */}
                <button
                  onClick={() => handleNavigate("profile")}
                  className="p-2 hover:bg-theme-accent/10 rounded-lg transition-all group"
                  title="Configurações"
                >
                  <svg
                    className="w-5 h-5 text-theme-accent group-hover:rotate-90 transition-transform duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c-.94 1.543.826 3.31 2.37 2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </aside>
        )}

        {/* MOBILE HEADER */}
        <header className="lg:hidden fixed top-0 left-0 right-0 bg-theme-surface border-b border-theme-border z-50 px-4 py-3">
          <div className="flex items-center justify-between">
            <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="p-2">
              <svg className="w-6 h-6 text-theme-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Logo variant="icon-only" className="w-8 h-8" />
            <div className="w-8" />
          </div>
        </header>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
          <div className="hidden lg:flex items-center justify-end gap-3 px-6 py-4 bg-theme-surface/80 backdrop-blur-md border-b border-theme-border sticky top-0 z-30">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 hover:bg-theme-accent/10 rounded-lg transition-all group"
                title="Notificações"
              >
                <svg
                  className="w-6 h-6 text-theme-textMuted group-hover:text-theme-accent transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <>
                  {/* Backdrop to close dropdown when clicking outside */}
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />

                  {/* Notification Panel */}
                  <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-theme-surface border border-theme-border rounded-lg shadow-xl z-50">
                    {/* Header */}
                    <div className="sticky top-0 bg-theme-surface border-b border-theme-border px-4 py-3 flex items-center justify-between">
                      <h3 className="font-bold text-theme-text">Notificações</h3>
                      {notifications.length > 0 && (
                        <button
                          onClick={clearAllNotifications}
                          className="text-xs text-theme-textMuted hover:text-theme-accent transition-colors"
                        >
                          Limpar Tudo
                        </button>
                      )}
                    </div>

                    {/* Notification List */}
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <svg
                          className="w-12 h-12 mx-auto mb-3 text-theme-textMuted opacity-50"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                          />
                        </svg>
                        <p className="text-theme-textMuted text-sm">Nenhuma notificação</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-theme-border">
                        {notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => markNotificationAsRead(notif.id)}
                            className={`p-4 cursor-pointer transition-colors ${
                              notif.read
                                ? "bg-theme-surface hover:bg-theme-surface/80"
                                : "bg-theme-accent/5 hover:bg-theme-accent/10"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {/* Icon based on type */}
                              <div
                                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                  notif.type === "success"
                                    ? "bg-green-500/20 text-green-500"
                                    : notif.type === "error"
                                      ? "bg-red-500/20 text-red-500"
                                      : notif.type === "warning"
                                        ? "bg-yellow-500/20 text-yellow-500"
                                        : "bg-blue-500/20 text-blue-500"
                                }`}
                              >
                                {notif.type === "success" && (
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                )}
                                {notif.type === "error" && (
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                      fillRule="evenodd"
                                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 011.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                )}
                                {notif.type === "warning" && (
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                      fillRule="evenodd"
                                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 000 2v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                )}
                                {notif.type === "info" && (
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                      fillRule="evenodd"
                                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 000 2v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                )}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-theme-text mb-1">{notif.title}</p>
                                <p className="text-xs text-theme-textMuted line-clamp-2">{notif.message}</p>
                                <p className="text-xs text-theme-textMuted mt-1">
                                  {new Date(notif.timestamp).toLocaleString("pt-BR", {
                                    day: "2-digit",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>

                              {/* Unread indicator */}
                              {!notif.read && <div className="flex-shrink-0 w-2 h-2 bg-theme-accent rounded-full" />}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-all font-medium text-sm"
              title="Sair"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7v4h3v8h4v-8h3l1-4h-4V6a1 1 0 011-1h3z"
                />
              </svg>
              <span>Sair</span>
            </button>
          </div>

          <div className="flex-1 pt-16 lg:pt-0">{renderView()}</div>

          {/* Footer */}
          <footer className="mt-auto py-8 border-t border-theme-accent/20 bg-gradient-to-b from-theme-accent/20 to-[#05010a] relative overflow-hidden backdrop-blur-sm">
            {/* Decorative Top Line Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-theme-accent/50 to-transparent shadow-[0_0_20px_var(--color-accent)]"></div>

            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
              {/* Copyright & Brand */}
              <div className="text-center md:text-left">
                <p className="text-xs text-theme-accent font-bold uppercase tracking-[0.2em] mb-1">
                  Espelho Meu Atelier
                </p>
                <p className="text-[10px] text-white font-light tracking-wide">
                  &copy; {new Date().getFullYear()} Todos os direitos reservados.
                </p>
              </div>

              {/* Social Icons */}
              <div className="flex items-center gap-6">
                <a href="#" className="group relative p-2" aria-label="Instagram">
                  <div className="absolute inset-0 bg-theme-accent/0 group-hover:bg-theme-accent/10 rounded-full transition-all duration-300 scale-0 group-hover:scale-100"></div>
                  <svg
                    className="w-5 h-5 text-white group-hover:text-theme-accent transition-colors relative z-10"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17 2h-10c-2.76 0-5 2.24-5 5v10c0 2.76 2.24 5 5 5h10c2.76 0 5-2.24 5-5v-10c0-2.76-2.24-5-5-5zm-5 14c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1z" />
                  </svg>
                </a>

                <a href="#" className="group relative p-2" aria-label="Facebook">
                  <div className="absolute inset-0 bg-theme-accent/0 group-hover:bg-theme-accent/10 rounded-full transition-all duration-300 scale-0 group-hover:scale-100"></div>
                  <svg
                    className="w-5 h-5 text-white group-hover:text-theme-accent transition-colors relative z-10"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"
                    />
                  </svg>
                </a>

                <a href="#" className="group relative p-2" aria-label="TikTok">
                  <div className="absolute inset-0 bg-theme-accent/0 group-hover:bg-theme-accent/10 rounded-full transition-all duration-300 scale-0 group-hover:scale-100"></div>
                  <svg
                    className="w-5 h-5 text-white group-hover:text-theme-accent transition-colors relative z-10"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12a4 4 0 1 0 4 4V4a9 9 0 0 0 -9 -9v4"
                    />
                  </svg>
                </a>
              </div>

              {/* Legal Links */}
              <div className="flex gap-6 text-[10px] uppercase tracking-widest font-bold text-white">
                <a
                  href="#"
                  className="hover:text-theme-accent transition-colors flex items-center gap-1 hover:underline decoration-theme-accent/50"
                >
                  Termos de Uso
                </a>
                <a
                  href="#"
                  className="hover:text-theme-accent transition-colors flex items-center gap-1 hover:underline decoration-theme-accent/50"
                >
                  Privacidade
                </a>
                <a
                  href="#"
                  className="hover:text-theme-accent transition-colors flex items-center gap-1 hover:underline decoration-theme-accent/50"
                >
                  Suporte
                </a>
              </div>
            </div>
          </footer>
        </main>
      </div>

      <AddAssetModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleSaveAsset}
        type={addModalType}
        existingAsset={selectedAsset}
        isSellerMode={currentUser?.storeConfig?.isSalesPageEnabled}
      />

      <ResultModal
        isOpen={showResultModal}
        onClose={() => {
          setShowResultModal(false)
          // Se estiver no Studio e fechar o modal, vai para a galeria
          if (currentView === "studio") {
            handleNavigate("gallery")
          }
        }}
        imageUrl={activeJob?.resultImage || null}
        jobId={activeJob?.id}
        isPublic={activeJob?.isPublic}
      />

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title={itemToDelete?.type === "asset" ? "Excluir Item" : "Excluir Look"}
        message={
          itemToDelete?.type === "asset"
            ? "Tem certeza que deseja excluir este item do seu acervo?"
            : "Este look será permanentemente removido."
        }
        itemType={itemToDelete?.type || "job"}
        dependencyCount={0}
        isDeleting={isDeleting}
      />
    </div>
  )
}
