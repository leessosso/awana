import { create } from 'zustand'
import { useAuthStore } from './authStore'
import { teamActivityScoreService } from '../services/teamActivityScoreService'
import type {
  TeamActivityProgram,
  TeamActivitySession,
  TeamActivitySessionFormData,
} from '../models/TeamActivityScore'

interface TeamActivityScoreState {
  currentSession: TeamActivitySession | null
  isLoading: boolean
  error: string | null
  fetchTeamActivitySession: (date: Date, program: TeamActivityProgram) => Promise<void>
  createTeamActivitySession: (sessionData: TeamActivitySessionFormData) => Promise<void>
  updateTeamActivitySession: (
    sessionId: string,
    sessionData: Partial<TeamActivitySessionFormData>
  ) => Promise<void>
  deleteTeamActivitySession: (sessionId: string) => Promise<void>
  clearError: () => void
}

export const useTeamActivityScoreStore = create<TeamActivityScoreState>((set, get) => ({
  currentSession: null,
  isLoading: false,
  error: null,

  fetchTeamActivitySession: async (date: Date, program: TeamActivityProgram) => {
    const { user } = useAuthStore.getState()
    if (!user?.churchId) {
      set({ error: '교회 정보가 없습니다.', isLoading: false })
      return
    }

    set({ isLoading: true, error: null })
    try {
      const session = await teamActivityScoreService.getTeamActivitySessionByDate(
        date,
        user.churchId,
        program
      )
      set({ currentSession: session, isLoading: false })
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : '팀 활동 점수를 불러오는데 실패했습니다.',
        isLoading: false,
      })
    }
  },

  createTeamActivitySession: async (sessionData: TeamActivitySessionFormData) => {
    const { user } = useAuthStore.getState()
    if (!user?.uid || !user?.churchId) {
      throw new Error('인증 정보가 없습니다.')
    }

    set({ isLoading: true, error: null })
    try {
      await teamActivityScoreService.createTeamActivitySession(
        sessionData,
        user.uid,
        user.churchId
      )
      await get().fetchTeamActivitySession(sessionData.date, sessionData.program)
      set({ isLoading: false })
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : '팀 활동 점수 등록에 실패했습니다.',
        isLoading: false,
      })
      throw error
    }
  },

  updateTeamActivitySession: async (
    sessionId: string,
    sessionData: Partial<TeamActivitySessionFormData>
  ) => {
    set({ isLoading: true, error: null })
    try {
      await teamActivityScoreService.updateTeamActivitySession(sessionId, sessionData)
      const date = sessionData.date || get().currentSession?.date || new Date()
      const program = sessionData.program || get().currentSession?.program || 'Sparks'
      await get().fetchTeamActivitySession(date, program as TeamActivityProgram)
      set({ isLoading: false })
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : '팀 활동 점수 수정에 실패했습니다.',
        isLoading: false,
      })
      throw error
    }
  },

  deleteTeamActivitySession: async (sessionId: string) => {
    set({ isLoading: true, error: null })
    try {
      await teamActivityScoreService.deleteTeamActivitySession(sessionId)
      set({ currentSession: null, isLoading: false })
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : '팀 활동 점수 삭제에 실패했습니다.',
        isLoading: false,
      })
      throw error
    }
  },

  clearError: () => set({ error: null }),
}))
