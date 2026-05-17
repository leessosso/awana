import { createBrowserRouter } from 'react-router-dom'

import App from '../App'
import { PortfolioPage } from '../templates/portfolio/PortfolioPage'
import { ProductPage } from '../templates/product/ProductPage'
import { ServicePage } from '../templates/service/ServicePage'
import AnalyticsPage from '../templates/analytics/AnalyticsPage'
import LoginPage from '../pages/auth/LoginPage'
import SignUpPage from '../pages/auth/SignUpPage'
import DashboardPage from '../pages/DashboardPage'
import StudentsPage from '../pages/students/StudentsPage'
import AttendancePage from '../pages/attendance/AttendancePage'
import HandbookPage from '../pages/handbook/HandbookPage'
import StudentHandbookDetailPage from '../pages/handbook/StudentHandbookDetailPage'
import ReportsPage from '../pages/reports/ReportsPage'
import StudentProgressReportPage from '../pages/reports/StudentProgressReportPage'
import ChurchStatisticsPage from '../pages/reports/ChurchStatisticsPage'
import GameTimePage from '../pages/game-time/GameTimePage'
import GameTimeRevealPage from '../pages/game-time/GameTimeRevealPage'
import TeamActivityScorePage from '../pages/team-activity/TeamActivityScorePage'
import SettingsPage from '../pages/SettingsPage'
import NotFoundPage from '../pages/NotFoundPage'
import ErrorPage from '../pages/ErrorPage'

import {
  studentsLoader,
  dashboardLoader,
  attendanceLoader,
  gameTimeLoader,
  teamActivityScoreLoader,
  studentProgressReportLoader,
  churchStatisticsLoader,
  studentHandbookDetailLoader,
  handbookLoader,
  gameTimeRevealLoader
} from '../loaders'

const basePath = import.meta.env.VITE_BASE_PATH || (import.meta.env.DEV ? '/' : '/awana/')

export const router = createBrowserRouter(
  [
    {
      path: '/login',
      element: <LoginPage />,
    },
    {
      path: '/signup',
      element: <SignUpPage />,
    },
    {
      path: '/',
      element: <App />,
      errorElement: <ErrorPage />,
      children: [
        {
          index: true,
          element: <TeamActivityScorePage />,
          loader: teamActivityScoreLoader,
        },
        {
          path: 'dashboard',
          element: <DashboardPage />,
          loader: dashboardLoader,
        },
        {
          path: 'service',
          element: <ServicePage />,
        },
        {
          path: 'product',
          element: <ProductPage />,
        },
        {
          path: 'portfolio',
          element: <PortfolioPage />,
        },
        {
          path: 'analytics',
          element: <AnalyticsPage />,
        },
        {
          path: 'students',
          element: <StudentsPage />,
          loader: studentsLoader,
        },
        {
          path: 'attendance',
          element: <AttendancePage />,
          loader: attendanceLoader,
        },
        {
          path: 'handbook',
          element: <HandbookPage />,
          loader: handbookLoader,
        },
        {
          path: 'handbook/:studentId',
          element: <StudentHandbookDetailPage />,
          loader: studentHandbookDetailLoader,
        },
        {
          path: 'reports',
          element: <ReportsPage />,
        },
        {
          path: 'reports/student-progress',
          element: <StudentProgressReportPage />,
          loader: studentProgressReportLoader,
        },
        {
          path: 'reports/student-progress/:studentId',
          element: <StudentProgressReportPage />,
          loader: studentProgressReportLoader,
        },
        {
          path: 'reports/church-statistics',
          element: <ChurchStatisticsPage />,
          loader: churchStatisticsLoader,
        },
        {
          path: 'game-time',
          element: <GameTimePage />,
          loader: gameTimeLoader,
        },
        {
          path: 'game-time/reveal',
          element: <GameTimeRevealPage />,
          loader: gameTimeRevealLoader,
        },
        {
          path: 'team-activity-score',
          element: <TeamActivityScorePage />,
          loader: teamActivityScoreLoader,
        },
        {
          path: 'settings',
          element: <SettingsPage />,
        },
        {
          path: '*',
          element: <NotFoundPage />,
        },
      ],
    },
  ],
  {
    basename: basePath.endsWith('/') ? basePath.slice(0, -1) : basePath,
  },
)
