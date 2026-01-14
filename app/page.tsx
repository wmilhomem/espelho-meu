"use client"

import type React from "react"
import Link from "next/link"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Footer from "@/components/Footer"

export default function Home() {
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isAnimating, setIsAnimating] = useState(false)
  const requestRef = useRef<number>(0)
  const directionRef = useRef<number>(1)
  const [demoGender, setDemoGender] = useState<"female" | "male">("female")
  const [currentDemoIndex, setCurrentDemoIndex] = useState(0)

  const demoExamples = [
    {
      id: 1,
      gender: "Feminino",
      before: "/images/antes-f-1.jpeg",
      after: "/images/depois-f-1.jpeg",
      location: "Santorini",
      labelBefore: "Look Original",
      labelAfter: "Look Transformado (IA)",
    },
    {
      id: 2,
      gender: "Feminino",
      before: "/images/antes-f-1a.jpeg",
      after: "/images/depois-f-1a.jpeg",
      location: "Sydney",
      labelBefore: "Antes",
      labelAfter: "Depois (IA)",
    },
    {
      id: 3,
      gender: "Masculino",
      before: "/images/antes-m-1.jpeg",
      after: "/images/depois-m-1.jpeg",
      location: "Taj Mahal",
      labelBefore: "Original",
      labelAfter: "Transformado (IA)",
    },
  ]

  const currentDemo = demoExamples[currentDemoIndex]

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const animateSlider = () => {
    setSliderPosition((prev) => {
      let next = prev + 0.5 * directionRef.current
      if (next >= 100) {
        directionRef.current = -1
        next = 100
      } else if (next <= 0) {
        directionRef.current = 1
        next = 0
      }
      return next
    })
    requestRef.current = requestAnimationFrame(animateSlider)
  }

  const toggleAnimation = () => {
    if (isAnimating) {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
      setIsAnimating(false)
    } else {
      setIsAnimating(true)
      requestRef.current = requestAnimationFrame(animateSlider)
    }
  }

  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [])

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isAnimating) {
      setIsAnimating(false)
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
    setSliderPosition(Number(e.target.value))
  }

  const officialStores = [
    {
      id: "aurora",
      name: "Aurora Atelier",
      image: "https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=800",
      likes: "1.2k",
      lookTitle: "Vestido Seda Imperial",
    },
    {
      id: "lumina",
      name: "Lumina Fashion",
      image: "https://images.pexels.com/photos/2065195/pexels-photo-2065195.jpeg?auto=compress&cs=tinysrgb&w=800",
      likes: "984",
      lookTitle: "Conjunto Alfaiataria",
    },
    {
      id: "velvet",
      name: "Velvet Gold",
      image: "https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=800",
      likes: "2.1k",
      lookTitle: "Blazer Oversized",
    },
    {
      id: "noir",
      name: "Noir Et Blanc",
      image: "https://images.pexels.com/photos/291762/pexels-photo-291762.jpeg?auto=compress&cs=tinysrgb&w=800",
      likes: "3.5k",
      lookTitle: "Gala Noturno",
    },
    {
      id: "aurora2",
      name: "Aurora Atelier",
      image: "https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=800",
      likes: "890",
      lookTitle: "Casual Chic",
    },
  ]

  const trendingLooks = [
    {
      id: 101,
      title: "Golden Hour Glow",
      user: "Isabella M.",
      likes: "15.4k",
      image: "https://images.pexels.com/photos/2529172/pexels-photo-2529172.jpeg?auto=compress&cs=tinysrgb&w=800",
    },
    {
      id: 102,
      title: "Urban Elegance",
      user: "Rafael S.",
      likes: "12.8k",
      image: "https://images.pexels.com/photos/1852382/pexels-photo-1852382.jpeg?auto=compress&cs=tinysrgb&w=800",
    },
    {
      id: 103,
      title: "Neo Vintage",
      user: "Clara T.",
      likes: "10.1k",
      image: "https://images.pexels.com/photos/837140/pexels-photo-837140.jpeg?auto=compress&cs=tinysrgb&w=800",
    },
    {
      id: 104,
      title: "Future Silk",
      user: "André L.",
      likes: "9.5k",
      image: "https://images.pexels.com/photos/2836486/pexels-photo-2836486.jpeg?auto=compress&cs=tinysrgb&w=800",
    },
    {
      id: 105,
      title: "Red Carpet Ready",
      user: "Sofia B.",
      likes: "8.9k",
      image: "https://images.pexels.com/photos/3050943/pexels-photo-3050943.jpeg?auto=compress&cs=tinysrgb&w=800",
    },
  ]

  return (
    <div className="min-h-screen bg-[#05010a] text-white font-sans overflow-x-hidden selection:bg-luxury-gold selection:text-black">
      {/* Atmosphere Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 w-full h-[60vh] bg-gradient-to-b from-[#240046] via-[#3c096c] to-transparent opacity-80"></div>
        <div className="absolute top-[-10%] left-1/2 transform -translate-x-1/2 w-[80vw] h-[80vw] bg-luxury-gold/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 w-full h-[50vh] bg-gradient-to-t from-[#0f0219] via-[#150822] to-transparent"></div>
        <div className="absolute bottom-0 w-full h-[40vh] bg-[linear-gradient(to_bottom,transparent_0%,rgba(255,215,0,0.03)_50%,transparent_100%)] bg-[length:100%_4px]"></div>
      </div>

      {/* Navigation */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-500 border-b ${scrolled ? "bg-[#0f0219]/80 backdrop-blur-md border-white/5 py-2" : "bg-transparent border-transparent py-6"}`}
      >
        <div className="max-w-7xl mx-auto px-6 flex justify-end items-center">
          <button
            onClick={() => router.push("/login")}
            className="px-8 py-2.5 bg-luxury-gold text-black rounded-full text-xs font-bold uppercase tracking-widest hover:bg-luxury-gold/90 hover:shadow-[0_0_25px_rgba(255,215,0,0.6)] transition-all duration-300 shadow-[0_0_15px_rgba(255,215,0,0.3)]"
          >
            Login / Entrar
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex flex-col justify-center items-center text-center px-4 pt-10 pb-20">
        <div className="max-w-5xl space-y-8 animate-[fadeIn_1s_ease-out] flex flex-col items-center">
          <div className="mb-8 relative w-64 h-64 md:w-96 md:h-96 lg:w-[28rem] lg:h-[28rem] transition-all duration-500 hover:scale-105 mx-auto">
            <img
              src="/images/logo-espelho-meu.jpeg"
              alt="Espelho Meu - Sua Moda, Sua Identidade"
              className="w-full h-full object-contain drop-shadow-[0_0_40px_rgba(255,215,0,0.6)] hover:drop-shadow-[0_0_60px_rgba(255,215,0,0.8)] transition-all duration-500 animate-[float_6s_ease-in-out_infinite]"
            />
          </div>
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-light bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#AA771C] bg-clip-text text-transparent font-serif italic tracking-wide drop-shadow-[0_0_20px_rgba(255,215,0,0.4)]">
            {" "}
            Ver-se diferente muda tudo.{" "}
          </h2>
          <p className="text-white/80 max-w-3xl mx-auto text-base md:text-xl lg:text-2xl leading-relaxed font-light tracking-wide">
            {" "}
            Experimente virtualmente roupas e acessórios de lojas exclusivas em suas próprias fotos com realismo e magia
            da Inteligência Artificial.{" "}
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center mt-12 w-full max-w-2xl mx-auto px-4">
            <Link href="/login" className="flex-1">
              <button className="w-full gold-gradient-bg py-5 rounded-full text-black font-extrabold uppercase tracking-[0.25em] text-xs shadow-[0_0_40px_rgba(255,215,0,0.3)] hover:shadow-[0_0_60px_rgba(255,215,0,0.5)] hover:scale-105 transition-all duration-500">
                CRIAR MEU LOOK
              </button>
            </Link>
            <Link href="/lojas" className="flex-1">
              <button className="w-full gold-gradient-bg py-5 rounded-full text-black font-extrabold uppercase tracking-[0.25em] text-xs shadow-[0_0_40px_rgba(255,215,0,0.3)] hover:shadow-[0_0_60px_rgba(255,215,0,0.5)] hover:scale-105 transition-all duration-500">
                EXPLORAR VITRINES
              </button>
            </Link>
          </div>
        </div>
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2h2m2 4h6a2 2 0 012 2v4m0-4V8m-6 4v4m6-8V8"
            />
          </svg>
        </div>
      </section>

      {/* Official Stores Section */}
      <section className="relative z-10 py-24 px-0 lg:px-6 overflow-hidden border-b border-white/5 bg-[#0a0112]/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 px-6 lg:px-0 gap-6">
            <div>
              <h3 className="text-3xl md:text-5xl font-serif text-white mb-2">Vitrines em Destaque</h3>
              <p className="text-luxury-gold font-light tracking-wider uppercase text-sm">
                Marcas parceiras com provador habilitado.
              </p>
            </div>
            <button
              onClick={() => router.push("/lojas")}
              className="text-xs uppercase tracking-widest font-bold text-white/50 hover:text-white transition-colors flex items-center gap-2"
            >
              Ver Todas <span className="text-luxury-gold">→</span>
            </button>
          </div>

          <div className="flex overflow-x-auto gap-6 pb-8 snap-x custom-scrollbar px-6 lg:px-0">
            {officialStores.map((store, index) => (
              <div
                key={`${store.id}-${index}`}
                className="min-w-[85vw] md:min-w-[350px] lg:min-w-[400px] snap-center group relative aspect-[3/4] rounded-sm overflow-hidden cursor-pointer border border-white/5 hover:border-luxury-gold/50 transition-all duration-500"
              >
                <img
                  src={store.image || "/placeholder.svg"}
                  alt={store.lookTitle}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0219] via-transparent to-transparent opacity-80"></div>
                <div className="absolute inset-0 p-6 flex flex-col justify-end transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <div className="flex justify-between items-end border-b border-white/20 pb-4 mb-4">
                    <div>
                      <p className="text-luxury-gold text-[10px] uppercase tracking-widest font-bold mb-1">
                        {store.lookTitle}
                      </p>
                      <h4 className="text-2xl font-serif text-white">{store.name}</h4>
                    </div>
                    <div className="text-white/80 text-xs font-mono flex items-center gap-1">
                      <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                      {store.likes}
                    </div>
                  </div>
                  <button className="w-full py-3 bg-white/10 backdrop-blur-md border border-white/10 text-white text-xs uppercase tracking-widest hover:bg-luxury-gold hover:text-black transition-colors font-bold opacity-0 group-hover:opacity-100 duration-500 flex items-center justify-center gap-2">
                    Visitar Loja{" "}
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Looks Section */}
      <section className="relative z-10 py-24 px-0 lg:px-6 bg-[#020005]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 px-6">
            <span className="text-luxury-gold text-xs uppercase tracking-[0.3em] font-bold animate-pulse">
              Hall da Fama
            </span>
            <h3 className="text-3xl md:text-5xl font-serif text-white mt-2 mb-4">Os Mais Curtidos</h3>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-luxury-gold to-transparent mx-auto"></div>
          </div>

          <div className="flex overflow-x-auto gap-6 pb-12 snap-x custom-scrollbar px-6 lg:px-0">
            {trendingLooks.map((look) => (
              <div
                key={look.id}
                className="min-w-[280px] md:min-w-[320px] snap-center group relative aspect-[4/5] rounded-2xl overflow-hidden border border-white/10 hover:border-luxury-gold/50 shadow-lg transition-all duration-500"
              >
                <img
                  src={look.image || "/placeholder.svg"}
                  alt={look.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />

                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10 z-20">
                  <svg className="w-4 h-4 text-red-500 fill-current" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  <span className="text-xs font-bold text-white font-mono">{look.likes}</span>
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                  <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-luxury-gold text-[10px] uppercase tracking-widest font-bold mb-1">
                      Criado por {look.user}
                    </p>
                    <h4 className="text-xl font-serif text-white">{look.title}</h4>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="relative z-10 py-24 px-6 bg-[#0a0112] border-t border-white/5 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-r from-luxury-purple/20 via-transparent to-luxury-gold/10 rounded-full blur-[150px] pointer-events-none"></div>

        <div className="w-full max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <span className="text-luxury-gold text-xs uppercase tracking-[0.3em] font-bold">Demonstração</span>
            <h3 className="text-4xl md:text-6xl font-serif text-white mt-2 mb-4 drop-shadow-2xl">O Reflexo em Ação</h3>
            <p className="text-white/60 font-light max-w-xl mx-auto tracking-wide mb-8">
              Do conceito à realidade em segundos. Veja a mágica da fusão entre a peça e a musa.
            </p>

            <div className="flex justify-center gap-3 mb-8">
              {demoExamples.map((example, index) => (
                <button
                  key={example.id}
                  onClick={() => setCurrentDemoIndex(index)}
                  className={`px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
                    currentDemoIndex === index
                      ? "bg-luxury-gold text-black shadow-[0_0_25px_rgba(255,215,0,0.5)] scale-105"
                      : "bg-white/10 text-white/60 hover:text-white hover:bg-white/20 border border-white/10"
                  }`}
                >
                  {example.gender} {index === 1 && currentDemoIndex !== 1 ? "2" : ""}
                </button>
              ))}
            </div>
          </div>

          <div className="relative w-full aspect-[16/9] lg:aspect-[2.35/1] rounded-2xl overflow-hidden border-2 border-white/10 shadow-[0_20px_100px_rgba(0,0,0,0.9)] group select-none">
            <img
              key={`after-${currentDemo.id}`}
              src={currentDemo.after || "/placeholder.svg"}
              alt={`Depois - ${currentDemo.location}`}
              className="absolute inset-0 w-full h-full object-cover object-center animate-[fadeIn_0.5s] bg-black/50"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>

            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${sliderPosition}%`, borderRight: "2px solid rgba(255,215,0,0.8)" }}
            >
              <img
                key={`before-${currentDemo.id}`}
                src={currentDemo.before || "/placeholder.svg"}
                alt={`Antes - ${currentDemo.location}`}
                className="absolute inset-0 w-full h-full object-cover object-center bg-black/50"
              />
              <div className="absolute top-6 left-6 bg-black/70 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest text-white border border-white/20">
                {currentDemo.labelBefore}
              </div>
            </div>

            <div className="absolute top-6 right-6 bg-luxury-gold backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest text-black shadow-[0_0_20px_rgba(255,215,0,0.6)]">
              {currentDemo.labelAfter}
            </div>

            <div
              className="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-luxury-gold to-transparent cursor-ew-resize z-20 shadow-[0_0_20px_rgba(255,215,0,0.8)]"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-luxury-gold rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,215,0,0.6)] border-4 border-black/50 backdrop-blur-sm">
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                </svg>
              </div>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              value={sliderPosition}
              onChange={handleSliderChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
            />

            {!isAnimating && (
              <button
                onClick={toggleAnimation}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-luxury-gold hover:text-black hover:scale-110 transition-all duration-500 z-40 group/play shadow-[0_0_60px_rgba(0,0,0,0.6)]"
              >
                <svg className="w-10 h-10 ml-1 group-hover/play:fill-current" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span className="absolute -bottom-10 text-xs font-bold uppercase tracking-[0.2em] opacity-0 group-hover/play:opacity-100 transition-opacity whitespace-nowrap text-white text-shadow-sm">
                  Ver Transformação
                </span>
              </button>
            )}
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-400 text-xs uppercase tracking-widest font-bold animate-pulse">
              {isAnimating ? "Alternando Vestimentas..." : "Arraste para trocar o look"}
            </p>
          </div>
        </div>
      </section>

      {/* Why Espelho Meu Section */}
      <section className="relative z-10 py-32 px-6 bg-transparent overflow-hidden border-t border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-[#BF953F] via-[#FCF6BA] to-[#AA771C] animate-pulse-slow"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h4 className="text-sm font-bold uppercase tracking-[0.3em] text-[#0a0112]/70 mb-4 animate-pulse">
              Privacidade Primeiro
            </h4>
            <h3 className="text-4xl md:text-5xl font-serif font-bold text-[#0a0112] drop-shadow-sm">
              Segurança e Confiança
            </h3>
            <div className="w-24 h-1 bg-[#0a0112] mx-auto mt-6 rounded-full opacity-80"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
            <div className="group bg-[#0a0112] p-8 rounded-[2rem] border border-white/10 shadow-2xl hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500 hover:-translate-y-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-luxury-gold/20 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-7 h-7 text-luxury-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h5 className="font-serif font-bold text-xl mb-3 text-white group-hover:text-luxury-gold transition-colors">
                Criptografia Total
              </h5>
              <p className="text-sm text-gray-400 leading-relaxed font-light">
                Seus dados e imagens são processados em ambiente isolado, criptografados de ponta a ponta.
              </p>
            </div>

            <div className="group bg-[#0a0112] p-8 rounded-[2rem] border border-white/10 shadow-2xl hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500 hover:-translate-y-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-luxury-gold/20 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-7 h-7 text-luxury-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h5 className="font-serif font-bold text-xl mb-3 text-white group-hover:text-luxury-gold transition-colors">
                Privacidade Absoluta
              </h5>
              <p className="text-sm text-gray-400 leading-relaxed font-light">
                Suas fotos são suas. Não utilizamos seus dados para treinar modelos públicos sem consentimento.
              </p>
            </div>

            <div className="group bg-[#0a0112] p-8 rounded-[2rem] border border-white/10 shadow-2xl hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500 hover:-translate-y-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-luxury-gold/20 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-7 h-7 text-luxury-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </div>
              <h5 className="font-serif font-bold text-xl mb-3 text-white group-hover:text-luxury-gold transition-colors">
                Controle Total
              </h5>
              <p className="text-sm text-gray-400 leading-relaxed font-light">
                Você decide. Exclua seus dados a qualquer momento com um único clique no painel.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-sm font-serif italic text-[#0a0112]/80 font-bold">
              "A verdadeira elegância é sentir-se segura."
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 py-32 px-6 bg-[#05010a] flex flex-col items-center justify-center text-center overflow-hidden border-t border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(191,149,63,0.08),transparent_70%)] pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl space-y-10">
          <h2 className="text-4xl md:text-6xl font-serif text-white leading-tight drop-shadow-2xl">
            Sua imagem é arte.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#AA771C]">
              Revele sua melhor versão.
            </span>
          </h2>

          <div className="flex flex-col sm:flex-row gap-6 justify-center w-full max-w-3xl mx-auto px-4">
            <Link
              href="/login"
              className="group relative inline-flex items-center justify-center px-16 py-6 text-sm font-bold text-black uppercase tracking-[0.25em] bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#AA771C] rounded-full overflow-hidden transition-transform active:scale-95 hover:scale-105 shadow-[0_0_50px_rgba(191,149,63,0.3)] flex-1 animate-[pulse_3s_infinite]"
            >
              <span className="relative z-10">Iniciar Experiência</span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
            </Link>
          </div>

          <p className="text-[10px] text-gray-500 uppercase tracking-[0.3em] font-bold">
            Acesso Imediato • Sem Instalação
          </p>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}
