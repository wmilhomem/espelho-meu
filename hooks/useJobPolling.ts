"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { TryOnJob } from "@/types"
import { supabase } from "@/lib/supabase"

interface UseJobPollingOptions {
  enabled: boolean
  jobId: string | null
  onComplete: (job: TryOnJob) => void
  onError: (error: string) => void
  pollingInterval?: number
}

export function useJobPolling({ enabled, jobId, onComplete, onError, pollingInterval = 3000 }: UseJobPollingOptions) {
  const [currentJob, setCurrentJob] = useState<TryOnJob | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(Date.now())

  const fetchJobStatus = useCallback(async () => {
    if (!jobId) return

    try {
      const { data, error } = await supabase.from("jobs").select("*").eq("id", jobId).single()

      if (error) throw error

      const job: TryOnJob = {
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
        aiModelUsed: data.ai_model_used,
        errorMessage: data.error_message,
      }

      setCurrentJob(job)

      // Check if job is terminal state
      if (job.status === "completed") {
        stopPolling()
        onComplete(job)
      } else if (job.status === "failed") {
        stopPolling()
        onError(job.errorMessage || "Falha no processamento da imagem")
      }

      // Safety timeout: 5 minutes
      const elapsed = Date.now() - startTimeRef.current
      if (elapsed > 5 * 60 * 1000) {
        stopPolling()
        onError("Timeout: O processamento está demorando mais que o esperado")
      }
    } catch (error: any) {
      console.error("[useJobPolling] Erro ao buscar status:", error)
      stopPolling()
      onError("Erro ao verificar status do job")
    }
  }, [jobId, onComplete, onError])

  const startPolling = useCallback(() => {
    if (!jobId || isPolling) return

    console.log("[useJobPolling] Iniciando polling para job:", jobId)
    setIsPolling(true)
    startTimeRef.current = Date.now()

    // Fetch immediately
    fetchJobStatus()

    // Then poll at interval
    intervalRef.current = setInterval(fetchJobStatus, pollingInterval)
  }, [jobId, isPolling, fetchJobStatus, pollingInterval])

  const stopPolling = useCallback(() => {
    console.log("[useJobPolling] Parando polling")
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsPolling(false)
  }, [])

  // Start/stop polling based on enabled flag
  useEffect(() => {
    if (enabled && jobId) {
      startPolling()
    } else {
      stopPolling()
    }

    return () => stopPolling()
  }, [enabled, jobId, startPolling, stopPolling])

  return {
    currentJob,
    isPolling,
    startPolling,
    stopPolling,
  }
}
