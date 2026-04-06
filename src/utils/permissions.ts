import type { User } from '../models/User';
import { UserRole, TeacherPosition } from '../models/User';

/**
 * 권한 레벨 정의 (높을수록 더 많은 권한)
 */
export enum PermissionLevel {
  NONE = 0,
  ASSISTANT = 1,    // 보조 선생님
  HEAD_TEACHER = 2, // 담임 선생님
  OPERATIONS_TEACHER = 3, // 운영 선생님
  LEADER = 4,       // 교회 리더
  ADMIN = 5,        // 사이트 관리자
}

/**
 * 사용자의 권한 레벨을 반환
 */
export function getPermissionLevel(user: User | null): PermissionLevel {
  if (!user) return PermissionLevel.NONE;
  const rawPosition = user.position as string | undefined;

  switch (user.role) {
    case UserRole.ADMIN:
      return PermissionLevel.ADMIN;

    case UserRole.LEADER:
      return PermissionLevel.LEADER;

    case UserRole.TEACHER:
      if (rawPosition === 'admin_teacher') {
        return PermissionLevel.OPERATIONS_TEACHER;
      }
      switch (user.position) {
        case TeacherPosition.OPERATIONS_TEACHER:
          return PermissionLevel.OPERATIONS_TEACHER;
        case TeacherPosition.HEAD_TEACHER:
          return PermissionLevel.HEAD_TEACHER;
        case TeacherPosition.CLUB_LEADER:
          return PermissionLevel.HEAD_TEACHER;
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
 * 운영 선생님 권한 확인
 */
export function isOperationsTeacher(user: User | null): boolean {
  return user?.role === UserRole.TEACHER && (
    user?.position === TeacherPosition.OPERATIONS_TEACHER ||
    (user?.position as string | undefined) === 'admin_teacher'
  );
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
 * 출결 관리 권한 확인 (담임 선생님 이상)
 */
export function canManageAttendance(user: User | null): boolean {
  return hasPermission(user, PermissionLevel.HEAD_TEACHER);
}

/**
 * 핸드북 진도 관리 권한 확인 (담임 선생님 이상)
 */
export function canManageHandbook(user: User | null): boolean {
  return hasPermission(user, PermissionLevel.HEAD_TEACHER);
}


/**
 * 교회 전체 데이터 관리 권한 확인 (운영 선생님 이상)
 */
export function canManageChurchData(user: User | null): boolean {
  return hasPermission(user, PermissionLevel.OPERATIONS_TEACHER);
}

/**
 * 사용자 관리 권한 확인 (사이트 관리자 또는 운영 선생님)
 */
export function canManageUsers(user: User | null): boolean {
  return isAdmin(user) || isOperationsTeacher(user);
}

/**
 * 리포트 조회 권한 확인 (운영 선생님 이상)
 */
export function canViewReports(user: User | null): boolean {
  return hasPermission(user, PermissionLevel.OPERATIONS_TEACHER);
}

/**
 * 학생 조회 기준 선생님 ID 반환
 * - 보조 선생님: 소속 담임 학생을 함께 조회
 * - 담임/운영 선생님: 본인 ID 기준
 */
export function getScopedTeacherId(user: User | null): string | undefined {
  if (!user || !user.uid) return undefined;
  if (user.role !== UserRole.TEACHER) return user.uid;
  if (user.position === TeacherPosition.ASSISTANT && user.headTeacherId) {
    return user.headTeacherId;
  }
  return user.uid;
}
