import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/context/ThemeContext"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Espelho Meu - Um novo reflexo começa aqui",
  description:
    "Uma jornada sensorial que transforma a forma como você se vê. Experiências visuais premium e imersivas.",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Global error suppression setup
              (function() {
                // Suppress ResizeObserver loop errors (benign - from Radix UI Select repositioning)
                const originalError = console.error;
                console.error = function(...args) {
                  if (args[0] && typeof args[0] === 'string' && args[0].includes('ResizeObserver loop')) {
                    return; // Suppress silently
                  }
                  originalError.apply(console, args);
                };
                
                // Capture window error events
                window.addEventListener('error', function(e) {
                  if (e.message && e.message.includes('ResizeObserver loop')) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                    // Hide webpack dev overlay if present
                    const overlay = document.getElementById('webpack-dev-server-client-overlay');
                    if (overlay) overlay.style.display = 'none';
                    return false;
                  }
                }, true); // Use capture phase
                
                // Capture unhandled promise rejections
                window.addEventListener('unhandledrejection', function(e) {
                  const reason = e.reason;
                  
                  // Suppress ResizeObserver errors in promises
                  if (reason && reason.message && reason.message.includes('ResizeObserver loop')) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                    return false;
                  }
                  
                  // Suppress Supabase AbortError (benign - from overlapping auth requests)
                  if (reason && reason.name === 'AbortError' && 
                      (reason.message.includes('signal is aborted') || 
                       reason.message.includes('aborted without reason'))) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                    return false;
                  }
                }, true); // Use capture phase
                
                // Override ResizeObserver to suppress errors at source
                const OriginalResizeObserver = window.ResizeObserver;
                window.ResizeObserver = class extends OriginalResizeObserver {
                  constructor(callback) {
                    super((entries, observer) => {
                      try {
                        callback(entries, observer);
                      } catch (e) {
                        if (e.message && e.message.includes('ResizeObserver loop')) {
                          // Suppress error silently
                          return;
                        }
                        throw e;
                      }
                    });
                  }
                };
              })();
            `,
          }}
        />
        <ThemeProvider>
          {children}
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
