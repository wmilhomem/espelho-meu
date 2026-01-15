"use client"

import { getSupabaseBrowserClient } from "./supabase"

export class AuthenticationError extends Error {
  constructor(message = "Usuário não autenticado") {
    super(message)
    this.name = "AuthenticationError"
  }
}

export async function ensureAuthenticatedOrAbort() {
  const supabase = getSupabaseBrowserClient()
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) {
    console.error("[v0] ❌ Auth session error:", error)
    throw new AuthenticationError("Erro ao verificar autenticação")
  }

  if (!session?.user) {
    throw new AuthenticationError("Usuário não autenticado. Por favor, faça login.")
  }

  return session
}

export async function getCurrentSession() {
  const supabase = getSupabaseBrowserClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session
}
