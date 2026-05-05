import { logger } from './logger'

// 스토어에서 공통으로 사용되는 헬퍼 함수들

// 에러 메시지 추출
export const getErrorMessage = (error: unknown): string => {
  return error instanceof Error
    ? error.message
    : '알 수 없는 오류가 발생했습니다.'
}

// async 작업 래퍼 - 로딩 상태와 에러 처리를 자동화
export const createAsyncAction = <T extends unknown[], R>(
  actionFn: (...args: T) => Promise<R>,
  errorMessage?: string,
) => {
  return async (...args: T): Promise<R | null> => {
    try {
      const result = await actionFn(...args)
      return result
    } catch (error) {
      logger.error(errorMessage || '작업 실패', error)
      throw error // 호출하는 쪽에서 에러를 처리하도록 함
    }
  }
}

// Zustand 스토어의 공통 인터페이스
export interface BaseStoreState {
  isLoading: boolean
  error: string | null
  clearError: () => void
}

// 공통 에러 클리어 액션
export const createClearErrorAction =
  (set: (state: Partial<BaseStoreState>) => void) => () => {
    set({ error: null })
  }
