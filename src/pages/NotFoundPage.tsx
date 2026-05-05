import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Home, ArrowLeft } from 'lucide-react'

function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-9xl font-bold text-muted-foreground/20">404</h1>
          <h2 className="text-2xl font-semibold text-foreground">
            페이지를 찾을 수 없습니다
          </h2>
          <p className="text-muted-foreground max-w-md">
            요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다. 올바른
            URL을 확인하시거나 메인 페이지로 돌아가세요.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link to="/" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              메인 페이지로
            </Link>
          </Button>
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            이전 페이지로
          </Button>
        </div>

        <div className="pt-8">
          <p className="text-sm text-muted-foreground">
            문제가 지속되면 관리자에게 문의해주세요.
          </p>
        </div>
      </div>
    </div>
  )
}

export default NotFoundPage
