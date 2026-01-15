type LogLevel = "debug" | "info" | "warn" | "error"

const isDevelopment = process.env.NODE_ENV === "development"

class Logger {
  private log(level: LogLevel, message: string, ...args: any[]) {
    const timestamp = new Date().toISOString()
    const prefix = `[v0][${timestamp}][${level.toUpperCase()}]`

    // Always log errors
    if (level === "error") {
      console.error(prefix, message, ...args)
      return
    }

    // Only log debug/info/warn in development
    if (isDevelopment) {
      switch (level) {
        case "debug":
          console.log(prefix, message, ...args)
          break
        case "info":
          console.info(prefix, message, ...args)
          break
        case "warn":
          console.warn(prefix, message, ...args)
          break
      }
    }
  }

  debug(message: string, ...args: any[]) {
    this.log("debug", message, ...args)
  }

  info(message: string, ...args: any[]) {
    this.log("info", message, ...args)
  }

  warn(message: string, ...args: any[]) {
    this.log("warn", message, ...args)
  }

  error(message: string, ...args: any[]) {
    this.log("error", message, ...args)
  }
}

export const logger = new Logger()
