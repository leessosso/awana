import { Club } from '../constants'

export interface Student {
  id: string
  name: string
  photoURL?: string
  club: Club
  grade: number // 1-4 (학년)
  gender: 'male' | 'female'
  birthDate?: Date
  createdAt: Date
  createdBy: string
  churchId: string
  isActive?: boolean // 활동 여부 (기본값: true)
  assignedTeacherId?: string // 담당 선생님 ID (원래 담당)
  tempAssignedTeacherId?: string // 임시 담당 선생님 ID
  tempAssignedUntil?: Date // 임시 담당 종료일

  // 추가 정보
  parentName?: string // 학부모 이름
  parentPhone?: string // 학부모 연락처
  address?: string // 주소
}

export interface StudentFormData {
  name: string
  photoURL?: string
  club: Club
  grade: number
  gender: 'male' | 'female'
  birthDate?: Date
  assignedTeacherId?: string
  tempAssignedTeacherId?: string
  tempAssignedUntil?: Date

  // 추가 정보
  parentName?: string
  parentPhone?: string
  address?: string
}
