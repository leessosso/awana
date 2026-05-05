import { create } from 'zustand'
import type {
  HandbookProgress,
  HandbookProgressFormData,
} from '../models/HandbookProgress'
import * as handbookService from '../services/handbookService'
import { useAuthStore } from './authStore'

interface HandbookState {
  handbookProgresses: HandbookProgress[]
  isLoading: boolean
  error: string | null
  fetchHandbookProgresses: (churchId: string) => Promise<void>
  createHandbookProgress: (
    progressData: HandbookProgressFormData,
  ) => Promise<void>
  updateHandbookProgress: (
    progressId: string,
    progressData: Partial<HandbookProgressFormData>,
  ) => Promise<void>
  clearError: () => void
}

export const useHandbookStore = create<HandbookState>((set, get) => ({
  handbookProgresses: [],
  isLoading: false,
  error: null,

  fetchHandbookProgresses: async (churchId: string) => {
    set({ isLoading: true, error: null })
    try {
      const progresses =
        await handbookService.getHandbookProgressByChurch(churchId)
      set({ handbookProgresses: progresses, isLoading: false })
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : '핸드북 진도를 불러오는데 실패했습니다.',
        isLoading: false,
      })
    }
  },

  createHandbookProgress: async (progressData: HandbookProgressFormData) => {
    const { user } = useAuthStore.getState()
    if (!user?.uid || !user?.churchId) {
      throw new Error('인증 정보가 없습니다.')
    }

    set({ isLoading: true, error: null })
    try {
      await handbookService.createHandbookProgress(
        progressData,
        user.uid,
        user.churchId,
      )
      // 새로고침을 위해 전체 핸드북 진도 정보를 다시 불러옴
      await get().fetchHandbookProgresses(user.churchId)
      set({ isLoading: false })
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : '핸드북 진도 등록에 실패했습니다.',
        isLoading: false,
      })
      throw error
    }
  },

  updateHandbookProgress: async (
    progressId: string,
    progressData: Partial<HandbookProgressFormData>,
  ) => {
    set({ isLoading: true, error: null })
    try {
      await handbookService.updateHandbookProgress(progressId, progressData)
      set({ isLoading: false })
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : '핸드북 진도 수정에 실패했습니다.',
        isLoading: false,
      })
      throw error
    }
  },

  clearError: () => set({ error: null }),
}))
