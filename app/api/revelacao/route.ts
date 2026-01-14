import { NextResponse } from "next/server"
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai"

export const runtime = "nodejs"
export const maxDuration = 60

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GROQ_API_KEY = process.env.GROQ_API_KEY

export async function POST(request: Request) {
  console.log("[API Proxy] 🟢 Rota POST /api/revelacao iniciada.")
  const start = Date.now()

  try {
    const body = await request.json()
    const { modelBase64, productBase64, prompt, jobId, config } = body

    console.log(`[API Proxy] Job ID: ${jobId || "N/A"}`)
    console.log(`[API Proxy] 🎯 MODELO SELECIONADO: ${config?.model || "NÃO ESPECIFICADO"}`)
    console.log(`[API Proxy] 🎯 PROVIDER: ${config?.provider || "NÃO ESPECIFICADO"}`)
    console.log(`[API Proxy] Config completo recebido:`, JSON.stringify(config, null, 2))

    if (!modelBase64 || !productBase64) {
      console.error("[API Proxy] ❌ Payload incompleto (imagens faltando).")
      return NextResponse.json({ error: "Imagens ausentes no payload." }, { status: 400 })
    }

    console.log(`[API Proxy] 📐 Tamanho Model: ${modelBase64.length}, Product: ${productBase64.length}`)

    const provider = config.provider || "gemini"

    if (provider === "groq") {
      return await handleGroqRequest(modelBase64, productBase64, prompt, jobId, config, start)
    } else {
      return await handleGeminiRequest(modelBase64, productBase64, prompt, jobId, config, start)
    }
  } catch (error: any) {
    console.error("[API Proxy] 💥 Exceção não tratada:", error)
    return NextResponse.json(
      {
        error: "Erro interno no servidor.",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

async function handleGeminiRequest(
  modelBase64: string,
  productBase64: string,
  prompt: string,
  jobId: string,
  config: any,
  start: number,
) {
  if (!GEMINI_API_KEY) {
    console.error("[API Proxy] ❌ ERRO CRÍTICO: GEMINI_API_KEY ausente.")
    return NextResponse.json(
      { error: "Server Configuration Error: GEMINI_API_KEY missing. Configure nas variáveis de ambiente." },
      { status: 500 },
    )
  }

  console.log(
    `[API Proxy] 🔑 Usando Gemini API Key: ${GEMINI_API_KEY.substring(0, 10)}...${GEMINI_API_KEY.substring(GEMINI_API_KEY.length - 4)}`,
  )

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })

    const selectedModel = config?.model || "gemini-2.5-flash-image-preview"
    console.log(`[API Proxy] 🤖 Enviando para Google Gemini com modelo: ${selectedModel}`)

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: modelBase64 } },
          { inlineData: { mimeType: "image/jpeg", data: productBase64 } },
          { text: prompt },
        ],
      },
      config: {
        temperature: config.temperature || 0.6,
        topK: config.topK || 32,
        topP: config.topP || 0.8,
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        ],
      },
    })

    console.log("[API Proxy] ✅ Resposta recebida do Gemini")

    if (!response.candidates || response.candidates.length === 0) {
      if (response.promptFeedback && response.promptFeedback.blockReason) {
        return NextResponse.json(
          { error: `Solicitação bloqueada: ${response.promptFeedback.blockReason}` },
          { status: 400 },
        )
      }
      return NextResponse.json({ error: "A IA não retornou resultados visuais." }, { status: 500 })
    }

    const candidate = response.candidates[0]

    if (candidate.finishReason && candidate.finishReason !== "STOP") {
      console.warn(`[API Proxy] Finish Reason: ${candidate.finishReason}`)
      const reason = candidate.finishReason

      if (reason === "SAFETY") {
        return NextResponse.json(
          { error: "A imagem gerada foi bloqueada pelos filtros de segurança (Conteúdo Sensível)." },
          { status: 400 },
        )
      }
      if (reason === "RECITATION") {
        return NextResponse.json(
          { error: "Bloqueio por direitos autorais. A IA reconheceu uma marca protegida." },
          { status: 400 },
        )
      }
      if (!candidate.content) {
        return NextResponse.json({ error: `A geração falhou. Motivo: ${reason}` }, { status: 500 })
      }
    }

    if (!candidate.content || !candidate.content.parts) {
      console.error("[API Proxy] Candidate vazio:", JSON.stringify(candidate))
      return NextResponse.json({ error: "Erro inesperado: Resposta da IA vazia." }, { status: 500 })
    }

    const parts = candidate.content.parts
    let resultBase64 = ""

    for (const part of parts) {
      if (part.inlineData) {
        resultBase64 = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
        break
      }
    }

    if (!resultBase64) {
      const textPart = parts.find((p: any) => p.text)?.text
      console.warn("[API Proxy] IA retornou texto:", textPart)
      return NextResponse.json({ error: "A IA não retornou uma imagem válida." }, { status: 500 })
    }

    const duration = (Date.now() - start) / 1000
    console.log(`[API Proxy] ✅ Sucesso! Gerado em ${duration}s.`)

    return NextResponse.json({
      success: true,
      jobId,
      image: resultBase64,
    })
  } catch (error: any) {
    console.error("[API Proxy] 💥 Erro Gemini:", error)

    if (error.error?.code === 429 || error.message?.includes("quota") || error.message?.includes("429")) {
      const errorDetails = error.error || {}
      const violations = errorDetails.details?.find((d: any) => d["@type"]?.includes("QuotaFailure"))?.violations || []

      let specificMessage = "🚫 Limite de Quota da API Gemini Atingido\n\n"

      const hasZeroLimit = violations.some((v: any) => v.quotaMetric?.includes("free_tier"))

      if (hasZeroLimit) {
        specificMessage += "⚠️ Sua chave API Gemini não tem acesso ao free tier.\n\n"
        specificMessage += "💡 SOLUÇÕES:\n\n"
        specificMessage += "1️⃣ Configure billing no Google Cloud (gratuito dentro dos limites)\n"
        specificMessage += "2️⃣ Alterne para Groq nas configurações do perfil\n"
        specificMessage += "3️⃣ Crie uma nova API Key em outra conta Google\n\n"
        specificMessage += "📊 Monitorar uso: https://ai.dev/usage?tab=rate-limit\n"
      } else {
        specificMessage += "⏳ Limite temporário atingido. Aguarde alguns minutos.\n"
      }

      return NextResponse.json(
        {
          error: "QUOTA_EXCEEDED",
          message: specificMessage,
          details: errorDetails,
        },
        { status: 429 },
      )
    }

    throw error
  }
}

async function handleGroqRequest(
  modelBase64: string,
  productBase64: string,
  prompt: string,
  jobId: string,
  config: any,
  start: number,
) {
  if (!GROQ_API_KEY) {
    console.error("[API Proxy] ❌ ERRO CRÍTICO: GROQ_API_KEY ausente.")
    return NextResponse.json(
      {
        error: "Groq não configurado. Adicione GROQ_API_KEY nas variáveis de ambiente ou use Gemini nas configurações.",
      },
      { status: 500 },
    )
  }

  console.log(
    `[API Proxy] 🔑 Usando Groq API Key: ${GROQ_API_KEY.substring(0, 10)}...${GROQ_API_KEY.substring(GROQ_API_KEY.length - 4)}`,
  )

  try {
    console.log(`[API Proxy] 🤖 Enviando para Groq: ${config.model}`)

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model || "llama-3.2-90b-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${modelBase64}`,
                },
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${productBase64}`,
                },
              },
            ],
          },
        ],
        temperature: config.temperature || 0.6,
        max_tokens: 4096,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("[API Proxy] Groq error:", errorData)

      if (response.status === 429) {
        return NextResponse.json(
          {
            error: "QUOTA_EXCEEDED",
            message:
              "Limite de requisições do Groq atingido. Aguarde alguns minutos ou alterne para Gemini nas configurações.",
          },
          { status: 429 },
        )
      }

      return NextResponse.json(
        {
          error: `Groq API error: ${errorData.error?.message || "Unknown error"}`,
        },
        { status: response.status },
      )
    }

    const data = await response.json()

    console.log("[API Proxy] ✅ Resposta recebida do Groq")

    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return NextResponse.json({ error: "Groq não retornou conteúdo válido." }, { status: 500 })
    }

    const duration = (Date.now() - start) / 1000
    console.log(`[API Proxy] ✅ Sucesso com Groq em ${duration}s.`)

    return NextResponse.json({
      success: false,
      error:
        "⚠️ Groq Llama Vision não gera imagens diretamente. Ele apenas analisa imagens. Para transformação de looks, use Gemini ou configure outro provedor de geração de imagens (Replicate, Fal.ai).",
      analysis: content,
    })
  } catch (error: any) {
    console.error("[API Proxy] 💥 Erro Groq:", error)
    throw error
  }
}
