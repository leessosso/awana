import { TeacherPosition } from '../models/User';

export interface PositionInfo {
  value: TeacherPosition;
  label: string;
  description: string;
  permissions: string[];
}

export const TEACHER_POSITIONS: PositionInfo[] = [
  {
    value: TeacherPosition.HEAD_TEACHER,
    label: '담임 선생님',
    description: '클럽 전체를 관리하고 모든 학생과 선생님들을 감독합니다.',
    permissions: [
      '학생 등록/수정/삭제',
      '출결 관리',
      '핸드북 진도 관리',
      '성경 암송 관리',
      '리포트 조회',
      '담당 선생님 지정',
      '클럽 리더 감독'
    ]
  },
  {
    value: TeacherPosition.CLUB_LEADER,
    label: '클럽 리더',
    description: '특정 클럽의 학생들을 담당하며 교육을 진행합니다.',
    permissions: [
      '담당 학생 등록/수정',
      '출결 관리',
      '핸드북 진도 관리',
      '성경 암송 관리',
      '리포트 조회'
    ]
  },
  {
    value: TeacherPosition.ASSISTANT,
    label: '보조 선생님',
    description: '선생님을 도와 기본적인 학생 관리를 지원합니다.',
    permissions: [
      '담당 학생 정보 조회',
      '성경 암송 관리',
      '기본 리포트 조회'
    ]
  }
];

export const getPositionInfo = (position: TeacherPosition): PositionInfo | undefined => {
  return TEACHER_POSITIONS.find(p => p.value === position);
};

export const getPositionLabel = (position: TeacherPosition): string => {
  return getPositionInfo(position)?.label || '알 수 없음';
};
