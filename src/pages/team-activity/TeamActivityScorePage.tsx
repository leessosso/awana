import { useEffect, useMemo, useState } from 'react'
import { Calendar, Edit, Save, Trash2 } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Badge, Input, Alert, AlertDescription, CountAdjuster } from '../../components/ui'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Club } from '../../constants/clubs'
import { teamColors } from '../../models/GameTimeScore'
import {
  calculateCountsByTeamFromTeacherEntries,
  calculateTeamActivityScore,
  calculateTeamActivityTotalScores,
  createEmptyCountsByTeam,
  createEmptyTeacherEntriesByTeam,
  createEmptyTeamActivityCounts,
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
import { useToast } from '../../hooks/use-toast'
import { UserRole } from '../../models/User'
import { getTeacherProgramLabel, getTeacherTeamLabel } from '../../constants/teacherAssignment'
import { userService } from '../../services/userService'
import { canViewReports } from '../../utils/permissions'
import type { User } from '../../models/User'

const teamOrder: TeamKey[] = ['yellow', 'green', 'blue', 'red']
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

  const isTeacher = user?.role === UserRole.TEACHER
  const isAdminUser = user?.role === UserRole.ADMIN
  const teacherProgram = user?.program
  const teacherTeam = user?.team
  const canViewTeacherBreakdown = canViewReports(user)
  const hasTeacherAssignment = !isTeacher || (Boolean(teacherProgram) && Boolean(teacherTeam))
  const canEditCurrentProgram = !isTeacher || selectedProgram === teacherProgram
  const editableTeams: TeamKey[] = isTeacher && teacherTeam
    ? [teacherTeam as TeamKey]
    : teamOrder

  useEffect(() => {
    if (!user?.churchId || !selectedDate) return
    setIsEditing(false)
    fetchTeamActivitySession(new Date(selectedDate), selectedProgram)
  }, [user?.churchId, selectedDate, selectedProgram, fetchTeamActivitySession])

  useEffect(() => {
    if (!isTeacher || !teacherProgram) return
    setSelectedProgram(
      teacherProgram === Club.SPARKS ? Club.SPARKS : Club.TNT
    )
  }, [isTeacher, teacherProgram])

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
    if (isTeacher && teacherTeam && team !== teacherTeam) return

    const safeValue = Math.max(0, nextValue)
    if (isTeacher && user?.uid) {
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
      if (isTeacher && teacherTeam && user.uid) {
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
    if (!isTeacher || !user?.uid) {
      return countsByTeam[team]
    }

    return teacherEntriesByTeam[team][user.uid] || createEmptyTeamActivityCounts()
  }

  const getTeacherLabel = (teacherId: string): string => {
    const teacher = teachers.find((item) => item.uid === teacherId)
    if (!teacher) return teacherId === '__legacy__' ? '기존 데이터' : '알 수 없음'
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

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{selectedProgram} 팀 활동 점수</h1>
      </div>

      <Card>
        <CardContent className="py-3 px-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-auto"
                />
              </div>
              <div className="flex items-center gap-3 px-3 py-1.5 rounded-md bg-muted/50 border">
                <label className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                  <input
                    type="radio"
                    name="program"
                    value={Club.SPARKS}
                    checked={selectedProgram === Club.SPARKS}
                    onChange={(e) => setSelectedProgram(e.target.value as TeamActivityProgram)}
                    disabled={isTeacher}
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
                    disabled={isTeacher}
                    className="w-4 h-4 cursor-pointer accent-primary"
                  />
                  <span className="text-sm font-medium">T&T</span>
                </label>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              {currentSession && isAdminUser && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  삭제
                </Button>
              )}
              <Button
                size="sm"
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

      {isTeacher && hasTeacherAssignment && (
        <Alert>
          <AlertDescription>
            내 소속: {getTeacherProgramLabel(teacherProgram)} / {getTeacherTeamLabel(teacherTeam)}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-4">
        <div className="order-2 md:order-1">
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
        </div>

        <div className="order-1 md:order-2 grid gap-4 md:grid-cols-2">
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
    </div>
  )
}
