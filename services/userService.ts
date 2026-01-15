import { getSupabaseBrowserClient } from "../lib/supabase"
import type { User, ImageAsset, TryOnJob, Notification, ImageAssetType, Order, CartItem } from "../types"
import { AI_MODELS } from "../constants/ai-models"

const ASSETS_BUCKET = "espelho-assets"

const handleSupabaseError = (error: any, context: string) => {
  console.error(`[${context}]`, error)
  return new Error(error.message || "Erro desconhecido")
}

const base64ToBlob = async (base64: string, mimeType: string): Promise<Blob> => {
  const base64Clean = base64.replace(/^data:image\/\w+;base64,/, "")
  const byteCharacters = atob(base64Clean)
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  return new Blob([byteArray], { type: mimeType })
}

const getStoragePathFromUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split("/storage/v1/object/public/assets/")
    return pathParts[1] || null
  } catch {
    return null
  }
}

async function ensureAuthenticatedOrAbort() {
  const supabase = getSupabaseBrowserClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (session?.user) return session
  throw handleSupabaseError({ message: "Usuário não autenticado" }, "Autenticação")
}

export async function uploadBlobToStorage(
  fileOrBlob: File | Blob,
  userId: string,
  folder: "uploads" | "results" | "avatars" | "products" | "models" | "banners",
): Promise<{ publicUrl: string; path: string }> {
  try {
    await ensureAuthenticatedOrAbort()
    const supabase = getSupabaseBrowserClient()

    const timestamp = Date.now()
    const fileNameRaw = (fileOrBlob as File).name || "image.jpg"
    const safeName = fileNameRaw.replace(/[^a-zA-Z0-9.-]/g, "_")
    const filePath = `${userId}/${folder}/${timestamp}_${safeName}`
    const contentType = fileOrBlob.type || "image/jpeg"

    const { data, error } = await supabase.storage.from(ASSETS_BUCKET).upload(filePath, fileOrBlob, {
      cacheControl: "3600",
      upsert: false,
      contentType: contentType,
    })

    if (error) throw error

    const { data: publicData } = supabase.storage.from(ASSETS_BUCKET).getPublicUrl(data.path)

    return { publicUrl: publicData.publicUrl, path: data.path }
  } catch (error: any) {
    console.error("Upload Failed:", error)
    throw handleSupabaseError(error, "Upload de Arquivo")
  }
}

export const getCurrentUserProfile = async (): Promise<User | null> => {
  try {
    const supabase = getSupabaseBrowserClient()
    let user = null
    try {
      const {
        data: { user: authUser },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !authUser) {
        return null
      }
      user = authUser
    } catch (authError: any) {
      if (authError?.name === "AbortError") {
        console.log("[v0] userService: getUser aborted (expected)")
        return null
      }
      throw authError
    }

    let profile = null

    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()
      if (!error && data) {
        profile = data
      }
    } catch (dbError: any) {
      if (dbError?.name === "AbortError") {
        console.log("[v0] userService: profile query aborted (expected)")
        return null
      }
      console.warn("Aviso: Falha ao buscar perfil no DB, usando dados da sessão.", dbError)
    }

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

    let avatarUrl = profile.avatar_url
    if (avatarUrl && !avatarUrl.startsWith("http")) {
      const { data } = supabase.storage.from(ASSETS_BUCKET).getPublicUrl(avatarUrl)
      avatarUrl = data.publicUrl
    }

    const prefs = profile.preferences || {}

    const aiModelFromColumn = profile.ai_model
    const aiModelFromPrefs = prefs.aiModel

    console.log("[v0] userService: Loading user profile, banner data:", prefs.store_banner)
    console.log("[v0] userService: ai_model from column:", aiModelFromColumn)
    console.log("[v0] userService: aiModel from preferences:", aiModelFromPrefs)

    // Priority: column value > preferences value > default
    const finalAIModel = aiModelFromColumn || aiModelFromPrefs || "gemini-2.5-flash-image-preview"
    console.log("[v0] userService: Final AI Model:", finalAIModel)

    return {
      id: profile.id,
      name: profile.name,
      email: user.email || "",
      avatar: avatarUrl,
      plan: profile.plan || "free",
      preferences: {
        ...prefs,
        aiModel: finalAIModel, // Always include in preferences
      },
      storeConfig: {
        isSalesPageEnabled: prefs.is_sales_enabled ?? profile.is_sales_enabled ?? false,
        storeName: prefs.store_name || profile.store_name || "",
        storeLogo: prefs.store_logo || profile.store_logo || "",
        storeBanner: prefs.store_banner || profile.store_banner || "",
        storeStyle: prefs.store_style || undefined,
        whatsapp: prefs.whatsapp || profile.whatsapp || "",
        socialLinks: prefs.social_links || {},
        kyc: prefs.kyc_data || undefined,
      },
    }
  } catch (err: any) {
    if (err?.name === "AbortError") {
      console.log("[v0] userService: Operation aborted")
      return null
    }
    console.error("Erro fatal na verificação de autenticação:", err)
    return null
  }
}

export const getUser = getCurrentUserProfile

export const updateUserProfile = async (
  userId: string,
  updates: Partial<User> & { storeConfig?: any },
): Promise<void> => {
  try {
    console.log("[v0] 📝 updateUserProfile - START")
    console.log("[v0] userId:", userId)
    console.log("[v0] updates:", JSON.stringify(updates, null, 2))

    const supabase = getSupabaseBrowserClient()
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("preferences, ai_model")
      .eq("id", userId)
      .single()
    const currentPrefs = currentProfile?.preferences || {}

    console.log("[v0] Current preferences from DB:", JSON.stringify(currentPrefs, null, 2))
    console.log("[v0] Current ai_model column from DB:", currentProfile?.ai_model)

    const payload: any = {}
    if (updates.name) payload.name = updates.name

    let newPrefs = { ...currentPrefs }
    if (updates.preferences) {
      console.log("[v0] Merging new preferences:", JSON.stringify(updates.preferences, null, 2))
      newPrefs = { ...newPrefs, ...updates.preferences }

      if (updates.preferences.aiModel) {
        const aiModel = updates.preferences.aiModel as string
        console.log("[v0] 🤖 AI Model being saved:", aiModel)

        const validModels = Object.values(AI_MODELS)
        console.log("[v0] Valid AI models:", validModels)

        if (!validModels.includes(aiModel as any)) {
          console.error("[v0] ❌ Invalid AI model:", aiModel)
          console.error("[v0] Valid models:", validModels)
          throw new Error(`Modelo de IA inválido: ${aiModel}. Modelos válidos: ${validModels.join(", ")}`)
        }

        console.log("[v0] ✅ AI Model validated successfully")

        newPrefs.aiModel = aiModel
        payload.ai_model = aiModel

        console.log("[v0] 💾 Saving aiModel to preferences.aiModel:", aiModel)
        console.log("[v0] 💾 Saving aiModel to ai_model column:", aiModel)
      }
    }

    if (updates.storeConfig) {
      console.log("[v0] Merging store config:", JSON.stringify(updates.storeConfig, null, 2))
      if (updates.storeConfig.isSalesPageEnabled !== undefined)
        newPrefs.is_sales_enabled = updates.storeConfig.isSalesPageEnabled
      if (updates.storeConfig.storeName !== undefined) newPrefs.store_name = updates.storeConfig.storeName
      if (updates.storeConfig.storeLogo !== undefined) newPrefs.store_logo = updates.storeConfig.storeLogo
      if (updates.storeConfig.whatsapp !== undefined) newPrefs.whatsapp = updates.storeConfig.whatsapp
      if (updates.storeConfig.storeBanner !== undefined) newPrefs.store_banner = updates.storeConfig.storeBanner
      if (updates.storeConfig.storeStyle !== undefined) newPrefs.store_style = updates.storeConfig.storeStyle
      if (updates.storeConfig.socialLinks !== undefined) newPrefs.social_links = updates.storeConfig.socialLinks
      if (updates.storeConfig.kyc !== undefined) newPrefs.kyc_data = updates.storeConfig.kyc
    }

    payload.preferences = newPrefs

    console.log("[v0] 💾 Final payload to DB:", JSON.stringify(payload, null, 2))
    console.log("[v0] 📊 Final payload.preferences.aiModel:", payload.preferences?.aiModel)
    console.log("[v0] 📊 Final payload.ai_model (column):", payload.ai_model)

    const { error } = await supabase.from("profiles").update(payload).eq("id", userId)

    if (error) {
      console.error("[v0] ❌ Database update error:", error)
      throw error
    }

    console.log("[v0] ✅ updateUserProfile - SUCCESS")

    const { data: verifyData } = await supabase
      .from("profiles")
      .select("ai_model, preferences")
      .eq("id", userId)
      .single()

    console.log("[v0] 🔍 Verification - ai_model column after save:", verifyData?.ai_model)
    console.log("[v0] 🔍 Verification - preferences.aiModel after save:", verifyData?.preferences?.aiModel)
  } catch (e: any) {
    console.error("[v0] ❌ updateUserProfile - FAILED:", e)
    throw handleSupabaseError(e, "Atualizar Perfil")
  }
}

export const signInWithEmail = async (email: string, password: string) => {
  const supabase = getSupabaseBrowserClient()
  return supabase.auth.signInWithPassword({ email, password })
}

export const signInWithGoogle = async () => {
  const supabase = getSupabaseBrowserClient()
  return supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } })
}

export const signUpWithEmail = async (email: string, password: string, name: string) => {
  const supabase = getSupabaseBrowserClient()
  const authResponse = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
  if (authResponse.data?.user) {
    supabase
      .from("profiles")
      .insert([{ id: authResponse.data.user.id, name, plan: "free" }])
      .then(() => {})
  }
  return authResponse
}

export const sendPasswordResetEmail = async (email: string) => {
  const supabase = getSupabaseBrowserClient()
  return supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
}

export const signOut = async () => {
  const supabase = getSupabaseBrowserClient()
  return supabase.auth.signOut()
}

export const getAssets = async (type?: ImageAssetType, userId?: string): Promise<ImageAsset[]> => {
  try {
    const supabase = getSupabaseBrowserClient()
    let query = supabase.from("assets").select("*").order("created_at", { ascending: false })
    if (userId) query = query.eq("user_id", userId)
    else {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return []
      query = query.eq("user_id", user.id)
    }
    if (type) query = query.eq("type", type)
    const { data, error } = await query
    if (error) throw error

    return (data || []).map((item: any) => ({
      id: item.id,
      user_id: item.user_id,
      name: item.name,
      description: item.description,
      category: item.category,
      type: item.type,
      source: "url",
      preview: item.public_url,
      mimeType: item.mime_type || "image/jpeg",
      createdAt: item.created_at,
      isFavorite: item.is_favorite || false,
      storage_path: item.storage_path,
      price: item.price,
      published: item.published,
    }))
  } catch (e: any) {
    throw handleSupabaseError(e, "Buscar Assets")
  }
}

export const saveAsset = async (userId: string, asset: ImageAsset, base64Data: string) => {
  try {
    const supabase = getSupabaseBrowserClient()
    let publicUrl = asset.preview
    let storagePath = ""
    if (base64Data) {
      const blob = await base64ToBlob(base64Data, asset.mimeType)
      const up = await uploadBlobToStorage(blob, userId, "uploads")
      publicUrl = up.publicUrl
      storagePath = up.path
    }
    const { data, error } = await supabase
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
  } catch (e: any) {
    throw handleSupabaseError(e, "Salvar Asset")
  }
}

export const getJobs = async (limit?: number): Promise<TryOnJob[]> => {
  try {
    const supabase = getSupabaseBrowserClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []

    let query = supabase
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

    if (limit) query = query.limit(limit)

    const { data, error } = await query
    if (error) throw error

    return (data || []).map((job: any) => ({
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
    }))
  } catch (err) {
    console.error("Erro ao buscar jobs:", err)
    return []
  }
}

export const createJob = async (job: TryOnJob): Promise<TryOnJob | null> => {
  try {
    const supabase = getSupabaseBrowserClient()
    const session = await ensureAuthenticatedOrAbort()
    const newJob = {
      user_id: session.user.id,
      model_id: job.modelId,
      product_id: job.productId,
      status: "pending",
      style: job.style || "editorial",
      user_instructions: job.userInstructions || "Atelier.",
      is_favorite: false,
      is_public: false,
    }
    const { data, error } = await supabase.from("jobs").insert([newJob]).select().single()
    if (error) throw error
    return {
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
  } catch (e: any) {
    throw handleSupabaseError(e, "Criar Job")
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
  } catch (e: any) {
    throw handleSupabaseError(e, "Completar Job")
  }
}

export const getAllStores = async (): Promise<any[]> => {
  try {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, avatar_url, preferences")
      .not("preferences", "is", null)

    if (error) throw error

    const activeStores = data
      .filter((profile: any) => {
        const prefs = profile.preferences || {}
        return prefs.is_sales_enabled === true || profile.is_sales_enabled === true
      })
      .map((profile: any) => {
        const prefs = profile.preferences || {}

        let banner = prefs.store_banner || ""
        try {
          const parsed = JSON.parse(banner)
          if (Array.isArray(parsed) && parsed.length > 0) banner = parsed[0]
        } catch {}

        return {
          id: profile.id,
          name: prefs.store_name || profile.name || "Loja Sem Nome",
          logo: prefs.store_logo || profile.avatar_url || "",
          banner: banner,
          style: prefs.store_style || "Variado",
          whatsapp: prefs.whatsapp,
          productCount: 0,
        }
      })

    return activeStores
  } catch (e: any) {
    console.error("Erro ao buscar lojas:", e)
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
    const supabase = getSupabaseBrowserClient()
    const session = await ensureAuthenticatedOrAbort()
    const { data: orderData, error: orderError } = await supabase
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
    await supabase.from("order_items").insert(orderItemsPayload)
    return orderData
  } catch (e: any) {
    throw handleSupabaseError(e, "Criar Pedido")
  }
}

export const getUserOrders = async (): Promise<Order[]> => {
  try {
    const supabase = getSupabaseBrowserClient()
    const session = await ensureAuthenticatedOrAbort()

    const { data: orders, error } = await supabase
      .from("orders")
      .select(`*, items:order_items(*)`)
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })

    if (error) throw error
    return orders || []
  } catch (e: any) {
    return []
  }
}

const NOTIF_KEY = "espelho_meu_notifications_v1"
export const getNotifications = (): Notification[] => {
  try {
    const data = localStorage.getItem(NOTIF_KEY)
    return data ? JSON.parse(data) : []
  } catch (e) {
    return []
  }
}

export const addNotification = (notif: Notification): Notification[] => {
  const list = getNotifications()
  const newList = [notif, ...list].slice(0, 5)
  localStorage.setItem(NOTIF_KEY, JSON.stringify(newList))
  return newList
}

export const getStoreProfile = async (storeId: string): Promise<any | null> => {
  try {
    const supabase = getSupabaseBrowserClient()
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, avatar_url, preferences")
      .eq("id", storeId)
      .maybeSingle()

    if (error || !data) {
      console.error("[v0] getStoreProfile error:", error)
      return null
    }

    const prefs = data.preferences || {}

    const bannerData = prefs.store_banner || ""
    console.log("[v0] getStoreProfile: Raw banner from DB:", bannerData)

    return {
      id: data.id,
      name: prefs.store_name || data.name || "Loja",
      logo: prefs.store_logo || data.avatar_url || "",
      banner: bannerData, // Return raw banner data for parsing in component
      whatsapp: prefs.whatsapp || "",
      socialLinks: prefs.social_links || {},
      storeConfig: {
        storeBanner: bannerData,
        storeName: prefs.store_name || data.name || "",
        storeLogo: prefs.store_logo || data.avatar_url || "",
        storeStyle: prefs.store_style || "",
        whatsapp: prefs.whatsapp || "",
        socialLinks: prefs.social_links || {},
      },
      preferences: prefs,
    }
  } catch (err) {
    console.error("[v0] getStoreProfile fatal error:", err)
    return null
  }
}
