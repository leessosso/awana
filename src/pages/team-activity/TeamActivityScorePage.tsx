import { useEffect, useMemo, useState } from 'react'
import { Calendar, CheckCircle, Edit, Save, Trash2 } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Badge, Input, Alert, AlertDescription, CountAdjuster } from '../../components/ui'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import { Club } from '../../constants/clubs'
import { teamColors } from '../../models/GameTimeScore'
import {
  calculateCountsByTeamFromTeacherEntries,
  calculateTeamActivityScore,
  calculateTeamActivityTotalScores,
  createEmptyCountsByTeam,
  createEmptyTeacherEntriesByTeam,
  createEmptyTeamActivityCounts,
  legacyTeacherEntryId,
  normalizeTeamActivitySessionData,
  teamActivityScoreRules,
  type TeamActivityCounts,
  type TeamActivityProgram,
  type TeamKey,
  type TeamActivityTeacherEntriesByTeam,
  type TeamActivitySessionFormData,
} from '../../models/TeamActivityScore'
import { useTeamActivityScoreStore } from '../../store/teamActivityScoreStore'
import { useAuthStore } from '../../store/authStore'
import { useAttendanceStore } from '../../store/attendanceStore'
import { useToast } from '../../hooks/use-toast'
import { TeacherPosition, UserRole } from '../../models/User'
import { userService } from '../../services/userService'
import { studentService } from '../../services/studentService'
import { AttendanceStatus } from '../../models/Attendance'
import { canManageChurchData, canViewReports, getScopedTeacherId } from '../../utils/permissions'
import { useMobile } from '../../hooks/useMobile'
import type { User } from '../../models/User'
import type { Student } from '../../models/Student'

const teamOrder: TeamKey[] = ['green', 'yellow', 'blue', 'red']
const metricOrder: Array<{
  key: keyof TeamActivityCounts
  label: string
  point: number
}> = [
  { key: 'attendance', label: '출석', point: teamActivityScoreRules.attendance },
  { key: 'handbook', label: '핸드북', point: teamActivityScoreRules.handbook },
  { key: 'uniform', label: '단복', point: teamActivityScoreRules.uniform },
  { key: 'evangelism', label: '전도', point: teamActivityScoreRules.evangelism },
  { key: 'sectionPasses', label: '단원통과', point: teamActivityScoreRules.sectionPasses },
]

function getKoreanDateString () {
  const now = new Date()
  const koreanTime = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return koreanTime.toISOString().split('T')[0]
}

function calculateRankings (scores: Record<TeamKey, number>): Record<TeamKey, number> {
  const sorted = Object.entries(scores)
    .map(([team, score]) => ({ team: team as TeamKey, score }))
    .sort((a, b) => b.score - a.score)

  const rankings = {} as Record<TeamKey, number>
  let currentRank = 1
  let previousScore: number | null = null

  sorted.forEach(({ team, score }, index) => {
    if (previousScore !== null && score < previousScore) {
      currentRank = index + 1
    }
    rankings[team] = currentRank
    previousScore = score
  })

  return rankings
}

export default function TeamActivityScorePage () {
  const isMobile = useMobile()
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [selectedDate, setSelectedDate] = useState(getKoreanDateString())
  const [selectedProgram, setSelectedProgram] = useState<TeamActivityProgram>(Club.SPARKS)
  const [countsByTeam, setCountsByTeam] = useState(createEmptyCountsByTeam())
  const [teacherEntriesByTeam, setTeacherEntriesByTeam] = useState<TeamActivityTeacherEntriesByTeam>(
    createEmptyTeacherEntriesByTeam()
  )
  const [isEditing, setIsEditing] = useState(false)
  const [teachers, setTeachers] = useState<User[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false)
  const [selectedAttendances, setSelectedAttendances] = useState<Set<string>>(new Set())

  const {
    currentSession,
    isLoading,
    error,
    fetchTeamActivitySession,
    createTeamActivitySession,
    updateTeamActivitySession,
    updateTeacherTeamCounts,
    deleteTeamActivitySession,
  } = useTeamActivityScoreStore()
  const {
    attendances,
    fetchAttendances,
    createAttendance,
    updateAttendance,
  } = useAttendanceStore()

  const isTeacher = user?.role === UserRole.TEACHER
  const isOperationsTeacher = isTeacher && (
    user?.position === TeacherPosition.OPERATIONS_TEACHER ||
    (user?.position as string | undefined) === 'admin_teacher'
  )
  const isScopedTeacher = isTeacher && !isOperationsTeacher
  const isAdminUser = user?.role === UserRole.ADMIN
  const teacherProgram = user?.program
  const teacherTeam = user?.team
  const canViewTeacherBreakdown = canViewReports(user)
  const hasTeacherAssignment = !isScopedTeacher || (Boolean(teacherProgram) && Boolean(teacherTeam))
  const canEditCurrentProgram = !isScopedTeacher || selectedProgram === teacherProgram
  const editableTeams: TeamKey[] = isScopedTeacher && teacherTeam
    ? [teacherTeam as TeamKey]
    : teamOrder

  useEffect(() => {
    if (!user?.churchId || !selectedDate) return
    setIsEditing(false)
    fetchTeamActivitySession(new Date(selectedDate), selectedProgram)
  }, [user?.churchId, selectedDate, selectedProgram, fetchTeamActivitySession])

  useEffect(() => {
    if (!user?.churchId) return
    fetchAttendances(user.churchId, selectedDate)
  }, [user?.churchId, selectedDate, fetchAttendances])

  useEffect(() => {
    if (!user?.churchId) return

    const fetchStudentsForAttendance = async () => {
      try {
        const teacherId = canManageChurchData(user) ? undefined : getScopedTeacherId(user)
        const studentList = await studentService.getStudentsByChurch(user.churchId as string, teacherId)
        setStudents(studentList.filter((student) => student.club === selectedProgram))
      } catch (error) {
        console.error('학생 목록 가져오기 실패:', error)
      }
    }

    void fetchStudentsForAttendance()
  }, [user, selectedProgram])

  useEffect(() => {
    if (!isScopedTeacher || !teacherProgram) return
    setSelectedProgram(
      teacherProgram === Club.SPARKS ? Club.SPARKS : Club.TNT
    )
  }, [isScopedTeacher, teacherProgram])

  useEffect(() => {
    if (!user?.churchId || !canViewTeacherBreakdown) {
      setTeachers([])
      return
    }

    let isMounted = true
    const loadTeachers = async () => {
      try {
        const teacherList = await userService.getTeachersByChurch(user.churchId as string)
        if (isMounted) {
          setTeachers(teacherList)
        }
      } catch (error) {
        console.error('선생님 목록 불러오기 실패:', error)
      }
    }

    void loadTeachers()
    return () => {
      isMounted = false
    }
  }, [user?.churchId, canViewTeacherBreakdown])

  useEffect(() => {
    if (isEditing) return
    if (!currentSession) {
      setCountsByTeam(createEmptyCountsByTeam())
      setTeacherEntriesByTeam(createEmptyTeacherEntriesByTeam())
      return
    }
    const normalized = normalizeTeamActivitySessionData({
      countsByTeam: currentSession.countsByTeam,
      teacherEntriesByTeam: currentSession.teacherEntriesByTeam,
    })
    setCountsByTeam(normalized.countsByTeam)
    setTeacherEntriesByTeam(normalized.teacherEntriesByTeam)
  }, [currentSession, isEditing])

  const totalScores = useMemo(
    () => calculateTeamActivityTotalScores(countsByTeam),
    [countsByTeam]
  )
  const rankings = useMemo(() => calculateRankings(totalScores), [totalScores])

  const handleCountChange = (
    team: TeamKey,
    key: keyof TeamActivityCounts,
    nextValue: number
  ) => {
    if (!hasTeacherAssignment || !canEditCurrentProgram) return
    if (isScopedTeacher && teacherTeam && team !== teacherTeam) return

    const safeValue = Math.max(0, nextValue)
    if (isScopedTeacher && user?.uid) {
      const currentTeamTeacherCounts = teacherEntriesByTeam[team][user.uid] || createEmptyTeamActivityCounts()
      const nextTeamTeacherCounts = {
        ...currentTeamTeacherCounts,
        [key]: safeValue,
      }
      const nextTeacherEntriesByTeam = {
        ...teacherEntriesByTeam,
        [team]: {
          ...teacherEntriesByTeam[team],
          [user.uid]: nextTeamTeacherCounts,
        },
      }

      setTeacherEntriesByTeam(nextTeacherEntriesByTeam)
      setCountsByTeam(calculateCountsByTeamFromTeacherEntries(nextTeacherEntriesByTeam))
      setIsEditing(true)
      return
    }

    setCountsByTeam((prev) => ({
      ...prev,
      [team]: {
        ...prev[team],
        [key]: safeValue,
      },
    }))
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (!user?.churchId || !hasTeacherAssignment || !canEditCurrentProgram) return

    try {
      if (isScopedTeacher && teacherTeam && user.uid) {
        const teacherCounts =
          teacherEntriesByTeam[teacherTeam as TeamKey][user.uid] || createEmptyTeamActivityCounts()

        if (currentSession) {
          await updateTeacherTeamCounts(
            currentSession.id,
            teacherTeam as TeamKey,
            user.uid,
            teacherCounts
          )
          toast({
            title: '성공',
            description: `${selectedProgram} 팀 활동 점수가 선생님별로 수정되었습니다.`,
          })
        } else {
          const teacherOnlyEntries = createEmptyTeacherEntriesByTeam()
          teacherOnlyEntries[teacherTeam as TeamKey] = {
            [user.uid]: teacherCounts,
          }

          const normalized = normalizeTeamActivitySessionData({
            teacherEntriesByTeam: teacherOnlyEntries,
          })
          const sessionData: TeamActivitySessionFormData = {
            date: new Date(selectedDate),
            program: selectedProgram,
            countsByTeam: normalized.countsByTeam,
            teacherEntriesByTeam: normalized.teacherEntriesByTeam,
          }

          await createTeamActivitySession(sessionData)
          toast({
            title: '성공',
            description: `${selectedProgram} 팀 활동 점수가 선생님별로 저장되었습니다.`,
          })
        }
      } else {
        const sessionData: TeamActivitySessionFormData = {
          date: new Date(selectedDate),
          program: selectedProgram,
          countsByTeam,
        }

        if (currentSession) {
          await updateTeamActivitySession(currentSession.id, sessionData)
          toast({
            title: '성공',
            description: `${selectedProgram} 팀 활동 점수가 수정되었습니다.`,
          })
        } else {
          await createTeamActivitySession(sessionData)
          toast({
            title: '성공',
            description: `${selectedProgram} 팀 활동 점수가 저장되었습니다.`,
          })
        }
      }

      setIsEditing(false)
    } catch (error) {
      toast({
        title: '오류',
        description:
          error instanceof Error
            ? error.message
            : '팀 활동 점수 저장에 실패했습니다.',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async () => {
    if (!currentSession) return
    if (!isAdminUser) {
      toast({
        title: '권한 없음',
        description: '팀 활동 점수는 관리자만 삭제할 수 있습니다.',
        variant: 'destructive',
      })
      return
    }
    if (!confirm(`정말로 이 ${selectedProgram} 팀 활동 점수 기록을 삭제하시겠습니까?`)) {
      return
    }

    try {
      await deleteTeamActivitySession(currentSession.id)
      setCountsByTeam(createEmptyCountsByTeam())
      setTeacherEntriesByTeam(createEmptyTeacherEntriesByTeam())
      setIsEditing(false)
      toast({
        title: '성공',
        description: `${selectedProgram} 팀 활동 점수 기록이 삭제되었습니다.`,
      })
    } catch (error) {
      toast({
        title: '오류',
        description:
          error instanceof Error
            ? error.message
            : '팀 활동 점수 삭제에 실패했습니다.',
        variant: 'destructive',
      })
    }
  }

  const getTeamEditableCounts = (team: TeamKey): TeamActivityCounts => {
    if (!isScopedTeacher || !user?.uid) {
      return countsByTeam[team]
    }

    return teacherEntriesByTeam[team][user.uid] || createEmptyTeamActivityCounts()
  }

  const getTeacherLabel = (teacherId: string): string => {
    const teacher = teachers.find((item) => item.uid === teacherId)
    if (!teacher) return teacherId === legacyTeacherEntryId ? '기존 데이터' : '알 수 없음'
    return teacher.displayName || teacher.loginId || teacher.email || teacherId
  }

  const getTeacherStatusRows = (team: TeamKey) => {
    const assignedTeachers = teachers.filter((item) =>
      item.program === selectedProgram &&
      item.team === team
    )
    const entryTeacherIds = Object.keys(teacherEntriesByTeam[team])
    const allTeacherIds = Array.from(
      new Set([
        ...assignedTeachers.map((item) => item.uid),
        ...entryTeacherIds,
      ])
    )

    return allTeacherIds.map((teacherId) => {
      const counts = teacherEntriesByTeam[team][teacherId] || createEmptyTeamActivityCounts()
      return {
        teacherId,
        label: getTeacherLabel(teacherId),
        counts,
        score: calculateTeamActivityScore(counts),
        hasInput: Object.values(counts).some((value) => value > 0),
      }
    }).sort((a, b) => {
      if (a.hasInput !== b.hasInput) {
        return a.hasInput ? -1 : 1
      }
      return a.label.localeCompare(b.label, 'ko')
    })
  }

  const handleOpenAttendanceDialog = () => {
    const existingAttendances = attendances?.filter((attendance) =>
      attendance.date.toISOString().split('T')[0] === selectedDate
    ) || []
    const presentStudentIds = new Set(
      existingAttendances
        .filter((attendance) => attendance.status === AttendanceStatus.PRESENT)
        .map((attendance) => attendance.studentId)
    )

    setSelectedAttendances(presentStudentIds)
    setAttendanceDialogOpen(true)
  }

  const handleStudentToggle = (studentId: string) => {
    const nextSelected = new Set(selectedAttendances)
    if (nextSelected.has(studentId)) {
      nextSelected.delete(studentId)
    } else {
      nextSelected.add(studentId)
    }
    setSelectedAttendances(nextSelected)
  }

  const handleSaveAttendance = async () => {
    if (!user?.churchId) return

    try {
      const existingAttendances = attendances?.filter((attendance) =>
        attendance.date.toISOString().split('T')[0] === selectedDate
      ) || []

      for (const student of students) {
        const isPresent = selectedAttendances.has(student.id)
        const existingAttendance = existingAttendances.find((attendance) => attendance.studentId === student.id)

        if (existingAttendance) {
          await updateAttendance(existingAttendance.id, {
            ...existingAttendance,
            status: isPresent ? AttendanceStatus.PRESENT : AttendanceStatus.ABSENT,
          })
          continue
        }

        await createAttendance({
          studentId: student.id,
          date: new Date(selectedDate),
          status: isPresent ? AttendanceStatus.PRESENT : AttendanceStatus.ABSENT,
          studentName: student.name,
          teacherId: '',
          teacherName: '',
        })
      }

      await fetchAttendances(user.churchId, selectedDate)
      setAttendanceDialogOpen(false)
    } catch (error) {
      console.error('출결 저장 실패:', error)
      toast({
        title: '오류',
        description: '출결 저장에 실패했습니다.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardContent className="py-3 px-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full max-w-[170px] sm:w-auto"
              />
            </div>
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-md bg-muted/50 border w-fit">
              <label className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                <input
                  type="radio"
                  name="program"
                  value={Club.SPARKS}
                  checked={selectedProgram === Club.SPARKS}
                  onChange={(e) => setSelectedProgram(e.target.value as TeamActivityProgram)}
                  disabled={isScopedTeacher}
                  className="w-4 h-4 cursor-pointer accent-primary"
                />
                <span className="text-sm font-medium">SPARKS</span>
              </label>
              <div className="w-px h-4 bg-border" />
              <label className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                <input
                  type="radio"
                  name="program"
                  value={Club.TNT}
                  checked={selectedProgram === Club.TNT}
                  onChange={(e) => setSelectedProgram(e.target.value as TeamActivityProgram)}
                  disabled={isScopedTeacher}
                  className="w-4 h-4 cursor-pointer accent-primary"
                />
                <span className="text-sm font-medium">T&T</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!hasTeacherAssignment && (
        <Alert variant="destructive">
          <AlertDescription>
            선생님 계정에 소속 클럽/팀이 설정되지 않았습니다. 설정 화면에서 먼저 지정해주세요.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-4">
        {!isTeacher && (
          <Card className="bg-muted/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">팀 활동 점수 합계</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {teamOrder.map((team) => {
                  const teamInfo = teamColors[team]
                  return (
                    <div
                      key={team}
                      className={`border-2 rounded-lg p-2 ${teamInfo.borderColor} bg-background`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className={`w-2.5 h-2.5 rounded-full ${teamInfo.bgColor}`} />
                        <h3 className="font-semibold text-xs">{teamInfo.name}</h3>
                        <Badge
                          variant={rankings[team] === 1 ? 'default' : 'secondary'}
                          className="text-xs py-0 ml-auto"
                        >
                          {rankings[team]}등
                        </Badge>
                      </div>
                      <div className="text-xl font-bold">{totalScores[team]}점</div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {editableTeams.map((team) => {
            const teamInfo = teamColors[team]
            const teamCounts = getTeamEditableCounts(team)

            return (
              <Card key={team} className={`border-2 ${teamInfo.borderColor}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${teamInfo.bgColor}`} />
                    {teamInfo.name}팀
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {metricOrder.map((metric) => (
                    <div
                      key={metric.key}
                      className="flex items-center justify-between rounded-md border p-2"
                    >
                      <div>
                        <div className="text-sm font-medium">{metric.label}</div>
                        <div className="text-xs text-muted-foreground">
                          1명/1회당 {metric.point}점
                        </div>
                      </div>
                      <CountAdjuster
                        value={teamCounts[metric.key]}
                        onChange={(nextValue) =>
                          handleCountChange(team, metric.key, nextValue)
                        }
                        disabled={isLoading}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="flex justify-end gap-2">
          {currentSession && isAdminUser && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              삭제
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={isLoading || !isEditing || !hasTeacherAssignment || !canEditCurrentProgram}
          >
            {currentSession ? (
              <>
                <Edit className="h-4 w-4 mr-1" />
                수정
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1" />
                저장
              </>
            )}
          </Button>
        </div>
      </div>

      {canViewTeacherBreakdown && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">선생님별 입력 현황</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {teamOrder.map((team) => {
              const rows = getTeacherStatusRows(team)
              const teamInfo = teamColors[team]

              return (
                <div key={team} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${teamInfo.bgColor}`} />
                    <h3 className="text-sm font-semibold">{teamInfo.name}팀</h3>
                  </div>
                  {rows.length === 0 ? (
                    <p className="text-sm text-muted-foreground">배정된 선생님이 없습니다.</p>
                  ) : (
                    <div className="space-y-2">
                      {rows.map((row) => (
                        <div
                          key={row.teacherId}
                          className="rounded-md border px-3 py-2 text-sm flex items-center justify-between gap-3"
                        >
                          <div>
                            <div className="font-medium">{row.label}</div>
                            <div className="text-xs text-muted-foreground">
                              출석 {row.counts.attendance} / 핸드북 {row.counts.handbook} / 단복 {row.counts.uniform} / 전도 {row.counts.evangelism} / 단원통과 {row.counts.sectionPasses}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{row.score}점</div>
                            <div className="text-xs text-muted-foreground">
                              {row.hasInput ? '입력됨' : '미입력'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* 모바일 출결 체크 FAB */}
      {isMobile && !attendanceDialogOpen && (
        <Button
          className="fixed bottom-4 left-4 h-14 w-14 rounded-full shadow-lg z-50 bg-primary hover:bg-primary/90"
          onClick={handleOpenAttendanceDialog}
          style={{ zIndex: 9999 }}
        >
          <Calendar className="h-6 w-6" />
        </Button>
      )}

      {/* 출결 체크 다이얼로그 */}
      <Dialog open={attendanceDialogOpen} onOpenChange={setAttendanceDialogOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader className="text-center pb-2">
            <DialogTitle className="text-xl font-bold">📅 출결 체크</DialogTitle>
            <DialogDescription className="text-base">
              {selectedDate} 출결 현황
            </DialogDescription>
          </DialogHeader>

          <div className="mb-4">
            <Input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="w-full"
              style={{ colorScheme: 'light dark' }}
            />
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2">
            {students.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                등록된 학생이 없습니다.
              </p>
            ) : (
              students.map((student) => (
                <div
                  key={student.id}
                  onClick={() => handleStudentToggle(student.id)}
                  className={`flex items-center justify-between min-h-12 px-4 py-3 rounded-lg border cursor-pointer text-base ${
                    selectedAttendances.has(student.id)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card border-border'
                  }`}
                >
                  <span className="font-medium">{student.name}</span>
                  <CheckCircle
                    className={`h-5 w-5 ${
                      selectedAttendances.has(student.id) ? 'text-primary-foreground' : 'text-muted-foreground'
                    }`}
                  />
                </div>
              ))
            )}
          </div>

          <p className="text-sm text-muted-foreground text-center mt-4 mb-6">
            출석한 학생을 선택해주세요
          </p>

          <div className="flex justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => setAttendanceDialogOpen(false)}
              className="px-6 py-2"
            >
              취소
            </Button>
            <Button
              onClick={handleSaveAttendance}
              className="px-6 py-2 shadow-md hover:shadow-lg transition-all"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              저장하기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
