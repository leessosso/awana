import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Club } from '../../constants/clubs'
import { useAuthStore } from '../../store/authStore'
import { useGameTimeStore } from '../../store/gameTimeStore'
import { useTeamActivityScoreStore } from '../../store/teamActivityScoreStore'
import { calculateTotalScores, teamColors, type GameTimeProgram } from '../../models/GameTimeScore'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button, Input, Badge } from '../../components/ui'
import { Alert, AlertDescription } from '../../components/ui/Alert'

type TeamKey = 'red' | 'yellow' | 'blue' | 'green'

const teamOrder: TeamKey[] = ['yellow', 'green', 'blue', 'red']

function getKoreanDateString () {
  const now = new Date()
  const koreanTime = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return koreanTime.toISOString().split('T')[0]
}

function clampProgram (program: string | null): GameTimeProgram {
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

function SlotMachineNumber ({
  target,
  revealSeed,
  delayMs = 0,
}: {
  target: number
  revealSeed: number
  delayMs?: number
}) {
  const targetDigits = Math.max(4, String(Math.max(target, 0)).length)
  const targetString = String(Math.max(target, 0)).padStart(targetDigits, '0')
  const [displayValue, setDisplayValue] = useState(targetString)

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null
    const startedAt = Date.now() + delayMs
    const durationMs = 2200
    const endAt = startedAt + durationMs

    timer = setInterval(() => {
      const now = Date.now()
      if (now < startedAt) return

      const progress = Math.min(1, (now - startedAt) / durationMs)
      const lockedDigits = Math.floor(progress * targetDigits)

      const nextValue = targetString
        .split('')
        .map((digit, index) => {
          if (index < lockedDigits) return digit
          return String(Math.floor(Math.random() * 10))
        })
        .join('')

      setDisplayValue(progress >= 1 ? targetString : nextValue)

      if (now >= endAt && timer) {
        clearInterval(timer)
      }
    }, 55)

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [targetString, targetDigits, revealSeed, delayMs])

  return (
    <div className="font-mono text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-[0.2em] tabular-nums">
      {displayValue}
    </div>
  )
}

export default function GameTimeRevealPage () {
  const { user } = useAuthStore()
  const [searchParams] = useSearchParams()

  const initialDate = searchParams.get('date') || getKoreanDateString()
  const initialProgram = clampProgram(searchParams.get('program'))

  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [selectedProgram, setSelectedProgram] = useState<GameTimeProgram>(initialProgram)
  const [revealSeed, setRevealSeed] = useState(0)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [hasAutoRevealed, setHasAutoRevealed] = useState(false)

  const {
    currentSession: gameSession,
    isLoading: isGameLoading,
    error: gameError,
    fetchGameTimeSession,
  } = useGameTimeStore()
  const {
    currentSession: teamActivitySession,
    isLoading: isTeamLoading,
    error: teamError,
    fetchTeamActivitySession,
  } = useTeamActivityScoreStore()

  useEffect(() => {
    if (!user?.churchId || !selectedDate) return
    const date = new Date(selectedDate)
    fetchGameTimeSession(date, selectedProgram)
    fetchTeamActivitySession(date, selectedProgram)
    setHasAutoRevealed(false)
  }, [
    user?.churchId,
    selectedDate,
    selectedProgram,
    fetchGameTimeSession,
    fetchTeamActivitySession,
  ])

  const gameTotals = useMemo(() => {
    const gameScores = [
      ...(gameSession?.gameScores || []),
      ...(gameSession?.cheerScores || []),
    ]
    return calculateTotalScores(gameScores, [])
  }, [gameSession])

  const teamTotals = teamActivitySession?.totalScores || {
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
  const winningTeam = teamOrder.find((team) => rankings[team] === 1) || 'yellow'
  const isLoading = isGameLoading || isTeamLoading
  const error = gameError || teamError

  const playTone = (frequency: number, durationMs: number, volume = 0.05) => {
    try {
      const browserWindow = window as Window & {
        webkitAudioContext?: typeof AudioContext
      }
      const AudioCtx = globalThis.AudioContext || browserWindow.webkitAudioContext
      if (!AudioCtx) return
      const audioContext = new AudioCtx()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      oscillator.type = 'square'
      oscillator.frequency.value = frequency
      gainNode.gain.value = volume
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      oscillator.start()
      setTimeout(() => {
        oscillator.stop()
        audioContext.close()
      }, durationMs)
    } catch (_error) {
      // 오디오 재생 실패 시에도 점수 공개 흐름은 유지
    }
  }

  const startReveal = () => {
    setCountdown(3)
  }

  const handleFullscreenToggle = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch (_error) {
      // 브라우저 정책으로 전체화면이 거절될 수 있음
    }
  }

  useEffect(() => {
    const syncFullscreen = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }

    syncFullscreen()
    document.addEventListener('fullscreenchange', syncFullscreen)
    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreen)
    }
  }, [])

  useEffect(() => {
    if (isLoading || hasAutoRevealed) return
    startReveal()
    setHasAutoRevealed(true)
  }, [isLoading, hasAutoRevealed])

  useEffect(() => {
    if (countdown === null) return

    if (countdown > 0) {
      playTone(440 + countdown * 110, 120, 0.035)
      const timer = setTimeout(() => {
        setCountdown((prev) => (prev === null ? null : prev - 1))
      }, 850)
      return () => clearTimeout(timer)
    }

    playTone(980, 220, 0.06)
    const revealTimer = setTimeout(() => {
      setRevealSeed((prev) => prev + 1)
      setCountdown(null)
    }, 360)
    return () => clearTimeout(revealTimer)
  }, [countdown])

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white rounded-xl p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            {selectedProgram} 최종 점수 공개
          </h1>
          <p className="text-slate-300 mt-2">게임시간 + 팀활동 점수 합계</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto bg-slate-800 border-slate-700 text-white"
          />
          <div className="flex items-center gap-2 rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="program"
                value={Club.SPARKS}
                checked={selectedProgram === Club.SPARKS}
                onChange={(e) => setSelectedProgram(e.target.value as GameTimeProgram)}
              />
              SPARKS
            </label>
            <label className="flex items-center gap-2 text-sm">
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
            type="button"
            onClick={startReveal}
            disabled={isLoading}
          >
            카운트다운 시작
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={async () => {
              if (!document.fullscreenElement) {
                await handleFullscreenToggle()
              }
              startReveal()
            }}
            disabled={isLoading}
          >
            전체화면 시작
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleFullscreenToggle}
          >
            {isFullscreen ? '전체화면 종료' : '전체화면 전환'}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="border-2 border-amber-400/60 bg-black/40">
        <CardHeader>
          <CardTitle className="text-center text-2xl text-amber-300">
            1등: {teamColors[winningTeam].name}팀
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <SlotMachineNumber
              target={combinedTotals[winningTeam]}
              revealSeed={revealSeed + 99}
            />
            <div className="mt-2 text-sm text-slate-300">
              우승 점수
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teamOrder.map((team, index) => {
          const info = teamColors[team]
          return (
            <Card
              key={team}
              className={`border-2 ${info.borderColor} bg-black/40 backdrop-blur-sm`}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <span className={`h-3 w-3 rounded-full ${info.bgColor}`} />
                  {info.name}팀
                  <Badge
                    variant={rankings[team] === 1 ? 'default' : 'secondary'}
                    className="ml-auto"
                  >
                    {rankings[team]}등
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <SlotMachineNumber
                    target={combinedTotals[team]}
                    revealSeed={revealSeed}
                    delayMs={index * 280}
                  />
                  <div className="mt-3 text-xs text-slate-300">
                    게임 {gameTotals[team]} + 팀활동 {teamTotals[team]}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {countdown !== null && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <div className="text-slate-300 text-xl md:text-2xl mb-5 tracking-wide">
              최종 점수 공개
            </div>
            <div className="font-black text-[7rem] md:text-[12rem] leading-none text-amber-300 animate-pulse">
              {countdown === 0 ? 'GO!' : countdown}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
