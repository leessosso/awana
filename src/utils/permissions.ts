import type { User } from '../models/User';
import { UserRole, TeacherPosition } from '../models/User';

/**
 * 권한 레벨 정의 (높을수록 더 많은 권한)
 */
export enum PermissionLevel {
  NONE = 0,
  ASSISTANT = 1,    // 보조 선생님
  CLUB_LEADER = 2,  // 클럽 리더
  HEAD_TEACHER = 3, // 담임 선생님
  LEADER = 4,       // 교회 리더
  ADMIN = 5,        // 사이트 관리자
}

/**
 * 사용자의 권한 레벨을 반환
 */
export function getPermissionLevel(user: User | null): PermissionLevel {
  if (!user) return PermissionLevel.NONE;

  switch (user.role) {
    case UserRole.ADMIN:
      return PermissionLevel.ADMIN;

    case UserRole.LEADER:
      return PermissionLevel.LEADER;

    case UserRole.TEACHER:
      switch (user.position) {
        case TeacherPosition.HEAD_TEACHER:
          return PermissionLevel.HEAD_TEACHER;
        case TeacherPosition.CLUB_LEADER:
          return PermissionLevel.CLUB_LEADER;
        case TeacherPosition.ASSISTANT:
        default:
          return PermissionLevel.ASSISTANT;
      }

    default:
      return PermissionLevel.NONE;
  }
}

/**
 * 특정 권한 레벨 이상인지 확인
 */
export function hasPermission(user: User | null, requiredLevel: PermissionLevel): boolean {
  return getPermissionLevel(user) >= requiredLevel;
}

/**
 * 관리자 권한 확인
 */
export function isAdmin(user: User | null): boolean {
  return user?.role === UserRole.ADMIN;
}

/**
 * 교회 리더 권한 확인
 */
export function isLeader(user: User | null): boolean {
  return user?.role === UserRole.LEADER;
}

/**
 * 선생님 권한 확인 (모든 선생님 직책 포함)
 */
export function isTeacher(user: User | null): boolean {
  return user?.role === UserRole.TEACHER;
}

/**
 * 담임 선생님 권한 확인
 */
export function isHeadTeacher(user: User | null): boolean {
  return user?.role === UserRole.TEACHER && user?.position === TeacherPosition.HEAD_TEACHER;
}

/**
 * 클럽 리더 권한 확인
 */
export function isClubLeader(user: User | null): boolean {
  return user?.role === UserRole.TEACHER && user?.position === TeacherPosition.CLUB_LEADER;
}

/**
 * 보조 선생님 권한 확인
 */
export function isAssistantTeacher(user: User | null): boolean {
  return user?.role === UserRole.TEACHER && user?.position === TeacherPosition.ASSISTANT;
}

/**
 * 학생 관리 권한 확인 (선생님 이상)
 */
export function canManageStudents(user: User | null): boolean {
  return hasPermission(user, PermissionLevel.ASSISTANT);
}

/**
 * 출결 관리 권한 확인 (클럽 리더 이상)
 */
export function canManageAttendance(user: User | null): boolean {
  return hasPermission(user, PermissionLevel.CLUB_LEADER);
}

/**
 * 핸드북 진도 관리 권한 확인 (클럽 리더 이상)
 */
export function canManageHandbook(user: User | null): boolean {
  return hasPermission(user, PermissionLevel.CLUB_LEADER);
}


/**
 * 교회 전체 데이터 관리 권한 확인 (교회 리더 이상)
 */
export function canManageChurchData(user: User | null): boolean {
  return hasPermission(user, PermissionLevel.LEADER);
}

/**
 * 사용자 관리 권한 확인 (관리자만)
 */
export function canManageUsers(user: User | null): boolean {
  return isAdmin(user);
}

/**
 * 리포트 조회 권한 확인 (클럽 리더 이상)
 */
export function canViewReports(user: User | null): boolean {
  return hasPermission(user, PermissionLevel.LEADER);
}
