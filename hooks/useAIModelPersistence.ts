"use client"

import { useState, useEffect } from "react"
import type { AIModel, User } from "@/types"
import { updateUserProfile } from "@/services/storageService"
import { getAIModelConfig } from "@/constants/aiModels"

export interface UseAIModelPersistenceReturn {
  selectedModel: AIModel
  setSelectedModel: (model: AIModel) => void
  saveModel: () => Promise<void>
  isSaving: boolean
  error: string | null
}

export function useAIModelPersistence(currentUser: User | null): UseAIModelPersistenceReturn {
  const [selectedModel, setSelectedModel] = useState<AIModel>("gemini-2.5-flash-image-preview")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Carrega a preferência do usuário ao montar
  useEffect(() => {
    if (currentUser?.preferences?.aiModel) {
      setSelectedModel(currentUser.preferences.aiModel)
    }
  }, [currentUser])

  const saveModel = async () => {
    if (!currentUser) {
      setError("Usuário não autenticado")
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const modelConfig = getAIModelConfig(selectedModel)

      await updateUserProfile(currentUser.id, {
        preferences: {
          ...currentUser.preferences,
          aiModel: selectedModel,
        },
      })

      console.log("[useAIModelPersistence] ✅ Modelo salvo com sucesso:", selectedModel)
    } catch (err: any) {
      const errorMessage = err?.message || "Erro ao salvar modelo de IA"
      setError(errorMessage)
      console.error("[useAIModelPersistence] ❌ Erro:", errorMessage)
      throw err
    } finally {
      setIsSaving(false)
    }
  }

  return {
    selectedModel,
    setSelectedModel,
    saveModel,
    isSaving,
    error,
  }
}
