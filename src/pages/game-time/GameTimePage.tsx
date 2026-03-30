import { useEffect, useState } from 'react'
import { Trash2, Calendar, Save, Edit, X } from 'lucide-react'
import { useGameTimeStore } from '../../store/gameTimeStore'
import { useTeamActivityScoreStore } from '../../store/teamActivityScoreStore'
import { useAuthStore } from '../../store/authStore'
import type {
  ScoreEvent,
  GameTimeSessionFormData,
  GameTimeProgram,
} from '../../models/GameTimeScore'
import {
  gameScoreOptions,
  teamColors,
  calculateTotalScores,
} from '../../models/GameTimeScore'
import { Club } from '../../constants/clubs'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Badge } from '../../components/ui'
import { Alert, AlertDescription } from '../../components/ui'
import { useToast } from '../../hooks/use-toast'

export default function GameTimePage() {
  const { user } = useAuthStore()
  const { toast } = useToast()

  // 한국 시간 기준 오늘 날짜 계산
  const getKoreanDateString = () => {
    const now = new Date()
    const koreanTime = new Date(now.getTime() + 9 * 60 * 60 * 1000)
    return koreanTime.toISOString().split('T')[0]
  }

  const [selectedDate, setSelectedDate] = useState(getKoreanDateString())
  const [selectedProgram, setSelectedProgram] = useState<GameTimeProgram>(Club.SPARKS)

  // 통합 스토어 사용
  const {
    currentSession,
    isLoading,
    error,
    fetchGameTimeSession,
    createGameTimeSession,
    updateGameTimeSession,
    deleteGameTimeSession,
  } = useGameTimeStore()
  const {
    currentSession: teamActivitySession,
    fetchTeamActivitySession,
  } = useTeamActivityScoreStore()

  const [gameScores, setGameScores] = useState<ScoreEvent[]>([])
  const [isEditing, setIsEditing] = useState(false)

  // 날짜 또는 프로그램 변경 시 세션 로드
  useEffect(() => {
    if (user?.churchId && selectedDate) {
      const date = new Date(selectedDate)
      // 프로그램이 변경되면 편집 상태 초기화
      setIsEditing(false)
      fetchGameTimeSession(date, selectedProgram)
      fetchTeamActivitySession(date, selectedProgram)
    }
  }, [
    selectedDate,
    selectedProgram,
    user?.churchId,
    fetchGameTimeSession,
    fetchTeamActivitySession,
  ])

  // 세션이 로드되면 데이터 업데이트 (편집 중이 아닐 때만)
  useEffect(() => {
    if (!isEditing && currentSession) {
      // 기존 게임 점수와 응원점수를 합쳐서 게임 점수로 사용
      // (현재 모델은 cheerScores가 있지만 UI에서는 통합 관리하는 형태)
      const allScores = [
        ...(currentSession.gameScores || []),
        ...(currentSession.cheerScores || []),
      ]
      setGameScores(allScores)
    } else if (!isEditing && !currentSession) {
      setGameScores([])
    }
  }, [currentSession, isEditing])

  // 오늘 날짜인지 확인
  const isToday = () => {
    const today = getKoreanDateString()
    return selectedDate === today
  }

  // 게임 점수 추가/차감
  const handleAddGameScore = (
    team: 'red' | 'yellow' | 'blue' | 'green',
    score: number
  ) => {
    const newScoreEvent: ScoreEvent = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      team,
      score,
    }
    setGameScores((prevScores) => [...prevScores, newScoreEvent])
    setIsEditing(true)
  }

  // 게임 점수 삭제
  const handleDeleteGameScore = (id: string) => {
    setGameScores(gameScores.filter((gs) => gs.id !== id))
    setIsEditing(true)
  }

  // 총점 계산
  const getGameTotals = () => {
    return calculateTotalScores(gameScores, [])
  }

  const getCombinedTotals = () => {
    const gameTotals = getGameTotals()
    const teamActivityTotals = teamActivitySession?.totalScores || {
      red: 0,
      yellow: 0,
      blue: 0,
      green: 0,
    }

    return {
      red: gameTotals.red + teamActivityTotals.red,
      yellow: gameTotals.yellow + teamActivityTotals.yellow,
      blue: gameTotals.blue + teamActivityTotals.blue,
      green: gameTotals.green + teamActivityTotals.green,
    }
  }

  // 최종 순위 계산
  const calculateRankings = () => {
    const totals = getCombinedTotals()
    const sorted = Object.entries(totals)
      .map(([team, score]) => ({ team, score }))
      .sort((a, b) => b.score - a.score)

    const rankings: Record<string, number> = {}
    let currentRank = 1
    let previousScore: number | null = null

    sorted.forEach(({ team, score }) => {
      if (previousScore !== null && score < previousScore) {
        currentRank = sorted.findIndex((s) => s.team === team) + 1
      }
      rankings[team] = currentRank
      previousScore = score
    })

    return rankings
  }

  // 저장
  const handleSave = async () => {
    if (!user?.churchId) return

    try {
      const sessionData: GameTimeSessionFormData = {
        date: new Date(selectedDate),
        program: selectedProgram,
        gameScores: gameScores,
        cheerScores: [], // 응원점수는 게임 점수에 통합하여 관리
      }

      if (currentSession) {
        await updateGameTimeSession(currentSession.id, sessionData)
        toast({
          title: '성공',
          description: `${selectedProgram} 게임시간 점수가 수정되었습니다.`,
        })
      } else {
        await createGameTimeSession(sessionData)
        toast({
          title: '성공',
          description: `${selectedProgram} 게임시간 점수가 저장되었습니다.`,
        })
      }
      setIsEditing(false)
    } catch (error) {
      toast({
        title: '오류',
        description:
          error instanceof Error
            ? error.message
            : '게임시간 점수 저장에 실패했습니다.',
        variant: 'destructive',
      })
    }
  }

  // 삭제
  const handleDelete = async () => {
    if (!currentSession) return

    if (!confirm(`정말로 이 ${selectedProgram} 게임시간 기록을 삭제하시겠습니까?`)) {
      return
    }

    try {
      await deleteGameTimeSession(currentSession.id)
      setGameScores([])
      toast({
        title: '성공',
        description: `${selectedProgram} 게임시간 기록이 삭제되었습니다.`,
      })
    } catch (error) {
      toast({
        title: '오류',
        description:
          error instanceof Error
            ? error.message
            : '게임시간 기록 삭제에 실패했습니다.',
        variant: 'destructive',
      })
    }
  }

  const gameTotals = getGameTotals()
  const teamActivityTotals = teamActivitySession?.totalScores || {
    red: 0,
    yellow: 0,
    blue: 0,
    green: 0,
  }
  const totals = getCombinedTotals()
  const rankings = calculateRankings()

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{selectedProgram} 게임시간 점수 관리</h1>
      </div>

      {/* 상단 고정 섹션 */}
      <div className="sticky top-4 z-10 space-y-3 bg-background/95 backdrop-blur-sm pb-2 -mx-4 px-4 pt-2">
        {/* 날짜 선택 및 액션 버튼 */}
        <Card className="shadow-lg">
          <CardContent className="py-3 px-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
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
                      onChange={(e) =>
                        setSelectedProgram(e.target.value as GameTimeProgram)
                      }
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
                      onChange={(e) =>
                        setSelectedProgram(e.target.value as GameTimeProgram)
                      }
                      className="w-4 h-4 cursor-pointer accent-primary"
                    />
                    <span className="text-sm font-medium">T&T</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                {currentSession && isToday() && (
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
                  disabled={isLoading || !isEditing}
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

        {/* 최종 합계 */}
        <Card className="bg-muted/50 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">최종 합계</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['red', 'yellow', 'blue', 'green'] as const).map((team) => {
                const teamInfo = teamColors[team]
                const total = totals[team]
                const rank = rankings[team]
                return (
                  <div
                    key={team}
                    className={`border-2 rounded-lg p-2 ${teamInfo.borderColor} bg-background`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${teamInfo.bgColor}`}
                      />
                      <h3 className="font-semibold text-xs">{teamInfo.name}</h3>
                      <Badge
                        variant={rank === 1 ? 'default' : 'secondary'}
                        className="text-xs py-0 ml-auto"
                      >
                        {rank}등
                      </Badge>
                    </div>
                    <div className="text-xl font-bold">{total}점</div>
                    <div className="text-[11px] text-muted-foreground mt-1">
                      게임 {gameTotals[team]} + 팀활동 {teamActivityTotals[team]}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 게임 점수 섹션 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">게임 점수</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="space-y-3">
            {/* 게임 점수 추가/차감 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['red', 'yellow', 'blue', 'green'] as const).map((team) => {
                const teamInfo = teamColors[team]
                return (
                  <div
                    key={team}
                    className={`border-2 rounded-lg p-2 ${teamInfo.borderColor} bg-background`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1">
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${teamInfo.bgColor}`}
                        />
                        <h3 className="font-semibold text-xs">{teamInfo.name}</h3>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {gameScoreOptions.map((score) => (
                          <Button
                            key={score}
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddGameScore(team, score)}
                            className="h-6 px-1.5 text-xs"
                            disabled={isLoading}
                          >
                            +{score}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 게임 점수 목록 */}
            {gameScores.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t">
                <div className="text-xs font-medium text-muted-foreground">
                  게임 점수 기록
                </div>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {gameScores.map((event) => {
                    const teamInfo = teamColors[event.team]
                    return (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-1.5 rounded-md bg-muted/50"
                      >
                        <div className="flex items-center gap-1.5">
                          <div
                            className={`w-2.5 h-2.5 rounded-full ${teamInfo.bgColor}`}
                          />
                          <span className="text-xs">
                            {teamInfo.name} {event.score > 0 ? '+' : ''}{event.score}점
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteGameScore(event.id)}
                          disabled={isLoading}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}