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
import TeamActivityScorePage from '../pages/team-activity/TeamActivityScorePage'
import SettingsPage from '../pages/SettingsPage'
import NotFoundPage from '../pages/NotFoundPage'

const basePath = import.meta.env.VITE_BASE_PATH || '/'

export const router = createBrowserRouter([
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
    children: [
      {
        index: true,
        element: <HandbookPage />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
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
      },
      {
        path: 'attendance',
        element: <AttendancePage />,
      },
      {
        path: 'handbook',
        element: <HandbookPage />,
      },
      {
        path: 'handbook/:studentId',
        element: <StudentHandbookDetailPage />,
      },
      {
        path: 'reports',
        element: <ReportsPage />,
      },
      {
        path: 'reports/student-progress',
        element: <StudentProgressReportPage />,
      },
      {
        path: 'reports/student-progress/:studentId',
        element: <StudentProgressReportPage />,
      },
      {
        path: 'reports/church-statistics',
        element: <ChurchStatisticsPage />,
      },
      {
        path: 'game-time',
        element: <GameTimePage />,
      },
      {
        path: 'team-activity-score',
        element: <TeamActivityScorePage />,
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
], {
  basename: basePath.endsWith('/') ? basePath.slice(0, -1) : basePath,
})

