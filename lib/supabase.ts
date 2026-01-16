"use client"

import { createBrowserClient } from "@supabase/ssr"

/**
 * Supabase Browser Client Configuration (CLIENT-SIDE ONLY)
 *
 * This client uses the following environment variables:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY
 *
 * IMPORTANT: This file should ONLY be imported in client components.
 * For server-side operations, use lib/supabase-server.ts instead.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://vbzsvedibjdvrdauvcet.supabase.co"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZienN2ZWRpYmpkdnJkYXV2Y2V0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MTYxNDksImV4cCI6MjA4MDM5MjE0OX0.gqLBTjBXUEo0vB1Fky99u3ZuenQkJI23-pYyV9xAQTk"

export const isConfigured = !!supabaseUrl && !!supabaseAnonKey

if (!isConfigured) {
  throw new Error("Supabase configuration is invalid. Check your environment variables.")
}

console.log("[v0] Supabase Browser Client initialized")

// ✅ SINGLETON: Cria UMA ÚNICA VEZ - sem chamadas no escopo do módulo
let browserClientInstance: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseBrowserClient() {
  // ✅ Lazy initialization: só cria quando realmente necessário
  if (!browserClientInstance) {
    console.log("[v0] Creating new Supabase browser client instance")
    browserClientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storageKey: "espelho-meu-auth",
        // ✅ CORRIGIDO: window.localStorage apenas se window existir
        storage: typeof window !== "undefined" ? window.localStorage : undefined,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }
  return browserClientInstance
}

// ✅ Alias para compatibilidade
export function getSupabase() {
  return getSupabaseBrowserClient()
}

// This is a getter that always returns the singleton instance
export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient>, {
  get: (target, prop) => {
    const client = getSupabaseBrowserClient()
    return (client as any)[prop]
  },
})

export { supabaseUrl, supabaseAnonKey }

export function getAuthToken(): string | undefined {
  if (typeof window === "undefined") return undefined
  try {
    const client = getSupabaseBrowserClient()
    // Access token from current session
    return client.auth.session()?.access_token
  } catch {
    return undefined
  }
}
