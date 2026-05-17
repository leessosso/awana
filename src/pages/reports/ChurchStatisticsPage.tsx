import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Users,
  CheckCircle,
  TrendingUp,
  GraduationCap,
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { useStudentStore } from '../../store/studentStore'
import { useAttendanceStore } from '../../store/attendanceStore'
import { useSparksHandbookStore } from '../../store/sparksHandbookStore'
import { AttendanceStatus } from '../../models'
import { Club } from '../../constants'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'info'
}

function StatCard({ title, value, subtitle, icon }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <h3 className="text-3xl font-bold">{value}</h3>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className="text-primary">{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ChurchStatisticsPage() {
  const navigate = useNavigate()
  const { students } = useStudentStore()
  const { attendanceRecords } = useAttendanceStore()
  const { studentSummaries } = useSparksHandbookStore()

  const [loading] = useState(false)

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // 통계 계산
  const totalStudents = students?.length || 0
  const activeStudents =
    students?.filter((s) => s.isActive !== false).length || 0

  // 클럽별 학생 수
  const clubStats = Object.values(Club).map((club) => ({
    club,
    count:
      students?.filter((s) => s.club === club && s.isActive !== false).length ||
      0,
  }))

  // 출석 통계 (최근 30일)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const recentAttendance = attendanceRecords.filter(
    (a) => a.date >= thirtyDaysAgo,
  )
  const totalAttendanceRecords = recentAttendance.length
  const presentCount = recentAttendance.filter(
    (a) => a.status === AttendanceStatus.PRESENT,
  ).length
  const attendanceRate =
    totalAttendanceRecords > 0
      ? Math.round((presentCount / totalAttendanceRecords) * 100)
      : 0

  // SPARKS 진도 통계
  const sparksSummaries = Array.from(studentSummaries.values())
  const totalSparksSections = sparksSummaries.length * 16 // 각 학생당 16개 섹션 (4핸드북 × 2보석타입 × 2섹션)
  const completedSections = sparksSummaries.reduce((sum, student) => {
    return (
      sum +
      student.hangGliderProgress.redCompleted +
      student.hangGliderProgress.greenCompleted +
      student.wingRunnerProgress.redCompleted +
      student.wingRunnerProgress.greenCompleted +
      student.skyStormerProgress.redCompleted +
      student.skyStormerProgress.greenCompleted
    )
  }, 0)
  const progressRate =
    totalSparksSections > 0
      ? Math.round((completedSections / totalSparksSections) * 100)
      : 0

  // 월별 출석 추이 (최근 6개월)
  const monthlyAttendance = []
  for (let i = 5; i >= 0; i--) {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    const month = date.getMonth() + 1
    const year = date.getFullYear()

    const monthAttendance = attendanceRecords.filter(
      (a) => a.date.getMonth() + 1 === month && a.date.getFullYear() === year,
    )
    const present = monthAttendance.filter(
      (a) => a.status === AttendanceStatus.PRESENT,
    ).length

    monthlyAttendance.push({
      month: `${month}월`,
      attendance: present,
      total: monthAttendance.length,
      rate:
        monthAttendance.length > 0
          ? Math.round((present / monthAttendance.length) * 100)
          : 0,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/reports')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          뒤로가기
        </Button>
      </div>

      {/* 주요 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="총 학생 수"
          value={totalStudents}
          subtitle={`${activeStudents}명 활동중`}
          icon={<Users className="w-8 h-8" />}
          color="primary"
        />
        <StatCard
          title="최근 출석률"
          value={`${attendanceRate}%`}
          subtitle="지난 30일 기준"
          icon={<CheckCircle className="w-8 h-8" />}
          color="success"
        />
        <StatCard
          title="SPARKS 진도율"
          value={`${progressRate}%`}
          subtitle={`${completedSections}/${totalSparksSections} 섹션 완료`}
          icon={<TrendingUp className="w-8 h-8" />}
          color="warning"
        />
        <StatCard
          title="활동 클럽"
          value={clubStats.filter((c) => c.count > 0).length}
          subtitle="개 운영중"
          icon={<GraduationCap className="w-8 h-8" />}
          color="info"
        />
      </div>

      {/* 클럽별 현황 */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">클럽별 학생 현황</h2>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      클럽
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">
                      학생 수
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">
                      비율
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      상태
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {clubStats.map((stat) => (
                    <tr key={stat.club}>
                      <td className="px-6 py-4 text-sm">{stat.club}</td>
                      <td className="px-6 py-4 text-sm text-right">
                        {stat.count}
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        {totalStudents > 0
                          ? `${Math.round((stat.count / totalStudents) * 100)}%`
                          : '0%'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {stat.count > 0 ? (
                          <Badge>운영중</Badge>
                        ) : (
                          <Badge variant="outline">미운영</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 월별 출석 추이 */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">월별 출석 추이 (최근 6개월)</h2>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      월
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">
                      출석
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">
                      총 기록
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">
                      출석률
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {monthlyAttendance.map((month) => (
                    <tr key={month.month}>
                      <td className="px-6 py-4 text-sm">{month.month}</td>
                      <td className="px-6 py-4 text-sm text-right">
                        {month.attendance}
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        {month.total}
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span>{month.rate}%</span>
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                month.rate >= 80
                                  ? 'bg-green-500'
                                  : month.rate >= 60
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                              }`}
                              style={{ width: `${month.rate}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SPARKS 진도 상세 */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">SPARKS 핸드북 진도 현황</h2>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      학생 이름
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">
                      완료 섹션
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">
                      총 섹션
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">
                      진도율
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      최근 활동
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sparksSummaries.slice(0, 10).map((student) => {
                    const totalCompleted =
                      student.hangGliderProgress.redCompleted +
                      student.hangGliderProgress.greenCompleted +
                      student.wingRunnerProgress.redCompleted +
                      student.wingRunnerProgress.greenCompleted +
                      student.skyStormerProgress.redCompleted +
                      student.skyStormerProgress.greenCompleted

                    return (
                      <tr key={student.studentId}>
                        <td className="px-6 py-4 text-sm">
                          {student.studentId}
                        </td>
                        <td className="px-6 py-4 text-sm text-right">
                          {totalCompleted}
                        </td>
                        <td className="px-6 py-4 text-sm text-right">16</td>
                        <td className="px-6 py-4 text-sm text-right">
                          {Math.round((totalCompleted / 16) * 100)}%
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {student.lastCompletedDate
                            ? new Date(
                                student.lastCompletedDate,
                              ).toLocaleDateString('ko-KR')
                            : '-'}
                        </td>
                      </tr>
                    )
                  })}
                  {sparksSummaries.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-8 text-center text-muted-foreground"
                      >
                        SPARKS 학생 데이터가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="p-4 bg-muted/50">
        <p className="text-sm text-muted-foreground">
          📊 이 통계는 실시간으로 업데이트됩니다. 데이터는 매일 자정에
          갱신됩니다.
        </p>
      </Card>
    </div>
  )
}
