import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

export function calculateSubtotal(items: Array<{ price?: number; quantity?: number }>): number {
  return items.reduce((sum, item) => {
    const price = item.price || 0
    const quantity = item.quantity || 1
    return sum + price * quantity
  }, 0)
}

export function getStyleInfo(style: string): { emoji: string; label: string; description: string } {
  const styles: Record<string, { emoji: string; label: string; description: string }> = {
    editorial: {
      emoji: "📸",
      label: "Editorial Vogue",
      description: "Iluminação de estúdio profissional, foco nítido, luxo sofisticado",
    },
    seda: {
      emoji: "✨",
      label: "Seda & Cetim",
      description: "Realça o brilho e fluidez dos tecidos premium",
    },
    justa: {
      emoji: "👗",
      label: "Caimento Justo",
      description: "Aderência perfeita ao corpo, destaca a silhueta",
    },
    transparente: {
      emoji: "🌸",
      label: "Transparente & Renda",
      description: "Delicadeza e sofisticação em texturas finas",
    },
    casual: {
      emoji: "☀️",
      label: "Lifestyle",
      description: "Luz natural, vibes de influencer, descontraído",
    },
    passarela: {
      emoji: "⭐",
      label: "Passarela",
      description: "Alta moda, iluminação dramática, atitude poderosa",
    },
  }

  return (
    styles[style] || {
      emoji: "✨",
      label: "Personalizado",
      description: "Estilo customizado",
    }
  )
}

export function parseBannerUrls(bannerData: string | string[]): string[] {
  if (Array.isArray(bannerData)) {
    return bannerData
  }

  if (typeof bannerData === "string") {
    if (bannerData.startsWith("[") || bannerData.startsWith("{")) {
      try {
        const parsed = JSON.parse(bannerData)
        if (Array.isArray(parsed)) {
          return parsed
        }
        return [String(parsed)]
      } catch {
        return [bannerData]
      }
    }
    return [bannerData]
  }

  return []
}

export function getColorClasses(colorName: string): { bg: string; text: string; border: string } {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    gold: {
      bg: "bg-gradient-to-r from-amber-200 to-yellow-400",
      text: "text-amber-900",
      border: "border-amber-400",
    },
    silver: {
      bg: "bg-gradient-to-r from-gray-200 to-gray-400",
      text: "text-gray-900",
      border: "border-gray-400",
    },
    rose: {
      bg: "bg-gradient-to-r from-pink-200 to-rose-400",
      text: "text-rose-900",
      border: "border-rose-400",
    },
    blue: {
      bg: "bg-gradient-to-r from-blue-200 to-blue-400",
      text: "text-blue-900",
      border: "border-blue-400",
    },
    green: {
      bg: "bg-gradient-to-r from-green-200 to-green-400",
      text: "text-green-900",
      border: "border-green-400",
    },
    purple: {
      bg: "bg-gradient-to-r from-purple-200 to-purple-400",
      text: "text-purple-900",
      border: "border-purple-400",
    },
  }

  return (
    colors[colorName] || {
      bg: "bg-gradient-to-r from-gray-200 to-gray-400",
      text: "text-gray-900",
      border: "border-gray-400",
    }
  )
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}
