"use server"

import { createClient } from "@supabase/supabase-js"

/**
 * Supabase Server Client Configuration (SERVER-SIDE ONLY)
 *
 * This client uses:
 * - SUPABASE_SERVICE_ROLE_KEY (admin access - NEVER expose to client)
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY (public access)
 *
 * IMPORTANT: This file should ONLY be imported in server components or API routes.
 * For client-side operations, use lib/supabase.ts instead.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://vbzsvedibjdvrdauvcet.supabase.co"
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// ✅ Validação de configuração
if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable")
}

if (!supabaseServiceKey) {
  console.error("❌ Missing SUPABASE_SERVICE_ROLE_KEY - Admin operations will fail")
}

if (!supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable")
}

console.log("[v0] Supabase Server Client initialized (SERVICE ROLE)")

// ============================================
// ADMIN CLIENT - Use para operações privilegiadas
// ============================================

let adminClientInstance: ReturnType<typeof createClient> | null = null

export function getAdminClient() {
  if (!supabaseServiceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured. Cannot create admin client.")
  }

  // ✅ Lazy initialization
  if (!adminClientInstance) {
    console.log("[v0] Creating new Supabase admin client instance")
    adminClientInstance = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  return adminClientInstance
}

// ✅ Alias para compatibilidade
export function createAdminClient() {
  return getAdminClient()
}

// ============================================
// AUTH CLIENT - Use para operações públicas
// ============================================

let authClientInstance: ReturnType<typeof createClient> | null = null

export function getAuthClient() {
  // ✅ Lazy initialization
  if (!authClientInstance) {
    console.log("[v0] Creating new Supabase auth client instance")
    authClientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  return authClientInstance
}

// ✅ Alias para compatibilidade
export function createAuthClient() {
  return getAuthClient()
}

// ============================================
// EXPORTS
// ============================================

export { supabaseUrl, supabaseServiceKey, supabaseAnonKey }
