import { useState, useCallback } from 'react'

// 비동기 작업을 위한 커스텀 훅
export function useAsync<T = void>() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(
    async (asyncFunction: () => Promise<T>): Promise<T | null> => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await asyncFunction()
        return result
      } catch (err) {
        const message =
          err instanceof Error ? err.message : '작업에 실패했습니다.'
        setError(message)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  const reset = useCallback(() => {
    setIsLoading(false)
    setError(null)
  }, [])

  return {
    isLoading,
    error,
    execute,
    reset,
  }
}
