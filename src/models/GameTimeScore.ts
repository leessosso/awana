import { Club } from '../constants/clubs'

export enum GameTimeTeam {
  GREEN = 'green',
  YELLOW = 'yellow',
  BLUE = 'blue',
  RED = 'red',
}

export type GameTimeProgram = Club.SPARKS | Club.TNT

export type GameScore = 400 | 300 | 200 | 100 | 0

export interface ScoreEvent {
  id: string
  team: 'green' | 'yellow' | 'blue' | 'red'
  score: number
  note?: string
}

export interface GameTimeSession {
  id: string
  date: Date
  program: GameTimeProgram
  gameScores: ScoreEvent[]
  cheerScores: ScoreEvent[]
  totalScores: {
    red: number
    yellow: number
    blue: number
    green: number
  }
  churchId: string
  createdBy: string
  createdAt: Date
}

export interface GameTimeSessionFormData {
  date: Date
  program: GameTimeProgram
  gameScores: ScoreEvent[]
  cheerScores: ScoreEvent[]
}

// 점수 계산 헬퍼 함수
export function calculateTotalScores(
  gameScores: ScoreEvent[] = [],
  cheerScores: ScoreEvent[] = []
): {
  red: number
  yellow: number
  blue: number
  green: number
} {
  // 게임 점수 합산
  const gameTotals = gameScores.reduce(
    (totals, event) => ({
      ...totals,
      [event.team]: totals[event.team] + event.score,
    }),
    { red: 0, yellow: 0, blue: 0, green: 0 }
  )

  // 응원점수 합산
  const cheerTotals = cheerScores.reduce(
    (totals, cheer) => ({
      ...totals,
      [cheer.team]: totals[cheer.team] + cheer.score,
    }),
    { red: 0, yellow: 0, blue: 0, green: 0 }
  )

  // 최종 합계
  return {
    red: gameTotals.red + cheerTotals.red,
    yellow: gameTotals.yellow + cheerTotals.yellow,
    blue: gameTotals.blue + cheerTotals.blue,
    green: gameTotals.green + cheerTotals.green,
  }
}

// 팀 색상 정보
export const teamColors = {
  green: {
    name: '초록',
    bgColor: 'bg-green-500',
    textColor: 'text-green-500',
    borderColor: 'border-green-500',
  },
  yellow: {
    name: '노랑',
    bgColor: 'bg-yellow-500',
    textColor: 'text-yellow-500',
    borderColor: 'border-yellow-500',
  },
  blue: {
    name: '파랑',
    bgColor: 'bg-blue-500',
    textColor: 'text-blue-500',
    borderColor: 'border-blue-500',
  },
  red: {
    name: '빨강',
    bgColor: 'bg-red-500',
    textColor: 'text-red-500',
    borderColor: 'border-red-500',
  },
}

// 사용 가능한 점수 옵션
export const scoreOptions: GameScore[] = [400, 300, 200, 100, 0]

// 게임 점수 추가/차감 옵션
export const gameScoreOptions = [400, 300, 200, 100, 50]
