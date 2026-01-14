import type { AIModelConfig } from "../types"

export const AI_MODELS: Record<string, AIModelConfig> = {
  "gemini-2.0-flash-exp": {
    provider: "gemini",
    model: "gemini-2.0-flash-exp",
    displayName: "Gemini 2.0 Flash (Experimental)",
    description: "Modelo experimental do Google com suporte a imagens. 100-500 req/dia grátis.",
    freeTier: true,
    rateLimit: "100-500 req/dia",
  },
  "gemini-2.5-flash-image-preview": {
    provider: "gemini",
    model: "gemini-2.5-flash-image-preview",
    displayName: "Gemini 2.5 Flash Image Preview",
    description: "Modelo otimizado para processamento de imagens. 500 req/dia grátis.",
    freeTier: true,
    rateLimit: "500 req/dia",
  },
  "llama-3.2-90b-vision-preview": {
    provider: "groq",
    model: "llama-3.2-90b-vision-preview",
    displayName: "Llama 3.2 90B Vision (Groq)",
    description: "Modelo Llama com visão via Groq. 14.400 req/dia grátis.",
    freeTier: true,
    rateLimit: "14.400 req/dia",
  },
}

export const DEFAULT_AI_MODEL: AIModelConfig = AI_MODELS["gemini-2.5-flash-image-preview"]

export const getAIModelConfig = (modelKey?: string): AIModelConfig => {
  if (!modelKey) return DEFAULT_AI_MODEL
  return AI_MODELS[modelKey] || DEFAULT_AI_MODEL
}
