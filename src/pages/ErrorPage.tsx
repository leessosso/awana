import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'
import { Button } from '../components/ui/Button'

function ErrorPage() {
  const error = useRouteError()

  let title = '오류가 발생했습니다'
  let message = '예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = '페이지를 찾을 수 없습니다'
      message = '요청하신 페이지가 존재하지 않습니다.'
    } else if (error.status === 403) {
      title = '접근 권한이 없습니다'
      message = '이 페이지에 접근할 권한이 없습니다.'
    } else {
      message = error.statusText || message
    }
  } else if (error instanceof Error) {
    if (error.message.includes('Missing or insufficient permissions')) {
      title = '데이터 접근 오류'
      message =
        '데이터에 접근할 권한이 없습니다. 다시 로그인해 주세요.'
    } else {
      message = error.message
    }
  }

  const handleReload = () => {
    window.location.reload()
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
          <p className="text-muted-foreground">{message}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link to="/" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              홈으로
            </Link>
          </Button>
          <Button variant="outline" onClick={handleReload}>
            <RefreshCw className="mr-2 h-4 w-4" />
            새로고침
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          문제가 지속되면 관리자에게 문의해주세요.
        </p>
      </div>
    </div>
  )
}

export default ErrorPage
