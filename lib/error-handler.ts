import type { PostgrestError } from "@supabase/supabase-js"
import { logger } from "./logger"

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
  ) {
    super(message)
    this.name = "AppError"
  }
}

export function handleSupabaseError(error: unknown, context: string): AppError {
  logger.error(`${context} error:`, error)

  // Handle AbortError - not a real error
  if (error instanceof Error && error.name === "AbortError") {
    return new AppError("Operação cancelada", "ABORTED", 499)
  }

  // Handle Supabase PostgrestError
  if (isPostgrestError(error)) {
    const message = getPostgrestErrorMessage(error)
    return new AppError(message, error.code || "DB_ERROR", 400)
  }

  // Handle standard Error
  if (error instanceof Error) {
    return new AppError(error.message, "UNKNOWN_ERROR", 500)
  }

  // Handle unknown errors
  return new AppError("Erro desconhecido", "UNKNOWN_ERROR", 500)
}

function isPostgrestError(error: unknown): error is PostgrestError {
  return typeof error === "object" && error !== null && "code" in error && "message" in error && "details" in error
}

function getPostgrestErrorMessage(error: PostgrestError): string {
  // Common Supabase error codes
  const errorMessages: Record<string, string> = {
    "23505": "Registro duplicado. Este item já existe.",
    "23503": "Operação não permitida. Referência não encontrada.",
    "42501": "Permissão negada. Você não tem acesso a este recurso.",
    PGRST116: "Nenhum registro encontrado.",
    "42P01": "Tabela não encontrada. Erro de configuração.",
  }

  return errorMessages[error.code] || error.message || "Erro ao processar operação"
}

export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError"
}
