import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai"
import type { AIModel } from "@/types"
import { getAIModelConfig } from "@/constants/ai-models"

export interface AIProvider {
  name: string
  generateImage: (modelBase64: string, productBase64: string, prompt: string, model: string) => Promise<string>
}

// Gemini Provider
const geminiProvider: AIProvider = {
  name: "Gemini",
  generateImage: async (modelBase64, productBase64, prompt, model) => {
    console.log("[AI Provider] Using Gemini provider with model:", model)

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY não configurada")
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: modelBase64 } },
          { inlineData: { mimeType: "image/jpeg", data: productBase64 } },
          { text: prompt },
        ],
      },
      config: {
        temperature: 0.6,
        topK: 32,
        topP: 0.8,
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        ],
      },
    })

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("Nenhum resultado retornado pela IA")
    }

    const candidate = response.candidates[0]
    const parts = candidate.content.parts

    for (const part of parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
      }
    }

    throw new Error("IA não retornou uma imagem válida")
  },
}

// Groq Provider (analysis only, no image generation)
const groqProvider: AIProvider = {
  name: "Groq",
  generateImage: async () => {
    throw new Error(
      "O modelo Llama 3.2 Vision não suporta geração de imagens. " +
        "Ele é um modelo de análise apenas. Por favor, selecione um modelo Gemini nas configurações do seu perfil.",
    )
  },
}

// OpenAI Provider (placeholder)
const openAIProvider: AIProvider = {
  name: "OpenAI",
  generateImage: async () => {
    throw new Error(
      "O modelo GPT-4o Mini Vision ainda não está totalmente implementado. " +
        "Por favor, selecione um modelo Gemini nas configurações do seu perfil.",
    )
  },
}

// Other providers (placeholders)
const qwenProvider: AIProvider = {
  name: "Qwen",
  generateImage: async () => {
    throw new Error("Qwen VL ainda não está implementado. Use um modelo Gemini.")
  },
}

const deepSeekProvider: AIProvider = {
  name: "DeepSeek",
  generateImage: async () => {
    throw new Error("DeepSeek VL é um modelo de análise apenas. Use um modelo Gemini para gerar imagens.")
  },
}

const moonDreamProvider: AIProvider = {
  name: "MoonDream",
  generateImage: async () => {
    throw new Error("MoonDream é um modelo de análise apenas. Use um modelo Gemini para gerar imagens.")
  },
}

const clipProvider: AIProvider = {
  name: "CLIP",
  generateImage: async () => {
    throw new Error("CLIP Interrogator é um modelo de análise apenas. Use um modelo Gemini para gerar imagens.")
  },
}

export function getAIProvider(model: AIModel): AIProvider {
  console.log("[AI Factory] Selecting provider for model:", model)

  const config = getAIModelConfig(model)

  // Check if model can generate images
  if (!config.canGenerateImages) {
    console.warn(`[AI Factory] Model ${model} cannot generate images`)
  }

  // Select provider based on model name
  if (model.startsWith("gemini")) {
    return geminiProvider
  }

  if (model.includes("llama")) {
    return groqProvider
  }

  if (model.includes("gpt")) {
    return openAIProvider
  }

  if (model.includes("qwen")) {
    return qwenProvider
  }

  if (model.includes("deepseek")) {
    return deepSeekProvider
  }

  if (model.includes("moondream")) {
    return moonDreamProvider
  }

  if (model.includes("clip")) {
    return clipProvider
  }

  console.log("[AI Factory] No specific provider found, defaulting to Gemini")
  return geminiProvider
}
