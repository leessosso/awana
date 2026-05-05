import { create } from 'zustand'
import type { Attendance, AttendanceFormData } from '../models/Attendance'
import * as attendanceService from '../services/attendanceService'
import { useAuthStore } from './authStore'

interface AttendanceState {
  attendances: Attendance[]
  attendanceRecords: Attendance[]
  isLoading: boolean
  error: string | null
  fetchAttendances: (churchId: string, date: string) => Promise<void>
  fetchAttendanceRecords: () => Promise<void>
  fetchAttendanceByStudent: (
    studentId: string,
    churchId: string,
  ) => Promise<void>
  createAttendance: (attendanceData: AttendanceFormData) => Promise<void>
  updateAttendance: (
    attendanceId: string,
    attendanceData: Partial<AttendanceFormData>,
  ) => Promise<void>
  clearError: () => void
}

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  attendances: [],
  attendanceRecords: [],
  isLoading: false,
  error: null,

  fetchAttendances: async (churchId: string, date: string) => {
    set({ isLoading: true, error: null })
    try {
      const dateObj = new Date(date)
      const attendances = await attendanceService.getAttendanceByDate(
        dateObj,
        churchId,
      )
      set({ attendances, isLoading: false })
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : '출결 정보를 불러오는데 실패했습니다.',
        isLoading: false,
      })
    }
  },

  createAttendance: async (attendanceData: AttendanceFormData) => {
    const { user } = useAuthStore.getState()
    if (!user?.uid || !user?.churchId) {
      throw new Error('인증 정보가 없습니다.')
    }

    set({ isLoading: true, error: null })
    try {
      await attendanceService.createAttendance(
        attendanceData,
        user.uid,
        user.churchId,
      )
      // 새로고침을 위해 현재 날짜의 출결 정보를 다시 불러옴
      const dateStr = attendanceData.date.toISOString().split('T')[0]
      await get().fetchAttendances(user.churchId, dateStr)
      set({ isLoading: false })
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : '출결 등록에 실패했습니다.',
        isLoading: false,
      })
      throw error
    }
  },

  updateAttendance: async (
    attendanceId: string,
    attendanceData: Partial<AttendanceFormData>,
  ) => {
    set({ isLoading: true, error: null })
    try {
      await attendanceService.updateAttendance(attendanceId, attendanceData)
      set({ isLoading: false })
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : '출결 정보 수정에 실패했습니다.',
        isLoading: false,
      })
      throw error
    }
  },

  fetchAttendanceRecords: async () => {
    const { user } = useAuthStore.getState()
    if (!user?.churchId) {
      throw new Error('교회 정보가 없습니다.')
    }

    set({ isLoading: true, error: null })
    try {
      const records = await attendanceService.getAllAttendance(user.churchId)
      set({ attendanceRecords: records, isLoading: false })
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : '출결 기록을 불러오는데 실패했습니다.',
        isLoading: false,
      })
    }
  },

  fetchAttendanceByStudent: async (studentId: string, churchId: string) => {
    set({ isLoading: true, error: null })
    try {
      const records = await attendanceService.getAttendanceByStudent(
        studentId,
        churchId,
      )
      set({ attendanceRecords: records, isLoading: false })
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : '학생 출결 기록을 불러오는데 실패했습니다.',
        isLoading: false,
      })
    }
  },

  clearError: () => set({ error: null }),
}))
