import type { Theme, ThemeColor } from '../contexts/ThemeContext'

// Re-export theme types for use in other modules
export type { Theme, ThemeColor }

export enum UserRole {
  ADMIN = 'admin', // 사이트 전체 관리자
  LEADER = 'leader', // 교회 리더 (교회 전체 관리)
  TEACHER = 'teacher', // 선생님 (학생 관리 담당)
}

export enum TeacherPosition {
  HEAD_TEACHER = 'head_teacher', // 담임 선생님
  ASSISTANT = 'assistant', // 보조 선생님
  OPERATIONS_TEACHER = 'operations_teacher', // 운영 선생님
  CLUB_LEADER = 'club_leader', // 레거시 값 (호환성 유지)
}

export type TeacherProgram = 'Sparks' | 'T&T'
export type TeacherTeam = 'green' | 'yellow' | 'blue' | 'red'

export interface User {
  uid: string
  email: string
  loginId?: string
  displayName: string
  role: UserRole
  position?: TeacherPosition // 선생님일 경우 직책 (선택적)
  headTeacherId?: string // 보조 선생님의 소속 담임 ID
  program?: TeacherProgram // 선생님 소속 클럽
  team?: TeacherTeam // 선생님 소속 팀
  churchName: string
  churchId?: string
  createdAt: Date

  // 테마 설정
  theme?: Theme // 라이트/다크 모드 설정
  themeColor?: ThemeColor // 테마 색상 설정

  // 개인정보 (선택적)
  phoneNumber?: string // 전화번호
  address?: string // 집주소
  dateOfBirth?: string // 생년월일 (YYYY-MM-DD)
  emergencyContact?: string // 비상연락처
  emergencyPhone?: string // 비상연락처 전화번호
}

export interface UserProfile extends User {
  photoURL?: string
}
