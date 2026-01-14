export async function GET() {
  // Helper para verificar variáveis em ambientes mistos
  const getEnv = (key: string): string | undefined => {
    return process.env[key]
  }

  const supabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL")
  const serviceKey = getEnv("SUPABASE_SERVICE_ROLE_KEY")
  const geminiKey = getEnv("GEMINI_API_KEY")

  // Retorna status simples (true/false) para não expor segredos
  return new Response(
    JSON.stringify({
      check_status: "ok",
      timestamp: new Date().toISOString(),
      env_vars: {
        NEXT_PUBLIC_SUPABASE_URL: !!supabaseUrl,
        SUPABASE_SERVICE_ROLE_KEY: !!serviceKey,
        SUPABASE_SERVICE_ROLE_KEY_LENGTH: serviceKey ? serviceKey.length : 0,
        GEMINI_API_KEY: !!geminiKey,
        BUCKET: "espelho-assets",
      },
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  )
}
