// SPARKS 핸드북 상수 정의

import { SparksHandbook, JewelType } from '../models/SparksHandbookProgress'
import type { JewelSection } from '../models/SparksHandbookProgress'

// SPARKS 핸드북 3종
export const SPARKS_HANDBOOKS = [
  { id: SparksHandbook.HANG_GLIDER, name: 'HangGlider', label: '행글라이더' },
  { id: SparksHandbook.WING_RUNNER, name: 'WingRunner', label: '윙러너' },
  { id: SparksHandbook.SKY_STORMER, name: 'SkyStormer', label: '스카이스토머' },
]

// 보석 타입 레이블
export const JEWEL_TYPE_LABELS: Record<JewelType, string> = {
  [JewelType.RED]: '빨강보석',
  [JewelType.GREEN]: '초록보석',
}

// 보석 섹션 생성 헬퍼 (1:1 ~ 4:4)
export const generateJewelSections = (): JewelSection[] => {
  const sections: JewelSection[] = []
  for (let major = 1; major <= 4; major++) {
    for (let minor = 1; minor <= 4; minor++) {
      sections.push({ major, minor })
    }
  }
  return sections
}

// 섹션 번호를 문자열로 변환 (예: "1:1", "4:4")
export const sectionToString = (section: JewelSection): string => {
  return `${section.major}:${section.minor}`
}

// 문자열을 섹션 번호로 변환
export const stringToSection = (str: string): JewelSection | null => {
  const parts = str.split(':')
  if (parts.length !== 2) return null
  const major = parseInt(parts[0], 10)
  const minor = parseInt(parts[1], 10)
  if (
    isNaN(major) ||
    isNaN(minor) ||
    major < 1 ||
    major > 4 ||
    minor < 1 ||
    minor > 4
  ) {
    return null
  }
  return { major, minor }
}

// 섹션 비교 (정렬용)
export const compareSections = (a: JewelSection, b: JewelSection): number => {
  if (a.major !== b.major) return a.major - b.major
  return a.minor - b.minor
}
