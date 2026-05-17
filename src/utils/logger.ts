// 간단한 로깅 유틸리티
export const logger = {
  info: (message: string, ...args: unknown[]) => {
    if (import.meta.env.DEV) {
      console.log(`[INFO] ${message}`, ...args)
    }
  },

  warn: (message: string, ...args: unknown[]) => {
    if (import.meta.env.DEV) {
      console.warn(`[WARN] ${message}`, ...args)
    }
  },

  error: (message: string, error?: unknown) => {
    // 에러는 프로덕션에서도 로깅
    console.error(`[ERROR] ${message}`, error)
  },

  debug: (message: string, ...args: unknown[]) => {
    if (import.meta.env.DEV) {
      console.debug(`[DEBUG] ${message}`, ...args)
    }
  },
}
