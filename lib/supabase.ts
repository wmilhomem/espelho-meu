import { createBrowserClient } from "@supabase/ssr"

/**
 * Supabase Client Configuration
 *
 * This client uses the following environment variables:
 * - NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY
 *
 * See ENV_SETUP.md for more information.
 */

const supabaseUrl = "https://vbzsvedibjdvrdauvcet.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZienN2ZWRpYmpkdnJkYXV2Y2V0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MTYxNDksImV4cCI6MjA4MDM5MjE0OX0.gqLBTjBXUEo0vB1Fky99u3ZuenQkJI23-pYyV9xAQTk"

console.log("[v0] Supabase URL:", supabaseUrl)
console.log("[v0] Supabase Key configured:", !!supabaseAnonKey)

export const isConfigured = !!(supabaseUrl && supabaseUrl.startsWith("https") && supabaseAnonKey)

if (!isConfigured) {
  throw new Error("Supabase configuration is invalid. Check your credentials.")
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

export { supabaseUrl, supabaseAnonKey }

export function getAuthToken(): string | undefined {
  if (typeof window === "undefined") return undefined

  // Access token from localStorage if needed
  const storageKey = "espelho-meu-auth-token-v2"
  const data = localStorage.getItem(storageKey)
  if (data) {
    try {
      const parsed = JSON.parse(data)
      return parsed?.access_token
    } catch {
      return undefined
    }
  }
  return undefined
}
