import type React from "react"

const Footer: React.FC = () => {
  return (
    <footer className="mt-20 py-10 border-t border-theme-accent/20 bg-gradient-to-b from-theme-accent/20 to-[#05010a] relative overflow-hidden backdrop-blur-sm">
      {/* Decorative Top Line Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-theme-accent/50 to-transparent shadow-[0_0_20px_var(--color-accent)]"></div>

      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
        {/* Copyright & Brand */}
        <div className="text-center md:text-left">
          <p className="text-xs text-theme-accent font-bold uppercase tracking-[0.2em] mb-1">Espelho Meu Atelier</p>
          <p className="text-[10px] text-white font-light tracking-wide">
            &copy; {new Date().getFullYear()} Todos os direitos reservados.
          </p>
        </div>

        {/* Social Icons */}
        <div className="flex items-center gap-6">
          <a href="#" className="group relative p-2" aria-label="Instagram">
            <div className="absolute inset-0 bg-theme-accent/0 group-hover:bg-theme-accent/10 rounded-full transition-all duration-300 scale-0 group-hover:scale-100"></div>
            <svg
              className="w-5 h-5 text-white group-hover:text-theme-accent transition-colors relative z-10"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M17 2h-10c-2.76 0-5 2.24-5 5v10c0 2.76 2.24 5 5 5h10c2.76 0 5-2.24 5-5v-10c0-2.76-2.24-5-5-5zm-5 14c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm5-9c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
            </svg>
          </a>

          <a href="#" className="group relative p-2" aria-label="Facebook">
            <div className="absolute inset-0 bg-theme-accent/0 group-hover:bg-theme-accent/10 rounded-full transition-all duration-300 scale-0 group-hover:scale-100"></div>
            <svg
              className="w-5 h-5 text-white group-hover:text-theme-accent transition-colors relative z-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"
              />
            </svg>
          </a>

          <a href="#" className="group relative p-2" aria-label="TikTok">
            <div className="absolute inset-0 bg-theme-accent/0 group-hover:bg-theme-accent/10 rounded-full transition-all duration-300 scale-0 group-hover:scale-100"></div>
            <svg
              className="w-5 h-5 text-white group-hover:text-theme-accent transition-colors relative z-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5v-4a9 9 0 0 0 -9 -9v4"
              />
            </svg>
          </a>
        </div>

        {/* Legal Links */}
        <div className="flex gap-6 text-[10px] uppercase tracking-widest font-bold text-white">
          <a
            href="#"
            className="hover:text-theme-accent transition-colors flex items-center gap-1 hover:underline decoration-theme-accent/50"
          >
            Termos de Uso
          </a>
          <a
            href="#"
            className="hover:text-theme-accent transition-colors flex items-center gap-1 hover:underline decoration-theme-accent/50"
          >
            Privacidade
          </a>
          <a
            href="#"
            className="hover:text-theme-accent transition-colors flex items-center gap-1 hover:underline decoration-theme-accent/50"
          >
            Suporte
          </a>
        </div>
      </div>
    </footer>
  )
}

export default Footer
