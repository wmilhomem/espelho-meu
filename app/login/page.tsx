"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Logo from "@/components/Logo"
import { signInWithEmail, signInWithGoogle, signUpWithEmail, sendPasswordResetEmail } from "@/services/userService"

export default function AuthPage() {
  const router = useRouter()
  const [authTab, setAuthTab] = useState<"login" | "register" | "forgot-password">("login")
  const [authError, setAuthError] = useState<string | null>(null)
  const [authSuccess, setAuthSuccess] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(false)
  const [isVerificationSent, setIsVerificationSent] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [redirectTo, setRedirectTo] = useState<string | null>(null)

  // Form Fields
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [regName, setRegName] = useState("")
  const [regEmail, setRegEmail] = useState("")
  const [regPassword, setRegPassword] = useState("")
  const [resetEmail, setResetEmail] = useState("")

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [resendCooldown])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const redirect = params.get("redirectTo")
    if (redirect) {
      setRedirectTo(redirect)
      console.log("[v0] Login page loaded with redirect:", redirect)
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError(null)
    setAuthLoading(true)

    try {
      const { data, error } = await signInWithEmail(loginEmail, loginPassword)

      if (error) {
        setAuthError(error.message || "Erro ao fazer login. Verifique suas credenciais.")
        setAuthLoading(false)
        return
      }

      if (data?.user) {
        console.log("[v0] Login successful, redirecting")
        const destination = redirectTo || "/atelier"
        console.log("[v0] Redirecting to:", destination)
        router.push(destination)
      }
    } catch (err: any) {
      console.error("[v0] Login error:", err)
      setAuthError(err.message || "Erro inesperado ao fazer login.")
      setAuthLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError(null)

    if (!regName || !regEmail || !regPassword) {
      setAuthError("Preencha todos os campos.")
      return
    }

    if (regPassword.length < 6) {
      setAuthError("A senha deve ter no mínimo 6 caracteres.")
      return
    }

    setAuthLoading(true)

    try {
      const { data, error } = await signUpWithEmail(regEmail, regPassword, regName)

      if (error) {
        setAuthError(error.message || "Erro ao criar conta.")
        setAuthLoading(false)
        return
      }

      // Mostra tela de verificação de email
      setIsVerificationSent(true)
      setAuthLoading(false)
    } catch (err: any) {
      console.error("[v0] Registration error:", err)
      setAuthError(err.message || "Erro inesperado ao criar conta.")
      setAuthLoading(false)
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError(null)
    setAuthSuccess(null)

    if (!resetEmail) {
      setAuthError("Por favor, digite seu e-mail.")
      return
    }

    setAuthLoading(true)

    try {
      const { error } = await sendPasswordResetEmail(resetEmail)

      if (error) {
        setAuthError(error.message || "Erro ao enviar link de recuperação.")
        setAuthLoading(false)
        return
      }

      setAuthSuccess("Link de redefinição enviado! Verifique seu e-mail.")
      setResetEmail("")
      setAuthLoading(false)
    } catch (err: any) {
      console.error("[v0] Password reset error:", err)
      setAuthError(err.message || "Erro inesperado ao enviar link de recuperação.")
      setAuthLoading(false)
    }
  }

  const handleResendEmail = async () => {
    if (resendCooldown > 0) return
    setAuthError(null)
    setResendCooldown(60)

    try {
      const { error } = await signUpWithEmail(regEmail, regPassword, regName)
      if (error && !error.message.includes("already registered")) {
        setAuthError("Erro ao reenviar email. Tente novamente.")
      }
    } catch (err) {
      setAuthError("Erro ao reenviar email.")
    }
  }

  const handleGoogleLogin = async () => {
    setAuthError(null)

    try {
      const { error } = await signInWithGoogle()

      if (error) {
        setAuthError(error.message || "Erro ao fazer login com Google.")
        return
      }

      // O Supabase vai redirecionar automaticamente após OAuth
    } catch (err: any) {
      console.error("[v0] Google login error:", err)
      setAuthError(err.message || "Erro inesperado ao fazer login com Google.")
    }
  }

  return (
    <div className="min-h-screen bg-[#05010a] flex items-center justify-center p-4 relative overflow-hidden text-white font-sans selection:bg-luxury-gold selection:text-black">
      {/* ATMOSPHERE BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 w-full h-[60vh] bg-gradient-to-b from-[#240046] via-[#3c096c] to-transparent opacity-80"></div>
        <div className="absolute top-[-10%] left-1/2 transform -translate-x-1/2 w-[80vw] h-[80vw] bg-luxury-gold/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 w-full h-[50vh] bg-gradient-to-t from-[#0f0219] via-[#150822] to-transparent"></div>
        <div className="absolute bottom-0 w-full h-[40vh] bg-[linear-gradient(to_bottom,transparent_0%,rgba(255,215,0,0.03)_50%,transparent_100%)] bg-[length:100%_4px]"></div>
      </div>

      <div className="w-full max-w-md animate-[zoomIn_0.5s_ease-out] relative z-10">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-theme-accent to-theme-secondary rounded-2xl flex items-center justify-center text-black mb-6 shadow-[0_0_30px_rgba(255,215,0,0.4)] animate-[bounce_2s_infinite]">
            <Logo variant="icon-only" className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-serif gold-gradient-text mb-2 tracking-tight">Espelho Meu</h1>
          <p className="text-theme-textMuted text-xs uppercase tracking-[0.4em]">Provador Virtual</p>
        </div>

        <div className="glass-card-block rounded-2xl shadow-2xl overflow-hidden relative border border-white/10 backdrop-blur-xl bg-black/40">
          {authLoading && (
            <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-theme-accent border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_15px_var(--color-accent)]"></div>
                <p className="text-theme-accent text-xs uppercase tracking-widest animate-pulse font-bold">
                  Autenticando...
                </p>
              </div>
            </div>
          )}

          {isVerificationSent ? (
            <div className="p-8 text-center animate-[fadeIn_0.5s]">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-theme-text mb-2">Verifique seu E-mail</h3>
              <p className="text-theme-textMuted text-sm mb-6 leading-relaxed">
                Enviamos um link de confirmação para <strong>{regEmail}</strong>.<br />
                Por favor, acesse seu e-mail para liberar seu acesso.
              </p>
              <div className="bg-black/30 p-4 rounded border border-white/10 mb-6 text-xs text-gray-400 text-left">
                <p>
                  <strong>Nota:</strong> Verifique a caixa de Spam se não encontrar o email em 5 minutos.
                </p>
              </div>
              {authError && (
                <div className="text-red-400 text-xs text-center bg-red-500/10 p-3 rounded border border-red-500/20 shadow-inner">
                  {authError}
                </div>
              )}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleResendEmail}
                  disabled={resendCooldown > 0}
                  className="w-full py-3 bg-white/5 border border-white/10 text-theme-text font-medium rounded-lg text-xs hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendCooldown > 0 ? `Tentar novamente em ${resendCooldown}s` : "Reenviar E-mail"}
                </button>
                <button
                  onClick={() => {
                    setIsVerificationSent(false)
                    setAuthTab("login")
                    setAuthError(null)
                  }}
                  className="text-theme-accent text-sm font-bold hover:underline"
                >
                  Voltar para o Login
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8">
              {authTab === "forgot-password" ? (
                <form onSubmit={handlePasswordReset} className="space-y-5 animate-[fadeIn_0.3s]">
                  <div className="text-center mb-6">
                    <h2 className="text-theme-text text-xl font-bold tracking-wide">Recuperar Senha</h2>
                    <p className="text-theme-textMuted text-xs mt-1">
                      Enviaremos um link para você redefinir sua senha
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] text-theme-textMuted uppercase font-bold ml-1 mb-1 block tracking-wider">
                      Email Cadastrado
                    </label>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-theme-accent focus:bg-black/40 focus:ring-1 focus:ring-theme-accent outline-none transition-all placeholder-gray-500"
                      placeholder="seu@email.com"
                    />
                  </div>
                  {authError && (
                    <div className="text-red-400 text-xs text-center bg-red-500/10 p-3 rounded border border-red-500/20 shadow-inner">
                      {authError}
                    </div>
                  )}
                  {authSuccess && (
                    <div className="text-green-400 text-xs text-center bg-green-500/10 p-3 rounded border border-green-500/20 shadow-inner flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {authSuccess}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={authLoading || !!authSuccess}
                    className="gold-gradient-bg w-full py-4 text-black font-bold rounded-lg uppercase tracking-widest transition-all text-xs flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 shadow-[0_5px_15px_rgba(0,0,0,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {authLoading ? "Enviando..." : "Enviar Link de Recuperação"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab("login")
                      setAuthError(null)
                      setAuthSuccess(null)
                    }}
                    className="w-full text-[10px] uppercase tracking-widest text-theme-accent hover:text-white mt-4 block text-center font-bold transition-colors"
                  >
                    Voltar para o Login
                  </button>
                </form>
              ) : authTab === "login" ? (
                <form onSubmit={handleLogin} className="space-y-5 animate-[fadeIn_0.3s]">
                  <div className="text-center mb-6">
                    <h2 className="text-theme-text text-xl font-bold tracking-wide">Bem-vindo de volta</h2>
                    <p className="text-theme-textMuted text-xs mt-1">Entre para acessar seus looks exclusivos</p>
                  </div>
                  <div>
                    <label className="text-[10px] text-theme-textMuted uppercase font-bold ml-1 mb-1 block tracking-wider">
                      Email
                    </label>
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-theme-accent focus:bg-black/40 focus:ring-1 focus:ring-theme-accent outline-none transition-all placeholder-gray-500"
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-theme-textMuted uppercase font-bold ml-1 mb-1 block tracking-wider">
                      Senha
                    </label>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-theme-accent focus:bg-black/40 focus:ring-1 focus:ring-theme-accent outline-none transition-all placeholder-gray-500"
                      placeholder="••••••••"
                      required
                    />
                    <div className="text-right mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthTab("forgot-password")
                          setAuthError(null)
                        }}
                        className="text-[10px] text-theme-textMuted hover:text-white transition-colors cursor-pointer"
                      >
                        Esqueceu a senha?
                      </button>
                    </div>
                  </div>
                  {authError && (
                    <div className="text-red-400 text-xs text-center bg-red-500/10 p-3 rounded border border-red-500/20 shadow-inner flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>{authError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="gold-gradient-bg w-full py-4 text-black font-bold rounded-lg uppercase tracking-widest transition-all text-xs flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:shadow-[0_0_30px_rgba(255,215,0,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {authLoading ? "Entrando..." : "ENTRAR"}
                  </button>

                  <div className="text-center pt-2">
                    <span className="text-xs text-theme-textMuted">Não tem cadastro? </span>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthTab("register")
                        setAuthError(null)
                      }}
                      className="text-xs text-theme-accent font-bold hover:underline"
                    >
                      Cadastre-se
                    </button>
                  </div>

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-theme-border/50"></div>
                    <span className="flex-shrink-0 mx-4 text-theme-textMuted text-[10px] uppercase tracking-wider">
                      Ou
                    </span>
                    <div className="flex-grow border-t border-theme-border/50"></div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full py-3 bg-white text-black font-bold rounded-lg flex items-center justify-center gap-3 hover:bg-gray-200 transition-all text-xs shadow-lg group"
                  >
                    <div className="p-1 bg-white rounded-full">
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                    </div>
                    <span className="group-hover:text-blue-600 transition-colors">Continuar com Google</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push("/")}
                    className="w-full text-[10px] uppercase tracking-widest text-theme-accent hover:text-white mt-4 block text-center font-bold transition-colors"
                  >
                    Voltar para a Home
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-5 animate-[fadeIn_0.3s]">
                  <div className="text-center mb-6">
                    <h2 className="text-theme-text text-xl font-bold tracking-wide">Criar Conta</h2>
                    <p className="text-theme-textMuted text-xs mt-1">Preencha seus dados abaixo</p>
                  </div>
                  <div>
                    <label className="text-[10px] text-theme-textMuted uppercase font-bold ml-1 mb-1 block tracking-wider">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-theme-accent focus:bg-black/40 focus:ring-1 focus:ring-theme-accent outline-none transition-all placeholder-gray-500"
                      placeholder="Ex: Maria Silva"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-theme-textMuted uppercase font-bold ml-1 mb-1 block tracking-wider">
                      Email
                    </label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-theme-accent focus:bg-black/40 focus:ring-1 focus:ring-theme-accent outline-none transition-all placeholder-gray-500"
                      placeholder="seu@email.com"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-theme-textMuted uppercase font-bold ml-1 mb-1 block tracking-wider">
                      Senha
                    </label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-theme-accent focus:bg-black/40 focus:ring-1 focus:ring-theme-accent outline-none transition-all placeholder-gray-500"
                      placeholder="Crie uma senha forte"
                    />
                  </div>
                  {authError && (
                    <div className="text-red-400 text-xs text-center bg-red-500/10 p-3 rounded border border-red-500/20 shadow-inner flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>{authError}</span>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="gold-gradient-bg w-full py-4 text-black font-bold rounded-lg uppercase tracking-widest transition-all mt-2 text-xs flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(255,215,0,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {authLoading ? "Cadastrando..." : "CADASTRAR"}
                  </button>
                  <div className="text-center pt-2">
                    <span className="text-xs text-theme-textMuted">Já possui uma conta? </span>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthTab("login")
                        setAuthError(null)
                      }}
                      className="text-xs text-theme-accent font-bold hover:underline"
                    >
                      Entrar
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push("/")}
                    className="w-full text-[10px] uppercase tracking-widest text-theme-accent hover:text-white mt-4 block text-center font-bold transition-colors"
                  >
                    Voltar para a Home
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
        <div className="text-center mt-8 text-[10px] text-theme-accent opacity-80 uppercase tracking-widest font-bold">
          &copy; 2025 Espelho Meu. Todos os direitos reservados.
        </div>
      </div>
    </div>
  )
}
