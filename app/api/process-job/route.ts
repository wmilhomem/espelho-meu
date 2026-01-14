import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { STYLE_PRESETS } from "@/services/geminiService"
import type { TryOnStyle, AIModel } from "@/types"
import { getAIModelConfig, AI_MODELS } from "@/constants/ai-models"
import { getAIProvider } from "@/services/ai/AIProviderFactory"

export const runtime = "nodejs"
export const maxDuration = 60

async function urlToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`)

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    return buffer.toString("base64")
  } catch (error) {
    console.error("[Process Job] Erro ao converter URL para Base64:", error)
    throw error
  }
}

export async function POST(request: Request) {
  const startTime = Date.now()
  console.log("[v0] 🟢 PROCESS-JOB API - START")

  try {
    const body = await request.json()
    const { jobId } = body

    console.log("[v0] Received jobId:", jobId)

    if (!jobId) {
      console.log("[v0] ❌ No jobId provided")
      return NextResponse.json({ error: "jobId é obrigatório" }, { status: 400 })
    }

    // 1. Fetch job from database
    console.log("[v0] 📋 Fetching job from database...")
    const { data: jobData, error: jobError } = await supabase
      .from("jobs")
      .select(`
        *,
        product:assets!jobs_product_id_fkey (public_url, mime_type),
        model:assets!jobs_model_id_fkey (public_url, mime_type)
      `)
      .eq("id", jobId)
      .single()

    if (jobError || !jobData) {
      console.error("[v0] ❌ Job not found:", jobError)
      return NextResponse.json({ error: "Job não encontrado" }, { status: 404 })
    }

    console.log("[v0] ✅ Job fetched:", {
      id: jobData.id,
      user_id: jobData.user_id,
      status: jobData.status,
      style: jobData.style,
    })

    // 2. Update job status to "processing"
    console.log("[v0] 🔄 Updating job status to processing...")
    await supabase
      .from("jobs")
      .update({
        status: "processing",
        started_at: new Date().toISOString(),
      })
      .eq("id", jobId)

    console.log("[v0] ✅ Status updated to 'processing'")

    // 3. Get AI model from user profile
    console.log("[v0] 👤 Fetching user profile for AI model...")
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("ai_model, preferences")
      .eq("id", jobData.user_id)
      .single()

    console.log("[v0] 📋 Profile data:", profileData)
    console.log("[v0] 📋 Profile error:", profileError)
    console.log("[v0] 📋 ai_model column:", profileData?.ai_model)
    console.log("[v0] 📋 Preferences:", profileData?.preferences)
    console.log("[v0] 📋 AI Model from preferences.aiModel:", profileData?.preferences?.aiModel)

    const aiModelFromColumn = profileData?.ai_model
    const aiModelFromPrefs = profileData?.preferences?.aiModel
    const aiModel: AIModel = (aiModelFromColumn || aiModelFromPrefs || AI_MODELS.GEMINI_25_FLASH_IMAGE) as AIModel

    console.log("[v0] 🎯 Selected AI Model (final):", aiModel)
    console.log("[v0] 🎯 Source: column =", aiModelFromColumn, ", prefs =", aiModelFromPrefs)

    const modelConfig = getAIModelConfig(aiModel)

    console.log("[v0] 📊 Model Config:", {
      displayName: modelConfig.displayName,
      provider: modelConfig.provider,
      model: modelConfig.model,
      canGenerateImages: modelConfig.canGenerateImages,
    })

    // Check if model can generate images
    if (!modelConfig.canGenerateImages) {
      console.error("[v0] ❌ Model cannot generate images:", aiModel)
      throw new Error(
        `O modelo ${modelConfig.displayName} não suporta geração de imagens. ` +
          `Ele é um modelo de análise apenas. Por favor, selecione um modelo Gemini nas configurações do seu perfil.`,
      )
    }

    // 4. Convert image URLs to Base64
    console.log("[v0] 🖼️ Converting images to Base64...")
    console.log("[v0] Model URL:", jobData.model.public_url)
    console.log("[v0] Product URL:", jobData.product.public_url)

    const modelBase64 = await urlToBase64(jobData.model.public_url)
    const productBase64 = await urlToBase64(jobData.product.public_url)

    console.log("[v0] ✅ Images converted to Base64")
    console.log("[v0] Model Base64 length:", modelBase64.length)
    console.log("[v0] Product Base64 length:", productBase64.length)

    // 5. Build prompt
    const selectedStyle = STYLE_PRESETS[jobData.style as TryOnStyle] || STYLE_PRESETS.editorial
    console.log("[v0] 🎨 Selected style:", jobData.style)

    const prompt = `
ROLE: You are an expert AI Fashion Stylist, VFX Artist, and Layer Compositor specializing in photorealistic Virtual Try-On.

INPUTS:
- IMAGE A (First Image provided): The HUMAN MODEL (The base image to be edited).
- IMAGE B (Second Image provided): The CLOTHING PRODUCT (The garment to be transferred).

TASK:
VTO_MANDATORY: You **MUST** perfectly transfer the **entire garment** from IMAGE B onto the body of the model in IMAGE A. This is a mandatory substitution task.

STRICT REQUIREMENTS:
1. **SUBSTITUTION & MASKING**: Identify the area of the original clothing in IMAGE A. Generate a precise mask for this area and use it as the region to be completely OVERWRITTEN by the garment from IMAGE B. The original clothing must not be visible.
2. **CLOTHING INTEGRATION**: The garment from Image B must be WARPED, RESIZED, and FITTED onto the body of the person in Image A. It must conform to the body shape, including wrinkles, stretching, and correct perspective.
3. **PHYSICS & LIGHTING (Caimento Perfeito)**: The fabric must drape naturally, with realistic shadows and highlights that match the existing lighting and pose of IMAGE A.
4. **PRESERVATION**: Maintain the exact face, hair, skin texture, pose, and background of IMAGE A. Only the outfit changes.
5. **STYLE**: Apply the visual style: ${selectedStyle}.

NEGATIVE CONSTRAINTS (WHAT TO AVOID):
- DO NOT show any part of the original clothing underneath the new garment.
- DO NOT simply paste Image B as a flat texture or overlay.
- DO NOT distort the human face or limbs.
- DO NOT generate multiple items of clothing or change the background.

OUTPUT:
A single high-resolution photorealistic image of the transformation.
    `

    // 6. Get AI provider and generate image
    console.log("[v0] 🏭 Getting AI provider for model:", aiModel)
    const provider = getAIProvider(aiModel)
    console.log("[v0] 🚀 Provider name:", provider.name)

    console.log("[v0] 🎨 Calling provider.generateImage...")
    const resultBase64 = await provider.generateImage(modelBase64, productBase64, prompt, modelConfig.model)

    if (!resultBase64) {
      console.error("[v0] ❌ Provider returned null/empty result")
      throw new Error("Provider não retornou uma imagem válida")
    }

    console.log("[v0] ✅ Image generated, Base64 length:", resultBase64.length)

    // 7. Upload result to storage
    console.log("[v0] 📤 Uploading result to storage...")

    const base64Data = resultBase64.split(",")[1]
    const buffer = Buffer.from(base64Data, "base64")

    console.log("[v0] Buffer size:", buffer.length, "bytes")

    const fileName = `${jobData.user_id}/results/${Date.now()}_result.jpg`
    console.log("[v0] Target filename:", fileName)

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("espelho-assets")
      .upload(fileName, buffer, {
        contentType: "image/jpeg",
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) {
      console.error("[v0] ❌ Upload error:", uploadError)
      throw uploadError
    }

    console.log("[v0] ✅ Upload successful, path:", uploadData.path)

    const { data: publicUrlData } = supabase.storage.from("espelho-assets").getPublicUrl(uploadData.path)

    console.log("[v0] 🔗 Public URL:", publicUrlData.publicUrl)

    // 8. Update job as completed
    console.log("[v0] 💾 Updating job as completed...")
    await supabase
      .from("jobs")
      .update({
        status: "completed",
        result_public_url: publicUrlData.publicUrl,
        ai_model_used: aiModel,
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId)

    const duration = (Date.now() - startTime) / 1000
    console.log(`[v0] ✅ PROCESS-JOB API - COMPLETE (${duration}s)`)
    console.log(`[v0] Used AI Model: ${aiModel} (${modelConfig.displayName})`)

    return NextResponse.json({
      success: true,
      jobId,
      resultUrl: publicUrlData.publicUrl,
      duration,
      aiModel,
      provider: provider.name,
    })
  } catch (error: any) {
    console.error("[v0] ❌ PROCESS-JOB API - ERROR:", error)
    console.error("[v0] Error stack:", error.stack)

    const body = await request.json().catch(() => ({}))
    if (body?.jobId) {
      console.log("[v0] Updating job as failed...")
      await supabase
        .from("jobs")
        .update({
          status: "failed",
          error_message: error.message || "Erro desconhecido",
          completed_at: new Date().toISOString(),
        })
        .eq("id", body.jobId)
    }

    return NextResponse.json(
      {
        error: error.message || "Erro ao processar job",
      },
      { status: 500 },
    )
  }
}
