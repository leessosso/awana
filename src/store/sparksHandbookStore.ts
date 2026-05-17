import { create } from 'zustand'
import type {
  JewelSectionProgress,
  JewelSectionProgressFormData,
  StudentHandbookSummary,
} from '../models/SparksHandbookProgress'
import * as sparksHandbookService from '../services/sparksHandbookService'
import { useAuthStore } from './authStore'

interface SparksHandbookState {
  // 학생별 진도 요약 목록
  studentSummaries: Map<string, StudentHandbookSummary>
  // 학생별 상세 진도 목록
  studentProgresses: Map<string, JewelSectionProgress[]>
  isLoading: boolean
  error: string | null

  // 학생 진도 요약 조회
  fetchStudentSummary: (studentId: string, churchId: string) => Promise<void>
  // 모든 학생 진도 요약 조회
  fetchAllStudentSummaries: (churchId: string) => Promise<void>
  // 학생 상세 진도 조회
  fetchStudentProgress: (studentId: string, churchId: string) => Promise<void>
  // 보석 섹션 통과 기록 생성
  createJewelSectionProgress: (
    progressData: JewelSectionProgressFormData,
  ) => Promise<void>
  // 보석 섹션 통과 기록 업데이트
  updateJewelSectionProgress: () => Promise<void>
  // 보석 섹션 통과 기록 삭제
  deleteJewelSectionProgress: (progressId: string) => Promise<void>
  // 다음 완료할 섹션 조회
  getNextSectionToComplete: (
    studentId: string,
    churchId: string,
  ) => Promise<{
    handbook: string
    jewelType: string
    section: { major: number; minor: number }
  } | null>
  clearError: () => void
}

export const useSparksHandbookStore = create<SparksHandbookState>(
  (set, get) => ({
    studentSummaries: new Map(),
    studentProgresses: new Map(),
    isLoading: false,
    error: null,

    fetchStudentSummary: async (studentId: string, churchId: string) => {
      set({ isLoading: true, error: null })
      try {
        const summary = await sparksHandbookService.getStudentHandbookSummary(
          studentId,
          churchId,
        )
        const summaries = new Map(get().studentSummaries)
        summaries.set(studentId, summary)
        set({ studentSummaries: summaries, isLoading: false })
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : '학생 진도 요약을 불러오는데 실패했습니다.',
          isLoading: false,
        })
      }
    },

    fetchStudentProgress: async (studentId: string, churchId: string) => {
      set({ isLoading: true, error: null })
      try {
        const progresses = await sparksHandbookService.getStudentProgress(
          studentId,
          churchId,
        )
        const studentProgresses = new Map(get().studentProgresses)
        studentProgresses.set(studentId, progresses)
        set({ studentProgresses, isLoading: false })
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : '학생 상세 진도를 불러오는데 실패했습니다.',
          isLoading: false,
        })
      }
    },

    fetchAllStudentSummaries: async (churchId: string) => {
      set({ isLoading: true, error: null })
      try {
        // SPARKS 학생들의 진도 요약을 모두 조회
        const summaries =
          await sparksHandbookService.getAllStudentSummaries(churchId)
        const summariesMap = new Map<string, StudentHandbookSummary>()
        summaries.forEach((summary) => {
          summariesMap.set(summary.studentId, summary)
        })
        set({ studentSummaries: summariesMap, isLoading: false })
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : '모든 학생 진도 요약을 불러오는데 실패했습니다.',
          isLoading: false,
        })
      }
    },

    createJewelSectionProgress: async (
      progressData: JewelSectionProgressFormData,
    ) => {
      const { user } = useAuthStore.getState()
      if (!user?.uid || !user?.churchId) {
        throw new Error('인증 정보가 없습니다.')
      }

      set({ isLoading: true, error: null })
      try {
        await sparksHandbookService.createJewelSectionProgress(
          progressData,
          user.uid,
          user.churchId,
        )
        // 진도 요약 새로고침
        await get().fetchStudentSummary(progressData.studentId, user.churchId)
        await get().fetchStudentProgress(progressData.studentId, user.churchId)
        set({ isLoading: false })
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : '보석 섹션 진도를 등록하는데 실패했습니다.',
          isLoading: false,
        })
        throw error
      }
    },

    updateJewelSectionProgress: async () => {
      // 현재 구현에서는 사용하지 않음
      set({ isLoading: false })
    },

    deleteJewelSectionProgress: async (progressId: string) => {
      set({ isLoading: true, error: null })
      try {
        await sparksHandbookService.deleteJewelSectionProgress(progressId)
        // 모든 학생의 진도 새로고침 (어떤 학생의 진도인지 모르므로)
        // 실제 구현에서는 특정 학생의 진도만 새로고침하는 것이 좋음
        set({ isLoading: false })
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : '보석 섹션 진도 삭제에 실패했습니다.',
          isLoading: false,
        })
        throw error
      }
    },

    getNextSectionToComplete: async (studentId: string, churchId: string) => {
      set({ isLoading: true, error: null })
      try {
        const nextSection =
          await sparksHandbookService.getNextSectionToComplete(
            studentId,
            churchId,
          )
        set({ isLoading: false })
        return nextSection
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : '다음 섹션 조회에 실패했습니다.',
          isLoading: false,
        })
        throw error
      }
    },

    clearError: () => set({ error: null }),
  }),
)
