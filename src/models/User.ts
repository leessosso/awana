import type { Theme, ThemeColor } from '../contexts/ThemeContext';

// Re-export theme types for use in other modules
export type { Theme, ThemeColor };

export enum UserRole {
  ADMIN = 'admin',      // 사이트 전체 관리자
  LEADER = 'leader',    // 교회 리더 (교회 전체 관리)
  TEACHER = 'teacher',  // 선생님 (학생 관리 담당)
}

export enum TeacherPosition {
  HEAD_TEACHER = 'head_teacher',    // 수석 선생님 (클럽 전체 관리)
  CLUB_LEADER = 'club_leader',      // 클럽 리더 (특정 클럽 관리)
  ASSISTANT = 'assistant',          // 보조 선생님 (제한적 권한)
}

export interface User {
  uid: string;
  email: string;
  loginId?: string;
  displayName: string;
  role: UserRole;
  position?: TeacherPosition;  // 선생님일 경우 직책 (선택적)
  churchName: string;
  churchId?: string;
  createdAt: Date;

  // 테마 설정
  theme?: Theme;               // 라이트/다크 모드 설정
  themeColor?: ThemeColor;     // 테마 색상 설정

  // 개인정보 (선택적)
  phoneNumber?: string;        // 전화번호
  address?: string;            // 집주소
  dateOfBirth?: string;        // 생년월일 (YYYY-MM-DD)
  emergencyContact?: string;   // 비상연락처
  emergencyPhone?: string;     // 비상연락처 전화번호
}

export interface UserProfile extends User {
  photoURL?: string;
}
