import { Club } from '../constants/clubs'

export type TeamKey = 'red' | 'yellow' | 'blue' | 'green'

export type TeamActivityProgram = Club.SPARKS | Club.TNT

export interface TeamActivityCounts {
  attendance: number
  handbook: number
  uniform: number
  evangelism: number
  sectionPasses: number
}

export type TeamActivityCountsByTeam = Record<TeamKey, TeamActivityCounts>

export interface TeamActivitySession {
  id: string
  date: Date
  program: TeamActivityProgram
  countsByTeam: TeamActivityCountsByTeam
  totalScores: Record<TeamKey, number>
  churchId: string
  createdBy: string
  createdAt: Date
}

export interface TeamActivitySessionFormData {
  date: Date
  program: TeamActivityProgram
  countsByTeam: TeamActivityCountsByTeam
}

export const teamActivityScoreRules = {
  attendance: 50,
  handbook: 20,
  uniform: 20,
  evangelism: 200,
  sectionPasses: 100,
} as const

export function createEmptyTeamActivityCounts (): TeamActivityCounts {
  return {
    attendance: 0,
    handbook: 0,
    uniform: 0,
    evangelism: 0,
    sectionPasses: 0,
  }
}

export function createEmptyCountsByTeam (): TeamActivityCountsByTeam {
  return {
    red: createEmptyTeamActivityCounts(),
    yellow: createEmptyTeamActivityCounts(),
    blue: createEmptyTeamActivityCounts(),
    green: createEmptyTeamActivityCounts(),
  }
}

export function calculateTeamActivityScore (counts: TeamActivityCounts): number {
  return (
    counts.attendance * teamActivityScoreRules.attendance +
    counts.handbook * teamActivityScoreRules.handbook +
    counts.uniform * teamActivityScoreRules.uniform +
    counts.evangelism * teamActivityScoreRules.evangelism +
    counts.sectionPasses * teamActivityScoreRules.sectionPasses
  )
}

export function calculateTeamActivityTotalScores (
  countsByTeam: TeamActivityCountsByTeam
): Record<TeamKey, number> {
  return {
    red: calculateTeamActivityScore(countsByTeam.red),
    yellow: calculateTeamActivityScore(countsByTeam.yellow),
    blue: calculateTeamActivityScore(countsByTeam.blue),
    green: calculateTeamActivityScore(countsByTeam.green),
  }
}
