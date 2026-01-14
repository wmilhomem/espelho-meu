"use client"

import { useEffect, useState } from "react"
import { supabase, isConfigured } from "../lib/supabase"

/**
 * Component to check and display environment configuration status
 * Useful for debugging configuration issues
 */
export function EnvChecker() {
  const [status, setStatus] = useState({
    supabase: false,
    gemini: false,
    checking: true,
  })

  useEffect(() => {
    const checkEnv = async () => {
      // Check Supabase
      const supabaseOk = isConfigured
      let supabaseConnected = false

      if (supabaseOk) {
        try {
          const { data, error } = await supabase.from("users").select("count").limit(1)
          supabaseConnected = !error
        } catch (e) {
          console.error("Supabase connection test failed:", e)
        }
      }

      // Check Gemini API (only in development)
      const geminiOk = typeof process !== "undefined" && !!process.env.GEMINI_API_KEY

      setStatus({
        supabase: supabaseConnected,
        gemini: geminiOk,
        checking: false,
      })
    }

    checkEnv()
  }, [])

  if (status.checking) {
    return (
      <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-lg text-sm">
        <div className="flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
          <span>Verificando configuração...</span>
        </div>
      </div>
    )
  }

  const allOk = status.supabase && status.gemini

  // Only show in development or if there are issues
  if (allOk && process.env.NODE_ENV === "production") {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-lg text-sm max-w-md">
      <h3 className="font-bold mb-2 flex items-center gap-2">{allOk ? "✅" : "⚠️"} Status da Configuração</h3>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span>{status.supabase ? "✅" : "❌"}</span>
          <span>Supabase Database</span>
        </div>
        <div className="flex items-center gap-2">
          <span>{status.gemini ? "✅" : "❌"}</span>
          <span>Google Gemini AI</span>
        </div>
      </div>
      {!allOk && (
        <p className="mt-2 text-xs text-gray-400">Consulte ENV_SETUP.md para configurar as variáveis de ambiente</p>
      )}
    </div>
  )
}
