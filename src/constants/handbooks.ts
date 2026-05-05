import { Club } from './clubs'

export interface Handbook {
  id: string
  name: string
  club: Club
  totalUnits: number
  units: { number: number; title: string }[]
}

// 핸드북 생성 헬퍼 함수
const createHandbook = (
  id: string,
  name: string,
  club: Club,
  totalUnits: number,
): Handbook => ({
  id,
  name,
  club,
  totalUnits,
  units: Array.from({ length: totalUnits }, (_, i) => ({
    number: i + 1,
    title: `단원 ${i + 1}`,
  })),
})

// 클럽별 핸드북 설정
const HANDBOOK_CONFIGS: Record<
  Club,
  { id: string; name: string; totalUnits: number }
> = {
  [Club.SPARKS]: { id: 'sparks-1', name: 'Sparks 핸드북 1', totalUnits: 12 },
  [Club.TNT]: { id: 'tnt-1', name: 'T&T 핸드북 1', totalUnits: 15 },
  [Club.TREK]: { id: 'trek-1', name: 'Trek 핸드북 1', totalUnits: 20 },
}

// 예시 핸드북 데이터 (실제로는 Firebase나 설정 파일에서 관리할 수 있음)
export const HANDBOOKS: Record<string, Handbook[]> = Object.fromEntries(
  Object.entries(HANDBOOK_CONFIGS).map(([club, config]) => [
    club,
    [createHandbook(config.id, config.name, club as Club, config.totalUnits)],
  ]),
)

export const getHandbooksByClub = (club: Club): Handbook[] => {
  return HANDBOOKS[club] || []
}
