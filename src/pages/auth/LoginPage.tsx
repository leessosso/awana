import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../models/User';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Alert, AlertDescription } from '../../components/ui/Alert';

export default function LoginPage() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { signIn, isLoading, error, clearError, user, isAuthenticated } = useAuthStore();

  // 로그인 성공 후 역할에 따른 리다이렉트
  useEffect(() => {
    if (isAuthenticated && user) {
      // 관리자는 대시보드로, 다른 선생님들은 핸드북으로
      const redirectPath = user.role === UserRole.ADMIN ? '/dashboard' : '/handbook';
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await signIn(loginId, password);
      // 리다이렉트는 useEffect에서 처리됨
    } catch {
      // 에러는 store에서 처리됨
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">AWANA LMS</CardTitle>
          <CardDescription>로그인하여 시작하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="loginId" className="text-sm font-medium">
                이름
              </label>
              <Input
                id="loginId"
                type="text"
                placeholder="이름을 입력하세요 (예: 김민수A)"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                disabled={isLoading}
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                비밀번호
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="비밀번호를 입력하세요"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription className="flex items-center justify-between">
                  <span>{error}</span>
                  <button
                    onClick={clearError}
                    className="ml-4 text-sm underline"
                  >
                    닫기
                  </button>
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !loginId || !password}
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </Button>

            <div className="text-center text-sm">
              <Link
                to="/signup"
                className="text-primary hover:underline"
              >
                계정이 없으신가요? 회원가입
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
