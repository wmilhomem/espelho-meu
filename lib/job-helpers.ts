// Helper functions for job management with versioning

import type { TryOnJob, JobStatus, AIModel } from "@/types"
import { CURRENT_PROMPT_VERSION, CURRENT_PIPELINE_VERSION } from "@/constants/versions"

/**
 * Creates a job payload with automatic versioning
 */
export function createJobPayload(
  userId: string,
  productId: string,
  modelId: string,
  style: string,
  aiModel: AIModel,
  userInstructions?: string,
): Partial<TryOnJob> {
  return {
    userId,
    productId,
    modelId,
    style,
    userInstructions: userInstructions || "Atelier.",
    status: "queued", // Start as queued for async processing
    ai_model_used: aiModel,
    prompt_version: CURRENT_PROMPT_VERSION,
    pipeline_version: CURRENT_PIPELINE_VERSION,
    isFavorite: false,
    isPublic: false,
  }
}

/**
 * Calculates job processing time in seconds
 */
export function getJobProcessingTime(job: TryOnJob): number | null {
  if (!job.started_at || !job.completed_at) return null

  const start = new Date(job.started_at).getTime()
  const end = new Date(job.completed_at).getTime()

  return (end - start) / 1000
}

/**
 * Checks if a job is stale (stuck in processing for too long)
 */
export function isJobStale(job: TryOnJob, timeoutMinutes = 10): boolean {
  if (job.status !== "processing" && job.status !== "queued") return false

  const createdAt = new Date(job.createdAt || Date.now()).getTime()
  const now = Date.now()
  const elapsedMinutes = (now - createdAt) / 1000 / 60

  return elapsedMinutes > timeoutMinutes
}

/**
 * Gets a human-readable status message
 */
export function getJobStatusMessage(status: JobStatus): string {
  const messages: Record<JobStatus, string> = {
    queued: "Na fila de processamento",
    pending: "Aguardando início",
    processing: "Processando transformação",
    completed: "Concluído com sucesso",
    failed: "Falhou ao processar",
  }

  return messages[status] || "Status desconhecido"
}

/**
 * Validates if a job can transition to a new status
 */
export function canTransitionStatus(currentStatus: JobStatus, newStatus: JobStatus): boolean {
  const validTransitions: Record<JobStatus, JobStatus[]> = {
    queued: ["processing", "failed"],
    pending: ["processing", "failed"],
    processing: ["completed", "failed"],
    completed: [], // Terminal state
    failed: [], // Terminal state
  }

  return validTransitions[currentStatus]?.includes(newStatus) ?? false
}
