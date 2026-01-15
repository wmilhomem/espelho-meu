import type { HistoryItem, ImageAsset, TryOnJob, User, Order, CartItem } from "@/types"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { ensureAuthenticatedOrAbort } from "@/lib/auth-helpers"
import { handleSupabaseError } from "@/lib/error-handler"
import { logger } from "@/lib/logger"
import { addNotification as userAddNotification } from "./userService"
import { AI_MODELS } from "@/constants/ai-models"

const STORAGE_KEY = "espelho_meu_history"
const ASSETS_BUCKET = "espelho-assets"
const NOTIF_KEY = "espelho_meu_notifications_v1"

export const saveJobToHistory = (item: HistoryItem): void => {
  try {
    const history = getHistory()
    history.unshift(item)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch (error) {
    logger.error("Erro ao salvar histórico:", error)
  }
}

export const getHistory = (): HistoryItem[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    logger.error("Erro ao carregar histórico:", error)
    return []
  }
}

export const deleteHistoryItem = (itemId: string): void => {
  try {
    const history = getHistory()
    const filtered = history.filter((item) => item.id !== itemId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  } catch (error) {
    logger.error("Erro ao deletar item:", error)
  }
}

export const toggleJobVisibility = async (jobId: string, isPublic: boolean): Promise<void> => {
  try {
    const history = getHistory()
    const updated = history.map((item) => (item.id === jobId ? { ...item, isPublic } : item))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (error) {
    logger.error("Erro ao atualizar visibilidade:", error)
    throw error
  }
}

export const completeJob = async (jobId: string, resultBase64: string): Promise<TryOnJob | null> => {
  try {
    const supabase = getSupabaseBrowserClient()
    const session = await ensureAuthenticatedOrAbort()
    const blob = await base64ToBlob(resultBase64, "image/jpeg")
    const { publicUrl, path } = await uploadBlobToStorage(blob, session.user.id, "results")

    const { data, error } = await supabase
      .from("jobs")
      .update({ status: "completed", result_public_url: publicUrl })
      .eq("id", jobId)
      .select()
      .single()
    if (error) throw error

    return {
      id: data.id,
      userId: data.user_id,
      productId: data.product_id,
      modelId: data.model_id,
      userInstructions: data.user_instructions,
      style: data.style,
      status: data.status,
      resultImage: data.result_public_url,
      createdAt: data.created_at,
      isFavorite: data.is_favorite,
      isPublic: data.is_public,
    }
  } catch (e) {
    throw handleSupabaseError(e, "Completar Job")
  }
}

export const failJob = async (jobId: string): Promise<void> => {
  const supabase = getSupabaseBrowserClient()
  await supabase.from("jobs").update({ status: "failed" }).eq("id", jobId)
}

export const createJob = async (job: TryOnJob): Promise<TryOnJob | null> => {
  try {
    logger.debug("createJob - START")
    logger.debug("Job payload:", {
      userId: job.userId,
      productId: job.productId,
      modelId: job.modelId,
      style: job.style,
      status: job.status,
    })

    logger.debug("Checking authentication...")
    const session = await ensureAuthenticatedOrAbort()
    logger.debug("✅ Authentication OK, user:", session.user.id)

    const newJob = {
      user_id: session.user.id,
      model_id: job.modelId,
      product_id: job.productId,
      status: job.status || "queued",
      style: job.style || "editorial",
      user_instructions: job.userInstructions || "Atelier.",
      is_favorite: false,
      is_public: false,
    }

    logger.debug("Inserting job into database...")
    logger.debug("Insert payload:", newJob)

    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase.from("jobs").insert([newJob]).select().single()

    if (error) {
      logger.error("❌ Database insert error:", error)
      throw error
    }

    logger.debug("✅ Job inserted successfully, ID:", data.id)
    logger.debug("Job data from DB:", data)

    const result = {
      id: data.id,
      userId: data.user_id,
      productId: data.product_id,
      modelId: data.model_id,
      userInstructions: data.user_instructions,
      style: data.style,
      status: data.status,
      createdAt: data.created_at,
      isFavorite: data.is_favorite,
      isPublic: data.is_public,
    }

    logger.debug("createJob - END, returning:", result)
    return result
  } catch (e) {
    logger.error("❌ createJob - ERROR:", e)
    throw handleSupabaseError(e, "Criar Job")
  }
}

export const updateJobStatus = (
  jobId: string,
  status: "processing" | "completed" | "failed",
  resultImage?: string,
): void => {
  try {
    const history = getHistory()
    const updated = history.map((item) =>
      item.id === jobId ? { ...item, status, ...(resultImage && { resultImage }) } : item,
    )
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (error) {
    logger.error("Erro ao atualizar status:", error)
  }
}

export async function uploadBlobToStorage(
  fileOrBlob: File | Blob,
  userId: string,
  folder: "uploads" | "results" | "avatars" | "products" | "models" | "banners",
): Promise<{ publicUrl: string; path: string }> {
  try {
    logger.debug("uploadBlobToStorage - Iniciando upload", {
      folder,
      size: fileOrBlob.size,
      type: fileOrBlob.type,
    })

    await ensureAuthenticatedOrAbort()
    logger.debug("uploadBlobToStorage - Autenticação verificada")

    const timestamp = Date.now()
    // Verifica se é File para pegar o nome, senão usa o padrão
    const fileNameRaw = (fileOrBlob as File).name || "image.jpg"
    const safeName = fileNameRaw.replace(/[^a-zA-Z0-9.-]/g, "_")
    const filePath = `${userId}/${folder}/${timestamp}_${safeName}`
    const contentType = fileOrBlob.type || "image/jpeg" // Determina o tipo explicitamente

    logger.debug("uploadBlobToStorage - Iniciando upload para Supabase Storage", {
      filePath,
      contentType,
    })

    const supabase = getSupabaseBrowserClient()
    const uploadPromise = supabase.storage.from(ASSETS_BUCKET).upload(filePath, fileOrBlob, {
      cacheControl: "3600",
      upsert: false,
      contentType: contentType,
    })

    // Timeout de 60 segundos
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Upload timeout após 60 segundos")), 60000),
    )

    const { data, error } = (await Promise.race([uploadPromise, timeoutPromise])) as any

    if (error) {
      logger.error("uploadBlobToStorage - Erro no upload:", error)
      throw error
    }

    logger.debug("uploadBlobToStorage - Upload concluído com sucesso:", data.path)

    // Obter URL Pública
    const { data: publicData } = supabase.storage.from(ASSETS_BUCKET).getPublicUrl(data.path)

    logger.debug("uploadBlobToStorage - URL pública gerada:", publicData.publicUrl)

    return { publicUrl: publicData.publicUrl, path: data.path }
  } catch (error) {
    logger.error("uploadBlobToStorage - ERRO COMPLETO:", error)
    throw handleSupabaseError(error, "Upload de Arquivo")
  }
}

export const addNotification = userAddNotification

export const getAssets = async (type?: string, userId?: string, onlyPublished?: boolean): Promise<ImageAsset[]> => {
  let targetUserId = userId

  if (!targetUserId) {
    const {
      data: { user },
    } = await getSupabaseBrowserClient().auth.getUser()
    if (!user) return []
    targetUserId = user.id
  }

  logger.debug("getAssets: Fetching assets for user:", targetUserId, "type:", type, "onlyPublished:", onlyPublished)

  let query = getSupabaseBrowserClient()
    .from("assets")
    .select("*")
    .eq("user_id", targetUserId)
    .order("created_at", { ascending: false })

  if (type) {
    query = query.eq("type", type)
  }

  if (onlyPublished) {
    query = query.eq("published", true)
  }

  const { data, error } = await query

  if (error) {
    logger.error("getAssets: Error fetching assets:", error)
    throw error
  }

  logger.debug("getAssets: Found", data?.length || 0, "assets")

  return (
    data?.map((item: any) => ({
      id: item.id,
      user_id: item.user_id,
      name: item.name,
      description: item.description,
      category: item.category,
      type: item.type,
      source: "url" as const,
      preview: item.public_url,
      mimeType: item.mime_type || "image/jpeg",
      createdAt: item.created_at,
      isFavorite: item.is_favorite || false,
      storage_path: item.storage_path,
      price: item.price,
      published: item.published,
    })) || []
  )
}

export const updateAsset = async (assetId: string, updates: Partial<ImageAsset>): Promise<void> => {
  try {
    const payload: any = {}
    if (updates.published !== undefined) payload.published = updates.published
    if (updates.price !== undefined) payload.price = updates.price
    await getSupabaseBrowserClient().from("assets").update(payload).eq("id", assetId)
  } catch (e) {
    throw handleSupabaseError(e, "Atualizar Asset")
  }
}

export const getUserOrders = async (): Promise<Order[]> => {
  try {
    const session = await ensureAuthenticatedOrAbort()

    const { data: orders, error } = await getSupabaseBrowserClient()
      .from("orders")
      .select(`
                *, 
                items:order_items(*)
            `)
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })

    if (error) throw error
    if (!orders || orders.length === 0) return []

    const storeIds = Array.from(new Set(orders.map((o: any) => o.store_id).filter(Boolean)))

    const storeMap: Record<string, string> = {}
    if (storeIds.length > 0) {
      const { data: stores, error: storeError } = await getSupabaseBrowserClient()
        .from("profiles")
        .select("id, name, preferences")
        .in("id", storeIds)

      if (!storeError && stores) {
        stores.forEach((s: any) => {
          const storeName = s.preferences?.store_name || s.name || "Loja Parceira"
          storeMap[s.id] = storeName
        })
      }
    }

    return orders.map((order: any) => ({
      ...order,
      store_name: storeMap[order.store_id] || "Loja",
    }))
  } catch (e) {
    logger.error("Erro ao buscar meus pedidos:", e.message || JSON.stringify(e))
    return []
  }
}

export const createOrder = async (
  storeId: string,
  customerDetails: any,
  items: CartItem[],
  total: number,
): Promise<Order | null> => {
  try {
    const session = await ensureAuthenticatedOrAbort()
    const { data: orderData, error: orderError } = await getSupabaseBrowserClient()
      .from("orders")
      .insert([
        {
          store_id: storeId,
          user_id: session.user.id,
          customer_details: customerDetails,
          total_amount: total,
          status: "paid",
          payment_method: "credit_card",
        },
      ])
      .select()
      .single()
    if (orderError) throw orderError

    const orderItemsPayload = items.map((item) => ({
      order_id: orderData.id,
      asset_id: item.id,
      quantity: 1,
      price_at_purchase: item.price || 0,
      product_name: item.name,
      product_image: item.preview,
    }))
    await getSupabaseBrowserClient().from("order_items").insert(orderItemsPayload)
    return orderData
  } catch (e) {
    throw handleSupabaseError(e, "Criar Pedido")
  }
}

export const getStoreOrders = async (): Promise<Order[]> => {
  try {
    const session = await ensureAuthenticatedOrAbort()
    const { data, error } = await getSupabaseBrowserClient()
      .from("orders")
      .select(`*, items:order_items(*)`)
      .eq("store_id", session.user.id)
      .order("created_at", { ascending: false })
    if (error) throw error
    return data || []
  } catch (e) {
    return []
  }
}

export const updateUserProfile = async (
  userId: string,
  updates: Partial<User> & { storeConfig?: any },
): Promise<void> => {
  logger.debug("[storageService] 🔄 Updating user profile:", userId)
  logger.debug("[storageService] Updates received:", JSON.stringify(updates, null, 2))

  if (updates.preferences?.aiModel) {
    const validModels = Object.values(AI_MODELS)
    if (!validModels.includes(updates.preferences.aiModel as any)) {
      throw new Error(`Modelo de IA inválido: ${updates.preferences.aiModel}`)
    }
    logger.debug("[storageService] ✅ AI model validated:", updates.preferences.aiModel)
  }

  // 1. Buscar dados atuais para garantir integridade
  const { data: current, error: fetchError } = await getSupabaseBrowserClient()
    .from("profiles")
    .select("preferences, name")
    .eq("id", userId)
    .single()

  if (fetchError) {
    logger.error("[storageService] ❌ Error fetching current profile:", fetchError)
    throw fetchError
  }

  logger.debug("[storageService] Current preferences:", current?.preferences)

  // 2. Preparar as novas preferências mantendo o que já existe
  const oldPrefs = current?.preferences || {}
  const newPrefs = { ...oldPrefs }

  if (updates.preferences) {
    Object.assign(newPrefs, updates.preferences)
    logger.debug("[storageService] Merged preferences:", newPrefs)
  }

  // 3. Mapear storeConfig para dentro do JSON preferences
  if (updates.storeConfig) {
    const sc = updates.storeConfig
    if (sc.isSalesPageEnabled !== undefined) newPrefs.is_sales_enabled = sc.isSalesPageEnabled
    if (sc.storeName !== undefined) newPrefs.store_name = sc.storeName
    if (sc.storeLogo !== undefined) newPrefs.store_logo = sc.storeLogo
    if (sc.storeBanner !== undefined) newPrefs.store_banner = sc.storeBanner
    if (sc.whatsapp !== undefined) newPrefs.whatsapp = sc.whatsapp
    if (sc.kyc !== undefined) newPrefs.kyc_data = sc.kyc
  }

  logger.debug("[storageService] Final preferences to save:", newPrefs)

  // 4. Update único e atômico
  const { error: updateError } = await getSupabaseBrowserClient()
    .from("profiles")
    .update({
      name: updates.name || current.name,
      preferences: newPrefs,
    })
    .eq("id", userId)

  if (updateError) {
    logger.error("[storageService] ❌ Error updating profile:", updateError)
    throw updateError
  }

  logger.debug("[storageService] ✅ Profile updated successfully")
}

export const uploadUserAvatar = async (userId: string, fileOrBase64: File | string): Promise<string | null> => {
  try {
    let blob: Blob
    // Se for string (base64 ou url), converte. Se for File/Blob, usa direto.
    if (typeof fileOrBase64 === "string") {
      blob = await base64ToBlob(fileOrBase64, "image/jpeg")
    } else {
      blob = fileOrBase64
    }

    const { publicUrl } = await uploadBlobToStorage(blob, userId, "avatars")

    // Atualiza a tabela profiles com a nova URL
    const { error } = await getSupabaseBrowserClient()
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", userId)

    if (error) {
      logger.error("Erro ao atualizar profile DB com avatar:", error)
      throw error
    }

    return publicUrl
  } catch (e) {
    logger.error("Falha no uploadUserAvatar:", e)
    return null
  }
}

export const uploadStoreLogo = async (userId: string, file: File): Promise<string | null> => {
  try {
    const { publicUrl } = await uploadBlobToStorage(file, userId, "uploads")
    return publicUrl
  } catch (e) {
    return null
  }
}

export const signInWithEmail = async (email: string, password: string) =>
  getSupabaseBrowserClient().auth.signInWithPassword({ email, password })
export const signInWithGoogle = async () =>
  getSupabaseBrowserClient().auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin },
  })
export const signUpWithEmail = async (email: string, password: string, name: string) => {
  const authResponse = await getSupabaseBrowserClient().auth.signUp({
    email,
    password,
    options: { data: { full_name: name } },
  })
  if (authResponse.data?.user) {
    getSupabaseBrowserClient()
      .from("profiles")
      .insert([{ id: authResponse.data.user.id, name, plan: "free" }])
      .then(() => {})
  }
  return authResponse
}

export const getStoreBannersFromStorage = async (storeId: string): Promise<string[]> => {
  try {
    const { data, error } = await getSupabaseBrowserClient()
      .storage.from(ASSETS_BUCKET)
      .list(`${storeId}/banners`, {
        limit: 10,
        offset: 0,
        sortBy: { column: "created_at", order: "desc" },
      })

    if (error || !data || data.length === 0) return []

    const urls = data.map((file) => {
      const { data: publicData } = getSupabaseBrowserClient()
        .storage.from(ASSETS_BUCKET)
        .getPublicUrl(`${storeId}/banners/${file.name}`)
      return publicData.publicUrl
    })

    return urls
  } catch (error) {
    logger.error("Error fetching banners from storage:", error)
    return []
  }
}

// --- USER PROFILE ---

export const getCurrentUserProfile = async (): Promise<User | null> => {
  try {
    // 1. Tentar obter usuário da sessão (fonte da verdade de autenticação)
    const {
      data: { user },
      error: userError,
    } = await getSupabaseBrowserClient().auth.getUser()

    if (userError || !user) {
      // Se realmente não tiver usuário, retorna null (não logado)
      return null
    }

    let profile = null

    // 2. Tentar buscar perfil no banco de dados com tratamento de erro isolado
    try {
      const { data, error } = await getSupabaseBrowserClient()
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle()
      if (!error && data) {
        profile = data
      }
    } catch (dbError) {
      logger.warn("Aviso: Falha ao buscar perfil no DB, usando dados da sessão.", dbError)
    }

    // 3. Fallback Robusto: Se não achou perfil no DB ou deu erro, cria objeto User a partir da sessão
    // Isso garante que o usuário consiga entrar no app mesmo se a tabela profiles estiver com problemas
    if (!profile) {
      const name = (user.user_metadata as any)?.full_name || user.email?.split("@")[0] || "Usuário"
      return {
        id: user.id,
        name: name,
        email: user.email || "",
        plan: "free",
        preferences: { emailNotifications: true },
      }
    }

    // 4. Se perfil existe, processa os dados
    let avatarUrl = profile.avatar_url
    if (avatarUrl && !avatarUrl.startsWith("http")) {
      const { data } = getSupabaseBrowserClient().storage.from(ASSETS_BUCKET).getPublicUrl(avatarUrl)
      avatarUrl = data.publicUrl
    }

    const prefs = profile.preferences || {}

    return {
      id: profile.id,
      name: profile.name,
      email: user.email || "",
      avatar: avatarUrl,
      plan: profile.plan || "free",
      preferences: prefs,
      storeConfig: {
        isSalesPageEnabled: prefs.is_sales_enabled ?? profile.is_sales_enabled ?? false,
        storeName: prefs.store_name || profile.store_name || "",
        storeLogo: prefs.store_logo || profile.store_logo || "",
        storeBanner: prefs.store_banner || "",
        storeStyle: prefs.store_style || undefined,
        whatsapp: prefs.whatsapp || profile.whatsapp || "",
        socialLinks: prefs.social_links || {},
        kyc: prefs.kyc_data || undefined,
      },
    }
  } catch (err) {
    // Erro crítico na sessão de auth
    logger.error("Erro fatal na verificação de autenticação:", err)
    return null
  }
}

export const getStoreProfile = async (
  storeId: string,
): Promise<{ name: string; logo: string; banner: string; whatsapp: string; socialLinks?: any } | null> => {
  try {
    const { data: profile } = await getSupabaseBrowserClient()
      .from("profiles")
      .select("name, avatar_url, preferences")
      .eq("id", storeId)
      .single()
    if (!profile) return null

    const prefs = profile.preferences || {}

    return {
      name: prefs.store_name || profile.name || "Loja Desconhecida",
      logo: prefs.store_logo || profile.avatar_url || "",
      banner: prefs.store_banner || "",
      whatsapp: prefs.whatsapp || "",
      socialLinks: prefs.social_links || {},
    }
  } catch {
    return null
  }
}

export const getJobs = async (limit = 50): Promise<TryOnJob[]> => {
  const {
    data: { user },
  } = await getSupabaseBrowserClient().auth.getUser()
  if (!user) return []

  const { data, error } = await getSupabaseBrowserClient()
    .from("jobs")
    .select(`
      *, 
      product:assets!jobs_product_id_fkey (
        user_id, 
        public_url,
        name
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) throw error

  return (
    data?.map((job: any) => ({
      id: job.id,
      userId: job.user_id,
      productId: job.product_id,
      modelId: job.model_id,
      userInstructions: job.user_instructions,
      status: job.status,
      style: job.style || "editorial",
      resultImage: job.result_public_url,
      createdAt: job.created_at,
      isFavorite: job.is_favorite || false,
      isPublic: job.is_public,
      productOwnerId: job.product?.user_id,
      productPreview: job.product?.public_url,
      productName: job.product?.name,
    })) || []
  )
}

export const createAsset = async (assetData: Omit<ImageAsset, "id" | "createdAt">): Promise<ImageAsset> => {
  return saveAsset((await ensureAuthenticatedOrAbort()).user.id, assetData as ImageAsset, assetData.data || "")
}

export const getStatsCount = async () => {
  const {
    data: { user },
  } = await getSupabaseBrowserClient().auth.getUser()
  if (!user) return { products: 0, models: 0, jobs: 0, processing: 0 }

  const [products, models, jobs, processing] = await Promise.all([
    getSupabaseBrowserClient()
      .from("assets")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("type", "product"),
    getSupabaseBrowserClient()
      .from("assets")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("type", "model"),
    getSupabaseBrowserClient().from("jobs").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    getSupabaseBrowserClient()
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "processing"),
  ])

  return {
    products: products.count || 0,
    models: models.count || 0,
    jobs: jobs.count || 0,
    processing: processing.count || 0,
  }
}

export const saveAsset = async (userId: string, asset: ImageAsset, base64Data: string) => {
  try {
    let publicUrl = asset.preview
    let storagePath = ""
    if (base64Data) {
      const blob = await base64ToBlob(base64Data, asset.mimeType)
      const up = await uploadBlobToStorage(blob, userId, "uploads")
      publicUrl = up.publicUrl
      storagePath = up.path
    }
    const { data, error } = await getSupabaseBrowserClient()
      .from("assets")
      .insert([
        {
          user_id: userId,
          name: asset.name,
          description: asset.description,
          category: asset.category,
          type: asset.type,
          public_url: publicUrl,
          storage_path: storagePath,
          mime_type: asset.mimeType,
          is_favorite: false,
          price: asset.price,
          published: asset.published,
        },
      ])
      .select()
      .single()
    if (error) throw error
    return { ...asset, id: data.id, preview: data.public_url }
  } catch (e) {
    throw handleSupabaseError(e, "Salvar Asset")
  }
}

export const deleteAssetWithStrategy = async (
  assetId: string,
  strategy: "keep-history" | "delete-all",
): Promise<void> => {
  if (strategy === "delete-all") {
    await getSupabaseBrowserClient().from("jobs").delete().or(`product_id.eq.${assetId},model_id.eq.${assetId}`)
  }

  const { error } = await getSupabaseBrowserClient().from("assets").delete().eq("id", assetId)
  if (error) throw error
}

export const deleteJobFull = async (jobId: string): Promise<void> => {
  const { error } = await getSupabaseBrowserClient().from("jobs").delete().eq("id", jobId)
  if (error) throw error
}

export const toggleAssetFavorite = async (assetId: string, currentFavorite: boolean): Promise<void> => {
  const { error } = await getSupabaseBrowserClient()
    .from("assets")
    .update({ is_favorite: !currentFavorite })
    .eq("id", assetId)

  if (error) throw error
}

export const toggleJobFavorite = async (jobId: string, currentFavorite: boolean): Promise<void> => {
  const { error } = await getSupabaseBrowserClient()
    .from("jobs")
    .update({ is_favorite: !currentFavorite })
    .eq("id", jobId)

  if (error) throw error
}

export const getStoreNamesByIds = async (userIds: string[]): Promise<Record<string, string>> => {
  if (userIds.length === 0) return {}

  const { data, error } = await getSupabaseBrowserClient()
    .from("profiles")
    .select("id, name, preferences")
    .in("id", userIds)

  if (error) throw error

  const storeMap: Record<string, string> = {}
  data?.forEach((profile) => {
    if (profile.id) {
      const prefs = profile.preferences || {}
      storeMap[profile.id] = prefs.store_name || profile.name || "Loja sem nome"
    }
  })

  return storeMap
}

export const getAllStores = async () => {
  try {
    const { data, error } = await getSupabaseBrowserClient()
      .from("profiles")
      .select("id, name, avatar_url, preferences")
      .not("preferences", "is", null)

    if (error) {
      logger.error("[v0] Profiles table error:", error.message)
      return []
    }

    const activeStores = data
      ?.filter((profile: any) => {
        const prefs = profile.preferences || {}
        return prefs.is_sales_enabled === true
      })
      .map((profile: any) => {
        const prefs = profile.preferences || {}
        return {
          id: profile.id,
          name: prefs.store_name || profile.name || "Loja sem nome",
          logo: prefs.store_logo || profile.avatar_url || "",
          banner: prefs.store_banner || "",
          style: prefs.store_style || "Variado",
          whatsapp: prefs.whatsapp || "",
        }
      })

    return activeStores || []
  } catch (error) {
    logger.error("[v0] Database error in getAllStores:", error)
    return []
  }
}

export const base64ToBlob = async (base64: string, contentType: string): Promise<Blob> => {
  const response = await fetch(base64)
  const blob = await response.blob()
  return blob
}

export const getJobById = async (jobId: string): Promise<TryOnJob | null> => {
  try {
    const { data, error } = await getSupabaseBrowserClient().from("jobs").select("*").eq("id", jobId).single()

    if (error) throw error

    return {
      id: data.id,
      userId: data.user_id,
      productId: data.product_id,
      modelId: data.model_id,
      userInstructions: data.user_instructions,
      style: data.style,
      status: data.status,
      resultImage: data.result_public_url,
      createdAt: data.created_at,
      isFavorite: data.is_favorite,
      isPublic: data.is_public,
      ai_model_used: data.ai_model_used,
      prompt_version: data.prompt_version,
      pipeline_version: data.pipeline_version,
      error_message: data.error_message,
      started_at: data.started_at,
      completed_at: data.completed_at,
    }
  } catch (e) {
    throw handleSupabaseError(e, "Get Job By ID")
  }
}
