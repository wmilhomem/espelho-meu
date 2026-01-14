"use client"

interface LogoProps {
  className?: string
  variant?: "full" | "icon-only" | "image"
  animate?: boolean
}

export default function Logo({ className = "", variant = "full", animate = false }: LogoProps) {
  if (variant === "image") {
    return (
      <div className={`${className} ${animate ? "animate-float" : ""}`}>
        <img
          src="/images/logo-espelho-meu.jpeg"
          alt="Espelho Meu"
          className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(191,149,63,0.6)]"
        />
      </div>
    )
  }

  return (
    <div className={`${className} ${animate ? "animate-float" : ""}`}>
      <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Golden Mirror Frame */}
        <circle
          cx="100"
          cy="100"
          r="80"
          stroke="url(#goldGradient)"
          strokeWidth="4"
          fill="none"
          className="drop-shadow-[0_0_15px_rgba(191,149,63,0.5)]"
        />

        {/* Inner Reflection Glow */}
        <circle cx="100" cy="100" r="70" fill="url(#reflectionGradient)" opacity="0.3" />

        {/* Stylized "E" and "M" intertwined */}
        <path
          d="M 70 70 L 70 130 L 95 130 L 95 120 L 80 120 L 80 105 L 90 105 L 90 95 L 80 95 L 80 80 L 95 80 L 95 70 Z"
          fill="url(#goldGradient)"
          className="drop-shadow-md"
        />
        <path
          d="M 105 70 L 105 130 L 115 130 L 115 85 L 125 110 L 130 85 L 130 130 L 140 130 L 140 70 L 127 70 L 120 105 L 113 70 Z"
          fill="url(#goldGradient)"
          className="drop-shadow-md"
        />

        {/* Sparkle Effects */}
        <circle cx="60" cy="50" r="2" fill="#FCF6BA" className="animate-pulse" />
        <circle cx="145" cy="55" r="1.5" fill="#FCF6BA" className="animate-pulse" style={{ animationDelay: "0.5s" }} />
        <circle cx="140" cy="145" r="2" fill="#FCF6BA" className="animate-pulse" style={{ animationDelay: "1s" }} />

        {/* Gradient Definitions */}
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#BF953F" />
            <stop offset="50%" stopColor="#FCF6BA" />
            <stop offset="100%" stopColor="#AA771C" />
          </linearGradient>
          <radialGradient id="reflectionGradient" cx="50%" cy="30%">
            <stop offset="0%" stopColor="#FCF6BA" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  )
}
