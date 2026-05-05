// SPARKS 핸드북 진도 모델

export enum SparksHandbook {
  HANG_GLIDER = 'hang_glider',
  WING_RUNNER = 'wing_runner',
  SKY_STORMER = 'sky_stormer',
}

export enum JewelType {
  RED = 'red', // 빨강보석
  GREEN = 'green', // 초록보석
}

export enum ReviewType {
  REVIEW = 'review', // 복습과정 (추후 확장)
}

// 보석 섹션 번호 (예: 1:1, 1:2, 1:3, 1:4, 2:1, ... 4:4)
export interface JewelSection {
  major: number // 1-4
  minor: number // 1-4
}

// 보석 섹션 통과 기록
export interface JewelSectionProgress {
  id: string
  studentId: string
  handbook: SparksHandbook
  jewelType: JewelType
  section: JewelSection // {major: 1, minor: 1}
  completedDate: Date
  completedBy: string
  churchId: string
}

// 학생의 핸드북 진도 요약 (화면 표시용)
export interface StudentHandbookSummary {
  studentId: string
  currentHandbook: SparksHandbook | null // 현재 진행 중인 핸드북
  currentPhase: 'jewel' | 'review' | null // 현재 진행 중인 단계 (보석/복습)
  currentJewelType: JewelType | null // 현재 진행 중인 보석 타입
  lastCompletedSection: JewelSection | null // 마지막 완료한 섹션
  lastCompletedDate: Date | null // 마지막 완료 날짜
  hangGliderProgress: {
    redCompleted: number // 완료한 빨강보석 섹션 수 (최대 16)
    greenCompleted: number // 완료한 초록보석 섹션 수 (최대 16)
  }
  wingRunnerProgress: {
    redCompleted: number
    greenCompleted: number
  }
  skyStormerProgress: {
    redCompleted: number
    greenCompleted: number
  }
}

// 보석 섹션 통과 기록 생성/수정용 데이터
export interface JewelSectionProgressFormData {
  studentId: string
  handbook: SparksHandbook
  jewelType: JewelType
  section: JewelSection
  completedDate: Date
}
