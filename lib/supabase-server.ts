"use server"

// ============================================
// lib/supabase-server.ts
// ============================================
// CLIENT INSTANCES
// Importa de supabase-config.ts
// Sem validações, sem console.log, APENAS clientes

import { createClient } from "@supabase/supabase-js"
import { supabaseUrl, supabaseServiceKey, supabaseAnonKey } from "./supabase-config"

/**
 * Supabase Server Client (SERVER-SIDE ONLY)
 *
 * IMPORTANT: This file should ONLY be imported in server components or API routes.
 * For client-side operations, use lib/supabase.ts instead.
 */

// ============================================
// ADMIN CLIENT - Use para operações privilegiadas
// ============================================

let adminClientInstance: ReturnType<typeof createClient> | null = null

export function getAdminClient() {
  if (!supabaseServiceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured. Cannot create admin client.")
  }

  if (!adminClientInstance) {
    adminClientInstance = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  return adminClientInstance
}

export function createAdminClient() {
  return getAdminClient()
}

// ============================================
// AUTH CLIENT - Use para operações públicas
// ============================================

let authClientInstance: ReturnType<typeof createClient> | null = null

export function getAuthClient() {
  if (!authClientInstance) {
    authClientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  return authClientInstance
}

export function createAuthClient() {
  return getAuthClient()
}
