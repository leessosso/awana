import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { UserRole } from '../../models/User'

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading, initializeAuth, user } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // 인증 상태 초기화
    initializeAuth()
  }, [initializeAuth])

  // 루트 경로 접근 시 역할에 따른 리다이렉트
  useEffect(() => {
    if (!isLoading && isAuthenticated && user && location.pathname === '/') {
      // 관리자는 게임타임으로, 다른 선생님들은 팀활동점수로
      const redirectPath =
        user.role === UserRole.ADMIN ? '/game-time' : '/team-activity-score'
      navigate(redirectPath, { replace: true })
    }
  }, [isAuthenticated, isLoading, user, location.pathname, navigate])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // 현재 경로를 저장하고 로그인 페이지로 리다이렉트
      const returnUrl =
        location.pathname !== '/'
          ? `?returnUrl=${encodeURIComponent(location.pathname)}`
          : ''
      navigate(`/login${returnUrl}`)
    }
  }, [isAuthenticated, isLoading, navigate, location.pathname])

  // 로딩 중일 때는 로딩 표시
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // 인증되지 않은 경우 null 반환 (useEffect에서 리다이렉트 처리)
  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
