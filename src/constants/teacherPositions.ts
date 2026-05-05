import { TeacherPosition } from '../models/User'

export interface PositionInfo {
  value: TeacherPosition
  label: string
  description: string
  permissions: string[]
}

export const TEACHER_POSITIONS: PositionInfo[] = [
  {
    value: TeacherPosition.HEAD_TEACHER,
    label: '담임 선생님',
    description: '담당 학생의 출결/핸드북을 관리하고 반 운영을 담당합니다.',
    permissions: [
      '담당 학생 조회',
      '출결 관리',
      '핸드북 진도 관리',
      '성경 암송 관리',
    ],
  },
  {
    value: TeacherPosition.ASSISTANT,
    label: '보조 선생님',
    description: '담임 선생님 반을 보조하며 동일 반 학생을 함께 돌봅니다.',
    permissions: ['담임 반 학생 조회', '성경 암송 관리'],
  },
  {
    value: TeacherPosition.OPERATIONS_TEACHER,
    label: '운영 선생님',
    description: '운영에 필요한 계정/반 편성/전체 학생 관리를 담당합니다.',
    permissions: [
      '교회 전체 학생 조회/관리',
      '선생님 계정 생성/수정',
      '권한/소속 관리',
      '리포트 조회',
      '출결 관리',
      '핸드북 진도 관리',
    ],
  },
]

export const getPositionInfo = (
  position: TeacherPosition,
): PositionInfo | undefined => {
  return TEACHER_POSITIONS.find((p) => p.value === position)
}

export const getPositionLabel = (position: TeacherPosition): string => {
  return getPositionInfo(position)?.label || '알 수 없음'
}
