import { create } from 'zustand'
import type { Student, StudentFormData } from '../models/Student'
import * as studentService from '../services/studentService'
import { useAuthStore } from './authStore'
import { canManageChurchData, getScopedTeacherId } from '../utils/permissions'

interface StudentState {
  students: Student[]
  isLoading: boolean
  error: string | null
  fetchStudents: () => Promise<void>
  createStudent: (studentData: StudentFormData) => Promise<void>
  updateStudent: (
    studentId: string,
    studentData: Partial<StudentFormData>,
  ) => Promise<void>
  deleteStudent: (studentId: string) => Promise<void>
  getStudent: (studentId: string) => Promise<Student | null>
  clearError: () => void
}

export const useStudentStore = create<StudentState>((set, get) => ({
  students: [],
  isLoading: false,
  error: null,

  fetchStudents: async () => {
    const { user } = useAuthStore.getState()
    if (!user?.churchId) {
      set({ error: '교회 정보가 없습니다.' })
      return
    }

    set({ isLoading: true, error: null })
    try {
      // 교회 전체 관리 권한이 있는 경우 모든 학생 조회, 그렇지 않으면 자신이 담당하는 학생만 조회
      const teacherId = canManageChurchData(user)
        ? undefined
        : getScopedTeacherId(user)
      const students = await studentService.getStudentsByChurch(
        user.churchId,
        teacherId,
      )
      set({ students, isLoading: false })
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : '학생 목록을 불러오는데 실패했습니다.',
        isLoading: false,
      })
    }
  },

  createStudent: async (studentData: StudentFormData) => {
    const { user } = useAuthStore.getState()
    if (!user?.uid || !user?.churchId) {
      throw new Error('인증 정보가 없습니다.')
    }

    set({ isLoading: true, error: null })
    try {
      // 담당 선생님이 지정되지 않았고, 교회 전체 관리 권한이 없으면 현재 사용자를 담당 선생님으로 설정
      const finalData = {
        ...studentData,
        assignedTeacherId:
          studentData.assignedTeacherId ||
          (canManageChurchData(user) ? undefined : getScopedTeacherId(user)),
      }
      await studentService.createStudent(finalData, user.uid, user.churchId)
      await get().fetchStudents()
      set({ isLoading: false })
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : '학생 등록에 실패했습니다.',
        isLoading: false,
      })
      throw error
    }
  },

  updateStudent: async (
    studentId: string,
    studentData: Partial<StudentFormData>,
  ) => {
    set({ isLoading: true, error: null })
    try {
      await studentService.updateStudent(studentId, studentData)
      await get().fetchStudents()
      set({ isLoading: false })
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : '학생 정보 수정에 실패했습니다.',
        isLoading: false,
      })
      throw error
    }
  },

  deleteStudent: async (studentId: string) => {
    set({ isLoading: true, error: null })
    try {
      await studentService.deleteStudent(studentId)
      await get().fetchStudents()
      set({ isLoading: false })
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : '학생 삭제에 실패했습니다.',
        isLoading: false,
      })
      throw error
    }
  },

  getStudent: async (studentId: string) => {
    set({ isLoading: true, error: null })
    try {
      const student = await studentService.getStudent(studentId)
      set({ isLoading: false })
      return student
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : '학생 정보를 불러오는데 실패했습니다.',
        isLoading: false,
      })
      return null
    }
  },

  clearError: () => set({ error: null }),
}))
