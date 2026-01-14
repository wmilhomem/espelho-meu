export const AI_MODELS = {
  // Gemini Models (Primary)
  GEMINI_25_FLASH_IMAGE: "gemini-2.5-flash-image-preview",
  GEMINI_20_FLASH_EXP: "gemini-2.0-flash-exp",
  GEMINI_15_PRO_VISION: "gemini-1.5-pro-vision",
  GEMINI_15_FLASH_VISION: "gemini-1.5-flash-vision",

  // Groq Models
  LLAMA_32_90B_VISION: "llama-3.2-90b-vision-preview",

  // OpenAI Models
  GPT_4O_MINI_VISION: "gpt-4o-mini-vision",

  // Other Models
  QWEN_VL: "qwen-vl-plus",
  DEEPSEEK_VL: "deepseek-vl",
  MOONDREAM: "moondream-2",
  CLIP_INTERROGATOR: "clip-interrogator",
} as const

export type AIModel = (typeof AI_MODELS)[keyof typeof AI_MODELS]

export interface AIModelConfig {
  provider: string
  model: string
  displayName: string
  description: string
  freeTier: boolean
  rateLimit: string
  canGenerateImages: boolean
  category: "recommended" | "experimental" | "analysis-only"
}

export const AI_MODEL_CONFIGS: Record<string, AIModelConfig> = {
  [AI_MODELS.GEMINI_25_FLASH_IMAGE]: {
    provider: "gemini",
    model: AI_MODELS.GEMINI_25_FLASH_IMAGE,
    displayName: "Gemini 2.5 Flash Image Preview",
    description:
      "Melhor equilíbrio entre qualidade e custo. Otimizado para processamento de imagens com resultados consistentes.",
    freeTier: true,
    rateLimit: "500 req/dia",
    canGenerateImages: true,
    category: "recommended",
  },
  [AI_MODELS.GEMINI_20_FLASH_EXP]: {
    provider: "gemini",
    model: AI_MODELS.GEMINI_20_FLASH_EXP,
    displayName: "Gemini 2.0 Flash (Experimental)",
    description: "Modelo experimental com recursos avançados. Pode ter resultados variáveis.",
    freeTier: true,
    rateLimit: "100-500 req/dia",
    canGenerateImages: true,
    category: "experimental",
  },
  [AI_MODELS.GEMINI_15_PRO_VISION]: {
    provider: "gemini",
    model: AI_MODELS.GEMINI_15_PRO_VISION,
    displayName: "Gemini 1.5 Pro Vision",
    description: "Modelo profissional com alta qualidade de processamento de imagens.",
    freeTier: true,
    rateLimit: "50 req/dia",
    canGenerateImages: true,
    category: "recommended",
  },
  [AI_MODELS.GEMINI_15_FLASH_VISION]: {
    provider: "gemini",
    model: AI_MODELS.GEMINI_15_FLASH_VISION,
    displayName: "Gemini 1.5 Flash Vision",
    description: "Versão rápida e eficiente para processamento de imagens.",
    freeTier: true,
    rateLimit: "1500 req/dia",
    canGenerateImages: true,
    category: "recommended",
  },
  [AI_MODELS.LLAMA_32_90B_VISION]: {
    provider: "groq",
    model: AI_MODELS.LLAMA_32_90B_VISION,
    displayName: "Llama 3.2 90B Vision (Groq)",
    description: "Modelo de análise de imagens. Não gera imagens, apenas analisa.",
    freeTier: true,
    rateLimit: "14.400 req/dia",
    canGenerateImages: false,
    category: "analysis-only",
  },
  [AI_MODELS.GPT_4O_MINI_VISION]: {
    provider: "openai",
    model: AI_MODELS.GPT_4O_MINI_VISION,
    displayName: "GPT-4o Mini Vision",
    description: "Modelo OpenAI otimizado para tarefas visuais.",
    freeTier: false,
    rateLimit: "Depende do plano",
    canGenerateImages: true,
    category: "experimental",
  },
  [AI_MODELS.QWEN_VL]: {
    provider: "qwen",
    model: AI_MODELS.QWEN_VL,
    displayName: "Qwen VL Plus",
    description: "Modelo chinês com bom desempenho em tarefas visuais.",
    freeTier: true,
    rateLimit: "Limitado",
    canGenerateImages: true,
    category: "experimental",
  },
  [AI_MODELS.DEEPSEEK_VL]: {
    provider: "deepseek",
    model: AI_MODELS.DEEPSEEK_VL,
    displayName: "DeepSeek VL",
    description: "Modelo de análise visual com boa precisão.",
    freeTier: true,
    rateLimit: "Limitado",
    canGenerateImages: false,
    category: "analysis-only",
  },
  [AI_MODELS.MOONDREAM]: {
    provider: "moondream",
    model: AI_MODELS.MOONDREAM,
    displayName: "Moondream 2",
    description: "Modelo leve para análise de imagens.",
    freeTier: true,
    rateLimit: "Ilimitado",
    canGenerateImages: false,
    category: "analysis-only",
  },
  [AI_MODELS.CLIP_INTERROGATOR]: {
    provider: "clip",
    model: AI_MODELS.CLIP_INTERROGATOR,
    displayName: "CLIP Interrogator",
    description: "Modelo para descrição e análise de imagens.",
    freeTier: true,
    rateLimit: "Ilimitado",
    canGenerateImages: false,
    category: "analysis-only",
  },
}

export const DEFAULT_AI_MODEL = AI_MODELS.GEMINI_25_FLASH_IMAGE

export const getAIModelConfig = (modelKey?: string): AIModelConfig => {
  if (!modelKey) return AI_MODEL_CONFIGS[DEFAULT_AI_MODEL]
  return AI_MODEL_CONFIGS[modelKey] || AI_MODEL_CONFIGS[DEFAULT_AI_MODEL]
}

export const AI_MODEL_OPTIONS = [
  { label: "Gemini 2.5 Flash (Padrão)", value: AI_MODELS.GEMINI_25_FLASH_IMAGE, category: "recommended" },
  { label: "Gemini 2.0 Flash (Experimental)", value: AI_MODELS.GEMINI_20_FLASH_EXP, category: "experimental" },
  { label: "Gemini 1.5 Pro Vision", value: AI_MODELS.GEMINI_15_PRO_VISION, category: "recommended" },
  { label: "Gemini 1.5 Flash Vision", value: AI_MODELS.GEMINI_15_FLASH_VISION, category: "recommended" },
  {
    label: "Llama 3.2 90B Vision (Groq – análise apenas)",
    value: AI_MODELS.LLAMA_32_90B_VISION,
    category: "analysis-only",
  },
  { label: "GPT-4o Mini Vision", value: AI_MODELS.GPT_4O_MINI_VISION, category: "experimental" },
  { label: "Qwen VL Plus", value: AI_MODELS.QWEN_VL, category: "experimental" },
  { label: "DeepSeek VL", value: AI_MODELS.DEEPSEEK_VL, category: "analysis-only" },
  { label: "Moondream 2", value: AI_MODELS.MOONDREAM, category: "analysis-only" },
  { label: "CLIP Interrogator", value: AI_MODELS.CLIP_INTERROGATOR, category: "analysis-only" },
]
