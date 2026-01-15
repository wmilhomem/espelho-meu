// ============================================
// lib/supabase-config.ts
// ============================================
// PURO ARQUIVO DE CONFIGURAÇÃO
// Sem Server Actions, sem imports complicados
// Use APENAS para variáveis de ambiente

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://vbzsvedibjdvrdauvcet.supabase.co"
export const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validações
if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL")
}

if (!supabaseServiceKey) {
  console.error("❌ Missing SUPABASE_SERVICE_ROLE_KEY - Admin operations will fail")
}

if (!supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY")
}
