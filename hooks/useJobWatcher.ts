"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { TryOnJob, JobStatus } from "@/types"
import { supabase } from "@/lib/supabase"

type WatchMode = "polling" | "realtime"

interface UseJobWatcherOptions {
  enabled: boolean
  jobId: string | null
  mode?: WatchMode
  pollingInterval?: number
  onStatusChange?: (job: TryOnJob, prevStatus: JobStatus) => void
  onComplete?: (job: TryOnJob) => void
  onError?: (error: string, job?: TryOnJob) => void
  timeoutMs?: number
}

interface UseJobWatcherReturn {
  currentJob: TryOnJob | null
  isWatching: boolean
  statusHistory: JobStatus[]
  elapsedTime: number
  startWatching: () => void
  stopWatching: () => void
}

export function useJobWatcher({
  enabled,
  jobId,
  mode = "realtime",
  pollingInterval = 4000,
  onStatusChange,
  onComplete,
  onError,
  timeoutMs = 5 * 60 * 1000, // 5 minutes default
}: UseJobWatcherOptions): UseJobWatcherReturn {
  const [currentJob, setCurrentJob] = useState<TryOnJob | null>(null)
  const [isWatching, setIsWatching] = useState(false)
  const [statusHistory, setStatusHistory] = useState<JobStatus[]>([])
  const [elapsedTime, setElapsedTime] = useState(0)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const elapsedIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(Date.now())
  const realtimeChannelRef = useRef<any>(null)
  const prevStatusRef = useRef<JobStatus | null>(null)

  const fetchJobStatus = useCallback(async () => {
    if (!jobId) return null

    try {
      console.log(`[v0][JobWatcher] Fetching status for job: ${jobId}`)

      const { data, error } = await supabase.from("jobs").select("*").eq("id", jobId).single()

      if (error) {
        console.error("[v0][JobWatcher] Database error:", error)
        throw error
      }

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
        ai_model_used: data.ai_model_used,
        prompt_version: data.prompt_version,
        pipeline_version: data.pipeline_version,
        error_message: data.error_message,
        started_at: data.started_at,
        completed_at: data.completed_at,
      }

      console.log(`[v0][JobWatcher] Job status: ${job.status}`)

      return job
    } catch (error: any) {
      console.error("[v0][JobWatcher] Fetch error:", error.message)
      return null
    }
  }, [jobId])

  const handleJobUpdate = useCallback(
    (job: TryOnJob | null) => {
      if (!job) return

      const prevStatus = prevStatusRef.current
      const newStatus = job.status

      setCurrentJob(job)

      // Track status history
      if (prevStatus !== newStatus) {
        console.log(`[v0][JobWatcher] Status transition: ${prevStatus} → ${newStatus}`)
        setStatusHistory((prev) => [...prev, newStatus])
        prevStatusRef.current = newStatus

        // Call status change callback
        if (onStatusChange && prevStatus) {
          onStatusChange(job, prevStatus)
        }
      }

      // Check for terminal states
      if (newStatus === "completed") {
        console.log("[v0][JobWatcher] Job completed successfully")
        stopWatching()
        if (onComplete) {
          onComplete(job)
        }
      } else if (newStatus === "failed") {
        console.log("[v0][JobWatcher] Job failed:", job.error_message)
        stopWatching()
        if (onError) {
          onError(job.error_message || "Job failed without error message", job)
        }
      }

      // Safety timeout check
      const elapsed = Date.now() - startTimeRef.current
      if (elapsed > timeoutMs) {
        console.warn("[v0][JobWatcher] Timeout exceeded:", elapsed, "ms")
        stopWatching()
        if (onError) {
          onError("Timeout: Job is taking longer than expected", job)
        }
      }
    },
    [onStatusChange, onComplete, onError, timeoutMs],
  )

  const setupPolling = useCallback(() => {
    console.log(`[v0][JobWatcher] Setting up polling mode (interval: ${pollingInterval}ms)`)

    // Fetch immediately
    fetchJobStatus().then(handleJobUpdate)

    // Then poll at interval
    intervalRef.current = setInterval(() => {
      fetchJobStatus().then(handleJobUpdate)
    }, pollingInterval)
  }, [fetchJobStatus, handleJobUpdate, pollingInterval])

  const setupRealtime = useCallback(() => {
    if (!jobId) return

    console.log("[v0][JobWatcher] Setting up realtime mode")

    // Fetch initial state
    fetchJobStatus().then(handleJobUpdate)

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`job-${jobId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "jobs", filter: `id=eq.${jobId}` },
        (payload) => {
          console.log("[v0][JobWatcher] Realtime update received:", payload)

          const data = payload.new as any

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
            ai_model_used: data.ai_model_used,
            prompt_version: data.prompt_version,
            pipeline_version: data.pipeline_version,
            error_message: data.error_message,
            started_at: data.started_at,
            completed_at: data.completed_at,
          }

          handleJobUpdate(job)
        },
      )
      .subscribe((status) => {
        console.log("[v0][JobWatcher] Realtime subscription status:", status)
      })

    realtimeChannelRef.current = channel
  }, [jobId, fetchJobStatus, handleJobUpdate])

  const startWatching = useCallback(() => {
    if (!jobId || isWatching) return

    console.log(`[v0][JobWatcher] Starting to watch job: ${jobId} (mode: ${mode})`)
    setIsWatching(true)
    startTimeRef.current = Date.now()
    prevStatusRef.current = null
    setStatusHistory([])
    setElapsedTime(0)

    // Start elapsed time counter
    elapsedIntervalRef.current = setInterval(() => {
      setElapsedTime(Date.now() - startTimeRef.current)
    }, 1000)

    // Setup mode-specific watcher
    if (mode === "realtime") {
      setupRealtime()
    } else {
      setupPolling()
    }
  }, [jobId, isWatching, mode, setupRealtime, setupPolling])

  const stopWatching = useCallback(() => {
    console.log("[v0][JobWatcher] Stopping watcher")

    // Clear polling interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // Clear elapsed time interval
    if (elapsedIntervalRef.current) {
      clearInterval(elapsedIntervalRef.current)
      elapsedIntervalRef.current = null
    }

    // Unsubscribe from realtime
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current)
      realtimeChannelRef.current = null
    }

    setIsWatching(false)
  }, [])

  useEffect(() => {
    if (enabled && jobId) {
      startWatching()
    } else {
      stopWatching()
    }

    return () => {
      stopWatching()
    }
  }, [enabled, jobId])

  return {
    currentJob,
    isWatching,
    statusHistory,
    elapsedTime,
    startWatching,
    stopWatching,
  }
}
