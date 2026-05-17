import { create } from 'zustand'
import type {
  GameTimeSession,
  GameTimeSessionFormData,
  GameTimeProgram,
} from '../models/GameTimeScore'
import * as gameTimeService from '../services/gameTimeService'
import { useAuthStore } from './authStore'

interface GameTimeState {
  currentSession: GameTimeSession | null
  gameTimeHistory: GameTimeSession[]
  isLoading: boolean
  error: string | null
  fetchGameTimeSession: (date: Date, program: GameTimeProgram) => Promise<void>
  createGameTimeSession: (sessionData: GameTimeSessionFormData) => Promise<void>
  updateGameTimeSession: (
    sessionId: string,
    sessionData: Partial<GameTimeSessionFormData>,
  ) => Promise<void>
  deleteGameTimeSession: (sessionId: string) => Promise<void>
  fetchGameTimeHistory: () => Promise<void>
  clearError: () => void
}

export const useGameTimeStore = create<GameTimeState>((set, get) => ({
  currentSession: null,
  gameTimeHistory: [],
  isLoading: false,
  error: null,

  fetchGameTimeSession: async (date: Date, program: GameTimeProgram) => {
    const { user } = useAuthStore.getState()
    if (!user?.churchId) {
      set({ error: '교회 정보가 없습니다.', isLoading: false })
      return
    }

    set({ isLoading: true, error: null })
    try {
      const session = await gameTimeService.getGameTimeSessionByDate(
        date,
        user.churchId,
        program,
      )
      set({ currentSession: session, isLoading: false })
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : '게임시간 세션을 불러오는데 실패했습니다.',
        isLoading: false,
      })
    }
  },

  createGameTimeSession: async (sessionData: GameTimeSessionFormData) => {
    const { user } = useAuthStore.getState()
    if (!user?.uid || !user?.churchId) {
      throw new Error('인증 정보가 없습니다.')
    }

    set({ isLoading: true, error: null })
    try {
      await gameTimeService.createGameTimeSession(
        sessionData,
        user.uid,
        user.churchId,
      )
      // 새로고침을 위해 현재 날짜와 프로그램의 세션을 다시 불러옴
      await get().fetchGameTimeSession(sessionData.date, sessionData.program)
      set({ isLoading: false })
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : '게임시간 세션 등록에 실패했습니다.',
        isLoading: false,
      })
      throw error
    }
  },

  updateGameTimeSession: async (
    sessionId: string,
    sessionData: Partial<GameTimeSessionFormData>,
  ) => {
    set({ isLoading: true, error: null })
    try {
      await gameTimeService.updateGameTimeSession(sessionId, sessionData)
      // 날짜와 프로그램이 있으면 해당 값으로, 없으면 현재 세션의 값으로 새로고침
      const date = sessionData.date || get().currentSession?.date || new Date()
      const program =
        sessionData.program || get().currentSession?.program || 'Sparks'
      await get().fetchGameTimeSession(date, program as GameTimeProgram)
      set({ isLoading: false })
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : '게임시간 세션 수정에 실패했습니다.',
        isLoading: false,
      })
      throw error
    }
  },

  deleteGameTimeSession: async (sessionId: string) => {
    set({ isLoading: true, error: null })
    try {
      await gameTimeService.deleteGameTimeSession(sessionId)
      set({ currentSession: null, isLoading: false })
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : '게임시간 세션 삭제에 실패했습니다.',
        isLoading: false,
      })
      throw error
    }
  },

  fetchGameTimeHistory: async () => {
    const { user } = useAuthStore.getState()
    if (!user?.churchId) {
      throw new Error('교회 정보가 없습니다.')
    }

    set({ isLoading: true, error: null })
    try {
      const sessions = await gameTimeService.getGameTimeSessionsByChurch(
        user.churchId,
      )
      // 날짜순으로 정렬 (최신순)
      sessions.sort((a, b) => b.date.getTime() - a.date.getTime())
      set({ gameTimeHistory: sessions, isLoading: false })
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : '게임시간 기록을 불러오는데 실패했습니다.',
        isLoading: false,
      })
    }
  },

  clearError: () => set({ error: null }),
}))
