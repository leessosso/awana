import { getAuthUser } from './utils'
import { LoaderFunctionArgs } from 'react-router-dom'
import * as studentService from '../services/studentService'
import * as userService from '../services/userService'
import * as attendanceService from '../services/attendanceService'
import * as sparksHandbookService from '../services/sparksHandbookService'
import * as gameTimeService from '../services/gameTimeService'
import * as teamActivityScoreService from '../services/teamActivityScoreService'
import { canManageChurchData, getScopedTeacherId, canManageHandbook } from '../utils/permissions'
import { useStudentStore } from '../store/studentStore'
import { useAttendanceStore } from '../store/attendanceStore'
import { useSparksHandbookStore } from '../store/sparksHandbookStore'
import { useGameTimeStore } from '../store/gameTimeStore'
import { useTeamActivityScoreStore } from '../store/teamActivityScoreStore'
import { Club } from '../constants'

// Helper to get current Korean date string
const getKoreanDateString = () => {
  const now = new Date()
  const koreanTime = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return koreanTime.toISOString().split('T')[0]
}

export async function studentsLoader() {
  const user = await getAuthUser()
  if (!user?.churchId) return { students: [], teachers: [] }

  const teacherId = canManageChurchData(user) ? undefined : getScopedTeacherId(user)

  try {
    const [students, teachers] = await Promise.all([
      studentService.getStudentsByChurch(user.churchId, teacherId),
      userService.getTeachersByChurch(user.churchId)
    ])

    useStudentStore.setState({ students, isLoading: false, error: null })

    return { students, teachers }
  } catch (error) {
    console.error('studentsLoader 오류:', error)
    return { students: [], teachers: [] }
  }
}

export async function dashboardLoader() {
  const user = await getAuthUser()
  if (!user?.churchId) return { students: [], attendances: [], studentSummaries: [] }

  const today = getKoreanDateString()

  try {
    const [students, attendances, studentSummariesList] = await Promise.all([
      studentService.getStudentsByChurch(user.churchId),
      attendanceService.getAttendanceByDate(new Date(today), user.churchId),
      sparksHandbookService.getAllStudentSummaries(user.churchId)
    ])

    const summariesMap = new Map<string, (typeof studentSummariesList)[number]>()
    studentSummariesList.forEach((summary) => {
      summariesMap.set(summary.studentId, summary)
    })

    useStudentStore.setState({ students })
    useAttendanceStore.setState({ attendances })
    useSparksHandbookStore.setState({ studentSummaries: summariesMap })

    return { students, attendances, studentSummaries: studentSummariesList }
  } catch (error) {
    console.error('dashboardLoader 오류:', error)
    return { students: [], attendances: [], studentSummaries: [] }
  }
}

export async function attendanceLoader() {
  const user = await getAuthUser()
  if (!user?.churchId) return { students: [], teachers: [], attendances: [] }

  const teacherId = canManageChurchData(user) ? undefined : getScopedTeacherId(user)
  const today = getKoreanDateString()

  try {
    const [students, teachers, attendances] = await Promise.all([
      studentService.getStudentsByChurch(user.churchId, teacherId),
      userService.getTeachersByChurch(user.churchId),
      attendanceService.getAttendanceByDate(new Date(today), user.churchId)
    ])

    useStudentStore.setState({ students })
    useAttendanceStore.setState({ attendances })

    return { students, teachers, attendances }
  } catch (error) {
    console.error('attendanceLoader 오류:', error)
    return { students: [], teachers: [], attendances: [] }
  }
}

export async function gameTimeLoader({ request }: LoaderFunctionArgs) {
  const user = await getAuthUser()
  if (!user?.churchId) return { currentSession: null, teamActivitySession: null }

  const url = new URL(request.url)
  const today = getKoreanDateString()
  const dateStr = url.searchParams.get('date') || today
  const date = new Date(dateStr)
  const program = (url.searchParams.get('program') as Club) || Club.SPARKS

  try {
    const [currentSession, teamActivitySession] = await Promise.all([
      gameTimeService.getGameTimeSessionByDate(new Date(date), user.churchId, program as any),
      teamActivityScoreService.getTeamActivitySessionByDate(new Date(date), user.churchId, program as any)
    ])

    useGameTimeStore.setState({ currentSession })
    useTeamActivityScoreStore.setState({ currentSession: teamActivitySession })

    return { currentSession, teamActivitySession }
  } catch (error) {
    console.error('gameTimeLoader 오류:', error)
    return { currentSession: null, teamActivitySession: null }
  }
}

export async function teamActivityScoreLoader({ request }: LoaderFunctionArgs) {
  const user = await getAuthUser()
  if (!user?.churchId) return { currentSession: null }

  const url = new URL(request.url)
  const today = getKoreanDateString()
  const dateStr = url.searchParams.get('date') || today
  const date = new Date(dateStr)
  const program = (url.searchParams.get('program') as Club) || Club.SPARKS

  try {
    const currentSession = await teamActivityScoreService.getTeamActivitySessionByDate(new Date(date), user.churchId, program as any)

    useTeamActivityScoreStore.setState({ currentSession })

    return { currentSession }
  } catch (error) {
    console.error('teamActivityScoreLoader 오류:', error)
    return { currentSession: null }
  }
}

export async function studentProgressReportLoader({ params }: LoaderFunctionArgs) {
  const user = await getAuthUser()
  if (!user?.churchId) return { students: [], studentProgress: [], attendanceRecords: [] }

  try {
    const students = await studentService.getStudentsByChurch(user.churchId)
    useStudentStore.setState({ students })

    const studentId = params.studentId
    if (studentId) {
      const [progress, attendance] = await Promise.all([
        sparksHandbookService.getStudentProgress(studentId, user.churchId),
        attendanceService.getAttendanceByStudent(studentId, user.churchId)
      ])

      const progressesMap = new Map(useSparksHandbookStore.getState().studentProgresses)
      progressesMap.set(studentId, progress)
      useSparksHandbookStore.setState({ studentProgresses: progressesMap })
      useAttendanceStore.setState({ attendanceRecords: attendance })

      return { students, studentProgress: progress, attendanceRecords: attendance }
    }

    return { students, studentProgress: [], attendanceRecords: [] }
  } catch (error) {
    console.error('studentProgressReportLoader 오류:', error)
    return { students: [], studentProgress: [], attendanceRecords: [] }
  }
}

export async function churchStatisticsLoader() {
  const user = await getAuthUser()
  if (!user?.churchId) return null

  try {
    const [students, attendanceRecords, studentSummariesList] = await Promise.all([
      studentService.getStudentsByChurch(user.churchId),
      attendanceService.getAllAttendance(user.churchId),
      sparksHandbookService.getAllStudentSummaries(user.churchId)
    ])

    useStudentStore.setState({ students })
    useAttendanceStore.setState({ attendanceRecords })

    const summariesMap = new Map()
    studentSummariesList.forEach(summary => {
      summariesMap.set(summary.studentId, summary)
    })
    useSparksHandbookStore.setState({ studentSummaries: summariesMap })

    return { students, attendanceRecords, studentSummaries: summariesMap }
  } catch (error) {
    console.error('churchStatisticsLoader 오류:', error)
    return null
  }
}

export async function studentHandbookDetailLoader({ params }: LoaderFunctionArgs) {
  const user = await getAuthUser()
  if (!user?.churchId || !params.studentId) return null

  const studentId = params.studentId

  try {
    const [students, summary, progress] = await Promise.all([
      studentService.getStudentsByChurch(user.churchId),
      sparksHandbookService.getStudentHandbookSummary(studentId, user.churchId),
      sparksHandbookService.getStudentProgress(studentId, user.churchId)
    ])

    useStudentStore.setState({ students })

    const summariesMap = new Map(useSparksHandbookStore.getState().studentSummaries)
    if (summary) summariesMap.set(studentId, summary)
    useSparksHandbookStore.setState({ studentSummaries: summariesMap })

    const progressesMap = new Map(useSparksHandbookStore.getState().studentProgresses)
    progressesMap.set(studentId, progress)
    useSparksHandbookStore.setState({ studentProgresses: progressesMap })

    return { students, summary, progress }
  } catch (error) {
    console.error('studentHandbookDetailLoader 오류:', error)
    return null
  }
}

export async function handbookLoader() {
  const user = await getAuthUser()
  if (!user?.churchId) return { students: [], teachers: [], attendances: [] }

  const canViewAllStudents = canManageChurchData(user) || canManageHandbook(user)
  const teacherId = canViewAllStudents ? undefined : getScopedTeacherId(user)
  const today = getKoreanDateString()

  try {
    const [students, teachers, attendances] = await Promise.all([
      studentService.getStudentsByChurch(user.churchId, teacherId),
      userService.getTeachersByChurch(user.churchId),
      attendanceService.getAttendanceByDate(new Date(today), user.churchId)
    ])

    useStudentStore.setState({ students })
    useAttendanceStore.setState({ attendances })

    const sparksStudents = students.filter(s => s.club === Club.SPARKS)
    const summariesMap = new Map(useSparksHandbookStore.getState().studentSummaries)
    const progressesMap = new Map(useSparksHandbookStore.getState().studentProgresses)

    await Promise.all(sparksStudents.map(async (student: any) => {
      const [summary, progress] = await Promise.all([
        sparksHandbookService.getStudentHandbookSummary(student.id, user.churchId!),
        sparksHandbookService.getStudentProgress(student.id, user.churchId!)
      ])
      if (summary) summariesMap.set(student.id, summary)
      progressesMap.set(student.id, progress)
    }))

    useSparksHandbookStore.setState({ studentSummaries: summariesMap, studentProgresses: progressesMap })

    return { students, teachers, attendances }
  } catch (error) {
    console.error('handbookLoader 오류:', error)
    return { students: [], teachers: [], attendances: [] }
  }
}

export async function gameTimeRevealLoader({ request }: LoaderFunctionArgs) {
  const user = await getAuthUser()
  if (!user?.churchId) return null

  const url = new URL(request.url)
  const today = getKoreanDateString()
  const dateStr = url.searchParams.get('date') || today
  const date = new Date(dateStr)
  const program = (url.searchParams.get('program') as Club) || Club.SPARKS

  try {
    const [currentSession, teamActivitySession] = await Promise.all([
      gameTimeService.getGameTimeSessionByDate(new Date(date), user.churchId, program as any),
      teamActivityScoreService.getTeamActivitySessionByDate(new Date(date), user.churchId, program as any)
    ])

    useGameTimeStore.setState({ currentSession })
    useTeamActivityScoreStore.setState({ currentSession: teamActivitySession })

    return { currentSession, teamActivitySession }
  } catch (error) {
    console.error('gameTimeRevealLoader 오류:', error)
    return null
  }
}
