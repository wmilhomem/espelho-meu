// ============================================
// lib/supabase-server.ts
// ============================================
// CLIENT INSTANCES
// Importa de supabase-config.ts
// Sem validações, sem console.log, APENAS clientes

import { createClient } from "@supabase/supabase-js"
import { supabaseUrl, supabaseServiceKey, supabaseAnonKey } from "./supabase-config"

/**
 * Supabase Server Clients (SERVER-SIDE ONLY)
 *
 * IMPORTANT: This file exports CONSTANTS (not functions) to avoid Next.js
 * treating them as Server Actions. These should ONLY be imported in server
 * components or API routes. For client-side operations, use lib/supabase.ts.
 */

// ============================================
// ADMIN CLIENT - Use para operações privilegiadas
// ============================================

if (!supabaseServiceKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured. Cannot create admin client.")
}

export const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    storageKey: "espelho-meu-admin-auth",
  },
})

// ============================================
// AUTH CLIENT - Use para operações públicas
// ============================================

export const authClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    storageKey: "espelho-meu-server-auth",
  },
})
