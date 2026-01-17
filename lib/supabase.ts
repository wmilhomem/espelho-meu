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

if (!isConfigured && typeof window !== "undefined") {
  console.error("[v0] Supabase configuration is invalid. Check your environment variables.")
}

const isServer = typeof window === "undefined"

// Log apenas no cliente para evitar poluir logs do servidor
if (!isServer) {
  console.log("[v0] Supabase Browser Client module loaded")
}

// Singleton: Cria UMA ÚNICA VEZ - sem chamadas no escopo do módulo
let browserClientInstance: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseBrowserClient(): ReturnType<typeof createBrowserClient> {
  // Verificação crítica: impede uso no servidor
  if (isServer) {
    console.error("[v0] ERROR: getSupabaseBrowserClient() called on SERVER!")
    console.error("[v0] Use lib/supabase-server.ts for server-side operations")

    // Retorna um proxy que lança erro em qualquer operação
    // Isso dá uma mensagem de erro clara ao invés de "undefined"
    return new Proxy({} as ReturnType<typeof createBrowserClient>, {
      get: (target, prop) => {
        // Permite toString para debug
        if (prop === "toString" || prop === Symbol.toStringTag) {
          return () => "[ServerSideSupabaseClientError]"
        }
        // Qualquer outra propriedade lança erro
        throw new Error(
          `[Supabase] Cannot use browser client on server. ` +
            `Attempted to access "${String(prop)}". ` +
            `Use adminClient or authClient from lib/supabase-server.ts instead.`,
        )
      },
    }) as ReturnType<typeof createBrowserClient>
  }

  // Lazy initialization: só cria quando realmente necessário
  if (!browserClientInstance) {
    console.log("[v0] [BROWSER] Creating new Supabase browser client instance")

    try {
      browserClientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          storageKey: "espelho-meu-auth",
          storage: window.localStorage, // Seguro pois já verificamos que estamos no browser
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
      console.log("[v0] [BROWSER] Supabase client created successfully")
    } catch (error) {
      console.error("[v0] [BROWSER] Failed to create Supabase client:", error)
      throw error
    }
  }

  return browserClientInstance
}

// Alias para compatibilidade
export function getSupabase() {
  return getSupabaseBrowserClient()
}

export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient>, {
  get: (target, prop) => {
    // No servidor, retorna função que lança erro
    if (isServer) {
      if (prop === "toString" || prop === Symbol.toStringTag) {
        return () => "[ServerSideSupabaseProxy]"
      }
      return () => {
        throw new Error(
          `[Supabase] Cannot use browser client on server. ` +
            `Use adminClient or authClient from lib/supabase-server.ts instead.`,
        )
      }
    }
    const client = getSupabaseBrowserClient()
    return (client as any)[prop]
  },
})

export { supabaseUrl, supabaseAnonKey }

export function getAuthToken(): string | undefined {
  if (isServer) return undefined
  try {
    const client = getSupabaseBrowserClient()
    // @ts-ignore - session() pode não existir em todas as versões
    return client.auth.session?.()?.access_token
  } catch {
    return undefined
  }
}
