import type { TryOnJob, TryOnStyle, ImageAsset, AIModel } from "../types"
import { getAIModelConfig } from "../constants/aiModels"
import { getCurrentPrompt } from "../constants/prompt-versions"
import { CURRENT_PROMPT_VERSION } from "../constants/versions"

export const STYLE_PRESETS: Record<TryOnStyle, string> = {
  editorial: `Estilo Editorial Vogue: Iluminação suave de estúdio, foco nítido, fundo neutro luxuoso, pele com textura natural, alta fidelidade de cor.`,
  seda: `Acabamento Seda/Cetim: Ênfase no brilho do tecido, caimento fluido, dobras suaves realistas, iluminação especular para destacar a textura do material.`,
  justa: `Caimento Justo/Bodycon: Aderência anatômica ao corpo, sombreamento que destaca a silhueta, alta definição muscular e curvas.`,
  transparente: `Transparência e Renda: Preservação realista da pele sob o tecido, textura de renda detalhada, opacidade calibrada, delicadeza.`,
  casual: `Lifestyle Influencer: Luz natural do dia (golden hour), cores vibrantes, pose relaxada, fundo urbano ou doméstico desfocado (bokeh).`,
  passarela: `Passarela High Fashion: Iluminação dramática de cima para baixo, alto contraste, atitude poderosa, foco intenso na roupa.`,
}

export const getMagicTouchPresets = () => STYLE_PRESETS

export async function generateTryOnLook(
  jobId: string,
  userId: string,
  modelAsset: ImageAsset,
  productAsset: ImageAsset,
  style: TryOnStyle,
  aiModel?: AIModel, // Added optional AI model parameter
): Promise<string> {
  console.log(`[VTO Service] Iniciando geração SEGURA (via proxy) para Job ${jobId}`)

  if (!modelAsset.data || !productAsset.data) {
    throw new Error("Imagens corrompidas ou vazias. Tente reenviar as fotos.")
  }

  try {
    const modelConfig = getAIModelConfig(aiModel)
    console.log(`[VTO Service] Usando modelo: ${modelConfig.displayName} (${modelConfig.model})`)

    console.log("[VTO Service] Redimensionando e otimizando imagens de entrada...")
    const resizedModelDataUrl = await resizeBase64Image(modelAsset.data, 800, 800)
    const resizedProductDataUrl = await resizeBase64Image(productAsset.data, 800, 800)

    const cleanModelBase64 = resizedModelDataUrl.replace(/^data:image\/\w+;base64,/, "") || ""
    const cleanProductBase64 = resizedProductDataUrl.replace(/^data:image\/\w+;base64,/, "") || ""

    const prompt = getCurrentPrompt(style, CURRENT_PROMPT_VERSION as any)
    console.log(`[VTO Service] Using prompt version: ${CURRENT_PROMPT_VERSION}`)

    console.log("[VTO Service] Enviando para API /api/revelacao (proxy seguro)...")

    const response = await fetch("/api/revelacao", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        modelBase64: cleanModelBase64,
        productBase64: cleanProductBase64,
        prompt: prompt,
        jobId: jobId,
        config: {
          model: modelConfig.model,
          provider: modelConfig.provider,
          temperature: 0.6,
          topK: 32,
          topP: 0.8,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Erro desconhecido" }))
      console.error("[VTO Service] Erro da API:", errorData)

      if (response.status === 429 || errorData.error === "QUOTA_EXCEEDED") {
        throw new Error(errorData.message || "Limite de quota atingido")
      }

      throw new Error(errorData.error || errorData.details || `Erro HTTP ${response.status}`)
    }

    const result = await response.json()

    if (!result.success || !result.image) {
      throw new Error("A API não retornou uma imagem válida")
    }

    console.log("[VTO Service] ✅ Imagem recebida com sucesso!")
    return result.image
  } catch (error: any) {
    console.error("[VTO Service] Erro fatal:", error)

    let msg = error.message || "Erro desconhecido."

    if (msg.includes("🚫") || msg.includes("PROBLEMA:") || msg.includes("SOLUÇÕES")) {
      throw new Error(msg)
    }

    if (
      msg.includes("429") ||
      msg.includes("quota") ||
      msg.includes("RESOURCE_EXHAUSTED") ||
      msg.includes("rate limit")
    ) {
      throw new Error(
        "⚠️ Limite de Uso Atingido\n\n" +
          "A API do Google Gemini atingiu seu limite de quota.\n\n" +
          "Por favor, aguarde alguns minutos antes de tentar novamente.",
      )
    }

    if (msg.includes("500") || msg.includes("503")) msg = "Serviço da IA indisponível temporariamente."
    if (msg.includes("network") || msg.includes("fetch")) msg = "Erro de conexão. Verifique sua internet."

    throw new Error(msg)
  }
}

export const processTryOnJob = async (
  job: TryOnJob,
  productData: string,
  productMime: string,
  modelData: string,
  modelMime: string,
  aiModel?: AIModel, // Added optional AI model parameter
): Promise<string> => {
  if (!job.userId || !job.id) throw new Error("Dados do Job inválidos.")

  const modelAsset: ImageAsset = {
    id: job.modelId,
    type: "model",
    source: "file",
    preview: "",
    mimeType: modelMime,
    data: modelData,
  }
  const productAsset: ImageAsset = {
    id: job.productId,
    type: "product",
    source: "file",
    preview: "",
    mimeType: productMime,
    data: productData,
  }

  return await generateTryOnLook(job.id, job.userId, modelAsset, productAsset, job.style, aiModel) // Pass AI model
}

export const resizeBase64Image = (dataUrl: string, maxWidth = 800, maxHeight = 800): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      let width = img.width
      let height = img.height

      const ratio = Math.min(maxWidth / width, maxHeight / height)

      if (ratio < 1) {
        width *= ratio
        height *= ratio
      }

      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext("2d")
      if (!ctx) {
        return reject(new Error("Não foi possível obter o contexto do canvas."))
      }

      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL("image/jpeg", 0.8))
    }
    img.onerror = () => reject(new Error("Falha ao carregar imagem para redimensionamento."))
    img.src = dataUrl
  })
}

const fetchWithTimeout = async (url: string, timeout = 10000) => {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  try {
    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(id)
    return response
  } catch (error) {
    clearTimeout(id)
    throw error
  }
}

export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(blob)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}

export const fileToBase64 = (file: File): Promise<string> => {
  return blobToBase64(file)
}

export const urlToBase64 = async (url: string) => {
  console.log(`[ImageUtils] Baixando: ${url}`)

  const proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(url)}&output=jpg&w=1024&q=80`

  try {
    const res = await fetchWithTimeout(proxyUrl, 15000)
    if (!res.ok) throw new Error(`Status ${res.status}`)
    const blob = await res.blob()
    const base64 = await blobToBase64(blob)
    return { data: base64, mimeType: blob.type || "image/jpeg", preview: base64 }
  } catch (e) {
    console.warn("[ImageUtils] Falha no proxy, tentando direto...", e)
    try {
      const resDirect = await fetchWithTimeout(url, 10000)
      if (!resDirect.ok) throw new Error("Falha direta")
      const blobDirect = await resDirect.blob()
      const base64Direct = await blobToBase64(blobDirect)
      return { data: base64Direct, mimeType: blobDirect.type, preview: base64Direct }
    } catch (finalErr) {
      throw new Error("Não foi possível acessar a imagem. Por favor, faça download e upload manual.")
    }
  }
}

export const upscaleImage = async (dataUrl: string): Promise<string> => {
  return dataUrl
}
