import type { TeacherProgram, TeacherTeam } from '../models/User'

export const TEACHER_PROGRAM_OPTIONS: Array<{ value: TeacherProgram, label: string }> = [
  { value: 'Sparks', label: 'SPARKS' },
  { value: 'T&T', label: 'T&T' },
]

export const TEACHER_TEAM_OPTIONS: Array<{ value: TeacherTeam, label: string }> = [
  { value: 'yellow', label: '노랑팀' },
  { value: 'green', label: '초록팀' },
  { value: 'blue', label: '파랑팀' },
  { value: 'red', label: '빨강팀' },
]

export function getTeacherTeamLabel (team?: TeacherTeam): string {
  if (!team) return '팀 미지정'
  return TEACHER_TEAM_OPTIONS.find((item) => item.value === team)?.label || '팀 미지정'
}

export function getTeacherProgramLabel (program?: TeacherProgram): string {
  if (!program) return '클럽 미지정'
  return TEACHER_PROGRAM_OPTIONS.find((item) => item.value === program)?.label || '클럽 미지정'
}
