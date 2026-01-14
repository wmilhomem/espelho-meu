export type TryOnStyle = "editorial" | "seda" | "justa" | "transparente" | "casual" | "passarela"
export type ImageAssetType = "product" | "model" | "result"

export type AIProvider = "gemini" | "groq" | "openai" | "qwen" | "deepseek" | "moondream" | "clip"
export type AIModel =
  | "gemini-2.5-flash-image-preview"
  | "gemini-2.0-flash-exp"
  | "gemini-1.5-pro-vision"
  | "gemini-1.5-flash-vision"
  | "llama-3.2-90b-vision-preview"
  | "gpt-4o-mini-vision"
  | "qwen-vl-plus"
  | "deepseek-vl"
  | "moondream-2"
  | "clip-interrogator"

export type JobStatus = "queued" | "pending" | "processing" | "completed" | "failed"

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

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  plan: "free" | "pro" | "enterprise"
  preferences?: {
    emailNotifications?: boolean
    aiProvider?: AIProvider
    aiModel?: AIModel
    [key: string]: any
  }
  ai_model?: AIModel
  storeConfig?: {
    isSalesPageEnabled?: boolean
    storeName?: string
    storeLogo?: string
    storeBanner?: string
    storeStyle?: string
    whatsapp?: string
    socialLinks?: Record<string, string>
    kyc?: any
  }
}

export interface ImageAsset {
  id: string
  user_id?: string
  name?: string
  description?: string
  category?: string
  type: ImageAssetType
  source: "file" | "url"
  preview: string
  mimeType: string
  data?: string
  originalUrl?: string
  file?: File
  createdAt?: string
  isFavorite?: boolean
  storage_path?: string
  price?: number
  published?: boolean
}

export interface TryOnJob {
  id: string
  userId: string
  productId: string
  modelId: string
  userInstructions?: string
  style: TryOnStyle
  status: JobStatus
  resultImage?: string
  createdAt?: string
  isFavorite?: boolean
  isPublic?: boolean
  productOwnerId?: string
  productPreview?: string
  productName?: string

  ai_model_used?: string
  prompt_version?: string
  pipeline_version?: string
  error_message?: string
  started_at?: string
  completed_at?: string
}

export interface HistoryItem {
  id: string
  resultImage: string
  productPreview: string
  modelPreview: string
  timestamp: number
  status: "processing" | "completed" | "failed"
  origin: "store" | "personal"
  storeName?: string
  jobId?: string
  isPublic?: boolean
}

export interface ImageData {
  source: "file" | "url"
  data: string
  mimeType: string
  preview: string
  originalUrl?: string
  file?: File
}

export interface Notification {
  id: string
  title: string
  message: string
  type: "success" | "error" | "info" | "warning"
  read: boolean
  timestamp: number
}

export interface CartItem extends ImageAsset {
  cartId?: string
  quantity?: number
}

export interface Order {
  id: string
  store_id: string
  user_id: string
  customer_details: any
  total_amount: number
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled"
  payment_method: string
  created_at?: string
  items?: any[]
  store_name?: string
}
