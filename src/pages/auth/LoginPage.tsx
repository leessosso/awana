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
    const normalizedLoginId = loginId.trim();
    if (!normalizedLoginId) {
      return;
    }
    try {
      await signIn(normalizedLoginId, password);
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
          <CardDescription>선생님은 이름, 관리자는 이메일로 로그인하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <Alert>
              <AlertDescription className="text-sm">
                선생님 신규 계정은 <span className="font-medium">초기 비밀번호 123456</span>으로 로그인한 뒤,
                설정에서 바로 비밀번호를 변경해주세요.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <label htmlFor="loginId" className="text-sm font-medium">
                로그인 아이디
              </label>
              <Input
                id="loginId"
                type="text"
                placeholder="선생님 이름 또는 이메일"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                disabled={isLoading}
                required
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                선생님 계정은 등록된 이름으로 로그인합니다.
              </p>
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
              disabled={isLoading || !loginId.trim() || !password}
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

            <p className="text-center text-xs text-muted-foreground">
              로그인 문제가 있으면 관리자에게 이름 표기(예: 김민수A)와 초기 비밀번호를 확인하세요.
            </p>

            <details className="rounded-md border px-3 py-2 text-sm">
              <summary className="cursor-pointer font-medium">
                자주 묻는 로그인 오류
              </summary>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                <li>이름 앞뒤 공백은 자동 제거됩니다.</li>
                <li>동명이인은 등록된 이름 그대로 입력하세요. (예: 김민수A)</li>
                <li>초기 비밀번호는 123456입니다.</li>
                <li>로그인 후 설정에서 비밀번호를 변경하세요.</li>
                <li>실패 시 관리자에게 이름 표기 확인을 요청하세요.</li>
              </ul>
            </details>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
