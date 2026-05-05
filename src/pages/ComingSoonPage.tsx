import { Construction } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'

interface ComingSoonPageProps {
  title: string
  description?: string
}

export default function ComingSoonPage({
  title,
  description,
}: ComingSoonPageProps) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
      <Card className="p-8 max-w-lg w-full">
        <CardContent className="space-y-6">
          <Construction className="w-16 h-16 mx-auto text-primary" />
          <h1 className="text-3xl font-bold text-primary">{title}</h1>
          <p className="text-muted-foreground">
            {description ||
              '이 기능은 현재 개발 중입니다. 곧 제공될 예정입니다.'}
          </p>
          <Button onClick={() => navigate('/')} className="min-w-[200px]">
            대시보드로 돌아가기
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
