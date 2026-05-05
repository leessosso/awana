import { useState } from 'react'
import {
  DataTable,
  LineChart,
  BarChart,
  PieChart,
  type TableData,
  type LineChartData,
} from '../../components/data-visualization'
import { createColumnHelper } from '@tanstack/react-table'
import { useAnalytics, usePageTracking, useClarity } from '../../analytics'

// 방문자 분석 데이터 인터페이스
interface VisitorData {
  id: string
  date: string
  pageViews: number
  uniqueVisitors: number
  bounceRate: number
  sessionDuration: number
  source: string
}

interface EventData {
  id: string
  eventName: string
  category: string
  count: number
  lastTriggered: string
}

// 데이터 변환 함수들
const convertVisitorDataToChartData = (
  data: VisitorData[],
): LineChartData[] => {
  return data.map((item) => ({
    name: item.date,
    pageViews: item.pageViews,
    uniqueVisitors: item.uniqueVisitors,
    bounceRate: item.bounceRate,
    sessionDuration: item.sessionDuration,
  }))
}

const convertVisitorDataToTableData = (data: VisitorData[]): TableData[] => {
  return data.map((item) => ({
    id: item.id,
    date: item.date,
    pageViews: item.pageViews,
    uniqueVisitors: item.uniqueVisitors,
    bounceRate: item.bounceRate,
    sessionDuration: item.sessionDuration,
    source: item.source,
  }))
}

const convertEventDataToTableData = (data: EventData[]): TableData[] => {
  return data.map((item) => ({
    id: item.id,
    eventName: item.eventName,
    category: item.category,
    count: item.count,
    lastTriggered: item.lastTriggered,
  }))
}

// 샘플 방문자 데이터 (실제로는 GA API에서 가져와야 함)
const generateVisitorData = (): VisitorData[] => {
  const data: VisitorData[] = []
  const sources = ['organic', 'direct', 'social', 'referral', 'paid']

  for (let i = 30; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)

    data.push({
      id: i.toString(),
      date: date.toISOString().split('T')[0],
      pageViews: Math.floor(Math.random() * 500) + 100,
      uniqueVisitors: Math.floor(Math.random() * 300) + 50,
      bounceRate: Math.floor(Math.random() * 40) + 20,
      sessionDuration: Math.floor(Math.random() * 300) + 60,
      source: sources[Math.floor(Math.random() * sources.length)],
    })
  }

  return data
}

// 이벤트 데이터 (Google Analytics + Microsoft Clarity)
const eventData: EventData[] = [
  {
    id: '1',
    eventName: 'page_view',
    category: 'engagement',
    count: 1250,
    lastTriggered: '2024-12-27',
  },
  {
    id: '2',
    eventName: 'button_click',
    category: 'interaction',
    count: 340,
    lastTriggered: '2024-12-27',
  },
  {
    id: '3',
    eventName: 'form_submit',
    category: 'conversion',
    count: 85,
    lastTriggered: '2024-12-26',
  },
  {
    id: '4',
    eventName: 'search',
    category: 'engagement',
    count: 156,
    lastTriggered: '2024-12-27',
  },
  {
    id: '5',
    eventName: 'scroll_threshold_reached',
    category: 'engagement',
    count: 892,
    lastTriggered: '2024-12-27',
  },
  {
    id: '6',
    eventName: 'session_recording',
    category: 'clarity',
    count: 45,
    lastTriggered: '2024-12-27',
  },
  {
    id: '7',
    eventName: 'click_heatmap',
    category: 'clarity',
    count: 1250,
    lastTriggered: '2024-12-27',
  },
]

// 샘플 데이터
// const salesData = [ ... ];

// const categoryData = [
// { name: '의류', value: 25, color: '#00C49F' },
// { name: '식품', value: 20, color: '#FFBB28' },
// { name: '도서', value: 15, color: '#FF8042' },
// { name: '기타', value: 5, color: '#8884d8' },
// ];

// const userData = [
// { id: '1', name: '김철수', email: 'kim@example.com', age: 25, status: '활성', joinDate: '2024-01-15' },
// { id: '2', name: '이영희', email: 'lee@example.com', age: 30, status: '활성', joinDate: '2024-02-20' },
// { id: '3', name: '박민수', email: 'park@example.com', age: 28, status: '비활성', joinDate: '2024-03-10' },
// { id: '4', name: '정수진', email: 'jung@example.com', age: 35, status: '활성', joinDate: '2024-04-05' },
// { id: '5', name: '강한빛', email: 'kang@example.com', age: 22, status: '활성', joinDate: '2024-05-12' },
// ];

// const userColumns = [
//   columnHelper.accessor('name', {
//     header: '이름',
//     cell: (info) => info.getValue(),
//   }),
//   columnHelper.accessor('email', {
//     header: '이메일',
//     cell: (info) => info.getValue(),
//   }),
//   columnHelper.accessor('age', {
//     header: '나이',
//     cell: (info) => info.getValue(),
//   }),
//   columnHelper.accessor('status', {
//     header: '상태',
//     cell: (info) => (
//       <span
//         className={`px-2 py-1 rounded-full text-xs font-medium ${info.getValue() === '활성'
//           ? 'bg-green-100 text-green-800'
//           : 'bg-red-100 text-red-800'
//           }`}
//       >
//         {info.getValue()}
//       </span>
//     ),
//   }),
//   columnHelper.accessor('joinDate', {
//     header: '가입일',
//     cell: (info) => info.getValue(),
//   }),
// ];

export default function AnalyticsPage() {
  const { trackButtonClick } = useAnalytics()
  const { isEnabled: clarityEnabled, isLoaded: clarityLoaded } = useClarity()
  const [visitorData] = useState<VisitorData[]>(generateVisitorData())

  // 페이지뷰 추적
  usePageTracking('Analytics Dashboard')

  // 방문자 데이터 테이블 컬럼 정의
  const visitorColumnHelper = createColumnHelper<TableData>()
  const visitorColumns = [
    visitorColumnHelper.accessor('date', {
      header: '날짜',
      cell: (info) => info.getValue(),
    }),
    visitorColumnHelper.accessor('pageViews', {
      header: '페이지뷰',
      cell: (info) => (info.getValue() as number).toLocaleString(),
    }),
    visitorColumnHelper.accessor('uniqueVisitors', {
      header: '고유 방문자',
      cell: (info) => (info.getValue() as number).toLocaleString(),
    }),
    visitorColumnHelper.accessor('bounceRate', {
      header: '이탈률 (%)',
      cell: (info) => `${info.getValue()}%`,
    }),
    visitorColumnHelper.accessor('sessionDuration', {
      header: '평균 세션 시간 (초)',
      cell: (info) => {
        const value = info.getValue() as number
        return `${Math.floor(value / 60)}분 ${value % 60}초`
      },
    }),
    visitorColumnHelper.accessor('source', {
      header: '소스',
      cell: (info) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            info.getValue() === 'organic'
              ? 'bg-green-100 text-green-800'
              : info.getValue() === 'direct'
                ? 'bg-blue-100 text-blue-800'
                : info.getValue() === 'social'
                  ? 'bg-purple-100 text-purple-800'
                  : info.getValue() === 'referral'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
          }`}
        >
          {info.getValue() as string}
        </span>
      ),
    }),
  ]

  // 이벤트 데이터 테이블 컬럼 정의
  const eventColumnHelper = createColumnHelper<TableData>()
  const eventColumns = [
    eventColumnHelper.accessor('eventName', {
      header: '이벤트 이름',
      cell: (info) => info.getValue(),
    }),
    eventColumnHelper.accessor('category', {
      header: '카테고리',
      cell: (info) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            info.getValue() === 'engagement'
              ? 'bg-blue-100 text-blue-800'
              : info.getValue() === 'interaction'
                ? 'bg-green-100 text-green-800'
                : info.getValue() === 'conversion'
                  ? 'bg-purple-100 text-purple-800'
                  : info.getValue() === 'clarity'
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-gray-100 text-gray-800'
          }`}
        >
          {info.getValue() === 'clarity'
            ? 'Clarity'
            : (info.getValue() as string)}
        </span>
      ),
    }),
    eventColumnHelper.accessor('count', {
      header: '발생 횟수',
      cell: (info) => (info.getValue() as number).toLocaleString(),
    }),
    eventColumnHelper.accessor('lastTriggered', {
      header: '마지막 발생',
      cell: (info) => info.getValue(),
    }),
  ]

  const handleExportData = () => {
    trackButtonClick('export_analytics_data', '/analytics')
    // 데이터 export 로직
    alert('데이터가 성공적으로 내보내졌습니다!')
  }

  const handleRefreshData = () => {
    trackButtonClick('refresh_analytics_data', '/analytics')
    // 데이터 새로고침 로직
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              {/* 분석 도구 상태 표시 */}
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">
                    Google Analytics 4
                  </span>
                  <span className="text-xs text-muted-foreground">
                    (활성화)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${clarityEnabled ? (clarityLoaded ? 'bg-green-500' : 'bg-yellow-500') : 'bg-gray-400'}`}
                  ></div>
                  <span className="text-sm font-medium">Microsoft Clarity</span>
                  <span className="text-xs text-muted-foreground">
                    (
                    {clarityEnabled
                      ? clarityLoaded
                        ? '활성화'
                        : '로딩중'
                      : '설정 필요'}
                    )
                  </span>
                </div>
              </div>

              {/* Clarity 설정 안내 */}
              {!clarityEnabled && (
                <div className="mt-3 p-3 bg-primary/10 border border-primary/30 rounded-lg">
                  <p className="text-sm text-primary">
                    💡 <strong>Microsoft Clarity를 활성화하려면:</strong>
                    <br />
                    1. Microsoft Clarity 계정 생성 → 2. 프로젝트 ID를 .env
                    파일에 추가 → 3. 서버 재시작
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRefreshData}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                데이터 새로고침
              </button>
              <button
                onClick={handleExportData}
                className="px-4 py-2 bg-green-600 text-green-50 rounded-lg hover:bg-green-700 transition-colors"
              >
                데이터 내보내기
              </button>
            </div>
          </div>
        </div>

        {/* 방문자 분석 차트 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* 일별 방문자 추이 */}
          <div className="bg-card rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-card-foreground mb-4">
              일별 방문자 추이
            </h2>
            <LineChart
              data={convertVisitorDataToChartData(visitorData.slice(-14))} // 최근 14일 데이터
              lines={[
                { dataKey: 'pageViews', stroke: '#8884d8', name: '페이지뷰' },
                {
                  dataKey: 'uniqueVisitors',
                  stroke: '#82ca9d',
                  name: '고유 방문자',
                },
              ]}
              height={300}
            />
          </div>

          {/* 트래픽 소스별 비중 */}
          <div className="bg-card rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-card-foreground mb-4">
              트래픽 소스별 비중
            </h2>
            <PieChart
              data={[
                { name: 'Organic', value: 45, color: '#0088FE' },
                { name: 'Direct', value: 25, color: '#00C49F' },
                { name: 'Social', value: 15, color: '#FFBB28' },
                { name: 'Referral', value: 10, color: '#FF8042' },
                { name: 'Paid', value: 5, color: '#8884d8' },
              ]}
              height={300}
            />
          </div>
        </div>

        {/* 세션 분석 바 차트 */}
        <div className="bg-card rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-card-foreground mb-4">
            세션 분석 (최근 7일)
          </h2>
          <BarChart
            data={convertVisitorDataToChartData(visitorData.slice(-7))}
            bars={[
              {
                dataKey: 'sessionDuration',
                fill: '#8884d8',
                name: '평균 세션 시간 (초)',
              },
              { dataKey: 'bounceRate', fill: '#ff6b6b', name: '이탈률 (%)' },
            ]}
            height={400}
          />
        </div>

        {/* 방문자 데이터 테이블 */}
        <div className="bg-card rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">방문자 상세 데이터</h2>
          <DataTable
            data={convertVisitorDataToTableData(visitorData)}
            columns={visitorColumns}
            searchable={true}
            sortable={true}
            paginated={true}
            pageSize={10}
          />
        </div>

        {/* 이벤트 추적 데이터 테이블 */}
        <div className="bg-card rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">이벤트 추적 데이터</h2>
          <DataTable
            data={convertEventDataToTableData(eventData)}
            columns={eventColumns}
            searchable={true}
            sortable={true}
            paginated={true}
            pageSize={5}
          />
        </div>

        {/* 초보자를 위한 사용 설명 */}
        <div className="bg-muted rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            📊 초보자를 위한 분석 가이드
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Google Analytics 설명 */}
            <div className="bg-card rounded-lg p-6">
              <h3 className="text-lg font-semibold text-primary mb-3">
                Google Analytics 4
              </h3>
              <p className="text-muted-foreground mb-4">
                숫자로 웹사이트 성과를 파악하세요
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  ✅ <strong>방문자 수:</strong> 얼마나 많은 사람이 방문했나?
                </li>
                <li>
                  ✅ <strong>트래픽 출처:</strong> 어디서 왔는지 알 수 있어요
                </li>
                <li>
                  ✅ <strong>인기 페이지:</strong> 어떤 페이지가 많이 봐요?
                </li>
                <li>
                  ✅ <strong>시간대별 추이:</strong> 언제 가장 바쁜지 확인
                </li>
              </ul>
              <div className="mt-4">
                <a
                  href="https://analytics.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 font-medium"
                >
                  Google Analytics 바로가기 →
                </a>
              </div>
            </div>

            {/* Microsoft Clarity 설명 */}
            <div className="bg-card rounded-lg p-6">
              <h3 className="text-lg font-semibold text-orange-600 mb-3">
                Microsoft Clarity
              </h3>
              <p className="text-muted-foreground mb-4">
                동영상으로 사용자 행동을 직접 보세요
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  ✅ <strong>세션 녹화:</strong> 사용자가 어떻게 클릭하는지
                  동영상으로
                </li>
                <li>
                  ✅ <strong>히트맵:</strong> 어디를 많이 클릭하는지 색깔로 표시
                </li>
                <li>
                  ✅ <strong>사용자 여정:</strong> 어떤 경로로 이동하는지 추적
                </li>
                <li>
                  ✅ <strong>문제 발견:</strong> 사용자가 어려워하는 부분 찾기
                </li>
              </ul>
              <div className="mt-4">
                <a
                  href="https://clarity.microsoft.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-600 hover:text-orange-700 font-medium"
                >
                  Microsoft Clarity 바로가기 →
                </a>
              </div>
            </div>
          </div>

          {/* 함께 사용하기 팁 */}
          <div className="mt-8 bg-card rounded-lg p-6">
            <h3 className="text-lg font-semibold text-card-foreground mb-3">
              💡 함께 사용하기 팁
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl mb-2">🔍</div>
                <strong>Google Analytics</strong>
                <p className="text-muted-foreground mt-1">
                  "얼마나 많이 방문했나?"
                </p>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">🎬</div>
                <strong>Microsoft Clarity</strong>
                <p className="text-muted-foreground mt-1">"어떻게 행동했나?"</p>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">🚀</div>
                <strong>함께 사용</strong>
                <p className="text-muted-foreground mt-1">
                  "왜 떠났을까?" 답 찾기
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
