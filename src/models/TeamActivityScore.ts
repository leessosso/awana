import { Club } from '../constants/clubs'

export type TeamKey = 'green' | 'yellow' | 'blue' | 'red'

export type TeamActivityProgram = Club.SPARKS | Club.TNT

export interface TeamActivityCounts {
  attendance: number
  handbook: number
  uniform: number
  evangelism: number
  sectionPasses: number
}

export type TeamActivityCountsByTeam = Record<TeamKey, TeamActivityCounts>
export type TeamActivityTeacherEntries = Record<string, TeamActivityCounts>
export type TeamActivityTeacherEntriesByTeam = Record<TeamKey, TeamActivityTeacherEntries>

export interface TeamActivitySession {
  id: string
  date: Date
  program: TeamActivityProgram
  countsByTeam: TeamActivityCountsByTeam
  teacherEntriesByTeam: TeamActivityTeacherEntriesByTeam
  totalScores: Record<TeamKey, number>
  churchId: string
  createdBy: string
  createdAt: Date
}

export interface TeamActivitySessionFormData {
  date: Date
  program: TeamActivityProgram
  countsByTeam?: TeamActivityCountsByTeam
  teacherEntriesByTeam?: TeamActivityTeacherEntriesByTeam
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

export function createEmptyTeacherEntriesByTeam (): TeamActivityTeacherEntriesByTeam {
  return {
    red: {},
    yellow: {},
    blue: {},
    green: {},
  }
}

export function sumTeamActivityCounts (
  ...countsList: TeamActivityCounts[]
): TeamActivityCounts {
  return countsList.reduce(
    (sum, counts) => ({
      attendance: sum.attendance + counts.attendance,
      handbook: sum.handbook + counts.handbook,
      uniform: sum.uniform + counts.uniform,
      evangelism: sum.evangelism + counts.evangelism,
      sectionPasses: sum.sectionPasses + counts.sectionPasses,
    }),
    createEmptyTeamActivityCounts()
  )
}

export function calculateCountsByTeamFromTeacherEntries (
  teacherEntriesByTeam: TeamActivityTeacherEntriesByTeam
): TeamActivityCountsByTeam {
  return {
    red: sumTeamActivityCounts(...Object.values(teacherEntriesByTeam.red)),
    yellow: sumTeamActivityCounts(...Object.values(teacherEntriesByTeam.yellow)),
    blue: sumTeamActivityCounts(...Object.values(teacherEntriesByTeam.blue)),
    green: sumTeamActivityCounts(...Object.values(teacherEntriesByTeam.green)),
  }
}

export function createTeacherEntriesByTeamFromCounts (
  countsByTeam: TeamActivityCountsByTeam,
  defaultTeacherId = '__legacy__'
): TeamActivityTeacherEntriesByTeam {
  return {
    red: { [defaultTeacherId]: { ...countsByTeam.red } },
    yellow: { [defaultTeacherId]: { ...countsByTeam.yellow } },
    blue: { [defaultTeacherId]: { ...countsByTeam.blue } },
    green: { [defaultTeacherId]: { ...countsByTeam.green } },
  }
}

export function normalizeTeamActivitySessionData (data: {
  countsByTeam?: TeamActivityCountsByTeam
  teacherEntriesByTeam?: TeamActivityTeacherEntriesByTeam
}): {
  countsByTeam: TeamActivityCountsByTeam
  teacherEntriesByTeam: TeamActivityTeacherEntriesByTeam
} {
  if (data.teacherEntriesByTeam) {
    return {
      teacherEntriesByTeam: data.teacherEntriesByTeam,
      countsByTeam: calculateCountsByTeamFromTeacherEntries(data.teacherEntriesByTeam),
    }
  }

  const countsByTeam = data.countsByTeam || createEmptyCountsByTeam()
  return {
    countsByTeam,
    teacherEntriesByTeam: createTeacherEntriesByTeamFromCounts(countsByTeam),
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
