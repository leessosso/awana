import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button, Input, Badge } from '../../components/ui'
import { Alert, AlertDescription } from '../../components/ui/Alert'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Club } from '../../constants/clubs'
import { calculateTotalScores, teamColors, type GameTimeProgram } from '../../models/GameTimeScore'
import { useAuthStore } from '../../store/authStore'
import { useGameTimeStore } from '../../store/gameTimeStore'
import { useTeamActivityScoreStore } from '../../store/teamActivityScoreStore'

type TeamKey = 'red' | 'yellow' | 'blue' | 'green'

const teamOrder: TeamKey[] = ['yellow', 'green', 'blue', 'red']
const TEAM_ROLL_DURATION_MS = 2100
const TEAM_ROLL_GAP_MS = 220
const TEAM_ROLL_STEP_MS = TEAM_ROLL_DURATION_MS + TEAM_ROLL_GAP_MS

function getKoreanDateString () {
  const now = new Date()
  const koreanTime = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return koreanTime.toISOString().split('T')[0]
}

function parseProgram (program: string | null): GameTimeProgram {
  return program === Club.TNT ? Club.TNT : Club.SPARKS
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

function RollingNumber ({
  target,
  seed,
  delayMs = 0,
}: {
  target: number
  seed: number
  delayMs?: number
}) {
  const targetDigits = Math.max(4, String(Math.max(target, 0)).length)
  const targetString = String(Math.max(target, 0)).padStart(targetDigits, '0')
  const getMaskedValue = () => '0'.repeat(targetDigits)

  const [displayValue, setDisplayValue] = useState(getMaskedValue)

  useEffect(() => {
    setDisplayValue(getMaskedValue())
    if (seed === 0) return
    const startAt = Date.now() + delayMs
    const durationMs = TEAM_ROLL_DURATION_MS
    const timer = setInterval(() => {
      const now = Date.now()
      if (now < startAt) return

      const progress = Math.min(1, (now - startAt) / durationMs)
      const lockedCount = Math.floor(progress * targetDigits)
      const nextValue = targetString
        .split('')
        .map((digit, index) => (index < lockedCount ? digit : String(Math.floor(Math.random() * 10))))
        .join('')

      setDisplayValue(progress >= 1 ? targetString : nextValue)
      if (progress >= 1) {
        clearInterval(timer)
      }
    }, 50)

    return () => clearInterval(timer)
  }, [targetString, targetDigits, seed, delayMs])

  return (
    <div className="font-mono text-4xl md:text-6xl font-black tracking-[0.16em] tabular-nums">
      {displayValue}
    </div>
  )
}

export default function GameTimeRevealPage () {
  const { user } = useAuthStore()
  const [searchParams] = useSearchParams()
  const [selectedDate, setSelectedDate] = useState(searchParams.get('date') || getKoreanDateString())
  const [selectedProgram, setSelectedProgram] = useState<GameTimeProgram>(
    parseProgram(searchParams.get('program'))
  )
  const [revealSeed, setRevealSeed] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isRankVisible, setIsRankVisible] = useState(false)
  const [isFinalVisible, setIsFinalVisible] = useState(false)

  const {
    currentSession: gameSession,
    isLoading: gameLoading,
    error: gameError,
    fetchGameTimeSession,
  } = useGameTimeStore()
  const {
    currentSession: teamSession,
    isLoading: teamLoading,
    error: teamError,
    fetchTeamActivitySession,
  } = useTeamActivityScoreStore()

  useEffect(() => {
    if (!user?.churchId || !selectedDate) return
    const date = new Date(selectedDate)
    fetchGameTimeSession(date, selectedProgram)
    fetchTeamActivitySession(date, selectedProgram)
    setRevealSeed(0)
    setIsRankVisible(false)
    setIsFinalVisible(false)
  }, [user?.churchId, selectedDate, selectedProgram, fetchGameTimeSession, fetchTeamActivitySession])

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
    onFullscreenChange()
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  const gameTotals = useMemo(() => {
    const allGameScores = [
      ...(gameSession?.gameScores || []),
      ...(gameSession?.cheerScores || []),
    ]
    return calculateTotalScores(allGameScores, [])
  }, [gameSession])

  const teamTotals = teamSession?.totalScores || {
    red: 0,
    yellow: 0,
    blue: 0,
    green: 0,
  }

  const combinedTotals: Record<TeamKey, number> = {
    red: gameTotals.red + teamTotals.red,
    yellow: gameTotals.yellow + teamTotals.yellow,
    blue: gameTotals.blue + teamTotals.blue,
    green: gameTotals.green + teamTotals.green,
  }

  const rankings = calculateRankings(combinedTotals)
  const winningTeams = teamOrder.filter((team) => rankings[team] === 1)
  const winnerScore = winningTeams.length > 0 ? combinedTotals[winningTeams[0]] : 0
  const winnerLabel = winningTeams.map((team) => `${teamColors[team].name}팀`).join(', ')
  const isLoading = gameLoading || teamLoading
  const error = gameError || teamError

  const startReveal = () => {
    setRevealSeed((prev) => prev + 1)
  }

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
        return
      }
      await document.exitFullscreen()
    } catch (_error) {
      // 전체화면 거부 시에도 앱 흐름은 유지
    }
  }

  useEffect(() => {
    if (revealSeed === 0) return
    setIsRankVisible(false)
    setIsFinalVisible(false)
    const lastTeamDelay = (teamOrder.length - 1) * TEAM_ROLL_STEP_MS
    const rollingDuration = TEAM_ROLL_DURATION_MS
    const visibleAfterMs = lastTeamDelay + rollingDuration + 120
    const timer = setTimeout(() => {
      setIsRankVisible(true)
      setIsFinalVisible(true)
    }, visibleAfterMs)
    return () => clearTimeout(timer)
  }, [revealSeed])

  return (
    <div className="min-h-[calc(100vh-4rem)] rounded-xl border bg-gradient-to-b from-background via-muted/30 to-muted/60 p-4 md:p-8 space-y-6 text-foreground dark:from-slate-950 dark:via-slate-900 dark:to-black">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black">{selectedProgram} 최종 점수 공개</h1>
          <p className="mt-2 text-muted-foreground">게임시간 + 팀활동 점수 합계</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto"
          />
          <div className="flex items-center gap-3 rounded-md border bg-background/80 px-3 py-1.5 dark:bg-slate-900/70">
            <label className="text-sm flex items-center gap-2">
              <input
                type="radio"
                name="program"
                value={Club.SPARKS}
                checked={selectedProgram === Club.SPARKS}
                onChange={(e) => setSelectedProgram(e.target.value as GameTimeProgram)}
              />
              SPARKS
            </label>
            <label className="text-sm flex items-center gap-2">
              <input
                type="radio"
                name="program"
                value={Club.TNT}
                checked={selectedProgram === Club.TNT}
                onChange={(e) => setSelectedProgram(e.target.value as GameTimeProgram)}
              />
              T&T
            </label>
          </div>
          <Button
            variant="secondary"
            onClick={startReveal}
            disabled={isLoading}
          >
            점수 공개 시작
          </Button>
          <Button variant="outline" onClick={toggleFullscreen}>
            {isFullscreen ? '전체화면 종료' : '전체화면 전환'}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="border-2 border-amber-500/70 bg-amber-50/60 dark:border-amber-400/60 dark:bg-black/35">
        <CardHeader>
          <CardTitle className="text-center text-2xl text-amber-700 dark:text-amber-300">
            {isRankVisible
              ? winningTeams.length > 1
                ? `공동 우승: ${winnerLabel}`
                : `1등: ${winnerLabel}`
              : revealSeed === 0 ? '점수 공개 대기 중' : '순위 집계 중...'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          {isFinalVisible ? (
            <div className="font-mono text-4xl md:text-6xl font-black tracking-[0.16em] tabular-nums">
              {String(Math.max(winnerScore, 0)).padStart(4, '0')}
            </div>
          ) : (
            <div className="font-mono text-4xl md:text-6xl font-black tracking-[0.16em] tabular-nums">
              0000
            </div>
          )}
          <div className="mt-2 text-sm text-muted-foreground">
            {isFinalVisible
              ? winningTeams.length > 1 ? '공동 우승 점수' : '우승 점수'
              : '최종 점수'}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teamOrder.map((team, index) => {
          const info = teamColors[team]
          return (
            <Card key={team} className={`border-2 bg-background/80 dark:bg-black/35 ${info.borderColor}`}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <span className={`h-3 w-3 rounded-full ${info.bgColor}`} />
                  {info.name}팀
                  <Badge
                    variant={isRankVisible && rankings[team] === 1 ? 'default' : 'secondary'}
                    className="ml-auto"
                  >
                    {isRankVisible ? `${rankings[team]}등` : revealSeed === 0 ? '대기중' : '공개중'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <RollingNumber
                  target={combinedTotals[team]}
                  seed={revealSeed}
                  delayMs={index * TEAM_ROLL_STEP_MS}
                />
              </CardContent>
            </Card>
          )
        })}
      </div>

    </div>
  )
}
