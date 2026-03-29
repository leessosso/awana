import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Menu as MenuIcon, Moon, Sun, ArrowRight } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useTheme } from '../../contexts/ThemeContext'
import { Avatar, AvatarFallback } from '../ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Button } from '../ui/Button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../ui/sheet'

const navItems = [
  { to: '/dashboard', label: '대시보드' },
  { to: '/attendance', label: '출석 관리' },
  { to: '/handbook', label: '핸드북' },
  { to: '/students', label: '학생 관리' },
  { to: '/game-time', label: '게임시간' },
  { to: '/reports', label: '보고서' },
]

export function Navigation() {
  const { user, signOut } = useAuthStore()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = async () => {
    await signOut()
    setIsOpen(false)
  }

  const handleNavClick = () => {
    setIsOpen(false)
  }

  // 사용자 이름의 첫 글자로 아바타 초기 설정
  const getInitials = (name?: string) => {
    if (!name) return 'U'
    return name.charAt(0).toUpperCase()
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/5 bg-background/90 backdrop-blur">
        <div className="container-section flex h-16 items-center justify-between">
          <NavLink to="/handbook" className="text-lg font-semibold text-foreground">
            AWANA LMS
          </NavLink>

          {/* 데스크톱 네비게이션 */}
          <nav className="hidden gap-6 text-sm font-medium text-muted-foreground md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    'transition-colors hover:text-foreground py-2 px-3 rounded-md',
                    isActive ? 'text-foreground bg-muted' : undefined,
                  ]
                    .filter(Boolean)
                    .join(' ')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* 데스크톱 사용자 메뉴 - 아바타 + 이름 */}
          <div className="hidden items-center gap-4 md:flex">
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {getInitials(user?.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <div className="text-sm font-medium text-foreground">
                      {user?.displayName}님
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {user?.churchName}
                    </div>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.loginId || user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  프로필
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  설정
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleTheme}>
                  <div className="flex items-center gap-2 w-full">
                    <span>테마</span>
                    <div className="flex items-center gap-1.5 ml-auto">
                      {theme === 'dark' ? (
                        <>
                          <Moon className="h-4 w-4" />
                          <ArrowRight className="h-3 w-3" />
                          <Sun className="h-4 w-4" />
                        </>
                      ) : (
                        <>
                          <Sun className="h-4 w-4" />
                          <ArrowRight className="h-3 w-3" />
                          <Moon className="h-4 w-4" />
                        </>
                      )}
                    </div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* 모바일 햄버거 메뉴 */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="메뉴 열기"
              >
                <MenuIcon className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
              <SheetHeader>
                <SheetTitle>메뉴</SheetTitle>
              </SheetHeader>

              {/* 사용자 정보 */}
              {user && (
                <div className="mt-6 mb-4">
                  <div className="flex items-center gap-3 px-2 py-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(user.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium">{user.displayName}님</div>
                      <div className="text-xs text-muted-foreground">{user.churchName}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* 네비게이션 메뉴 */}
              <nav className="flex flex-col gap-1 mt-4">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      [
                        'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      ]
                        .filter(Boolean)
                        .join(' ')
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>

              {/* 계정 메뉴 */}
              {user && (
                <>
                  <div className="mt-6 pt-6 border-t">
                    <nav className="flex flex-col gap-1">
                      <button
                        onClick={() => {
                          navigate('/settings')
                          handleNavClick()
                        }}
                        className="px-3 py-2 rounded-md text-sm font-medium text-left text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        프로필
                      </button>
                      <button
                        onClick={() => {
                          navigate('/settings')
                          handleNavClick()
                        }}
                        className="px-3 py-2 rounded-md text-sm font-medium text-left text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        설정
                      </button>
                      <button
                        onClick={toggleTheme}
                        className="px-3 py-2 rounded-md text-sm font-medium text-left text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex items-center gap-2 justify-between w-full"
                      >
                        <span>테마</span>
                        <div className="flex items-center gap-1.5">
                          {theme === 'dark' ? (
                            <>
                              <Moon className="h-4 w-4" />
                              <ArrowRight className="h-3 w-3" />
                              <Sun className="h-4 w-4" />
                            </>
                          ) : (
                            <>
                              <Sun className="h-4 w-4" />
                              <ArrowRight className="h-3 w-3" />
                              <Moon className="h-4 w-4" />
                            </>
                          )}
                        </div>
                      </button>
                      <button
                        onClick={handleLogout}
                        className="px-3 py-2 rounded-md text-sm font-medium text-left text-destructive hover:bg-muted transition-colors"
                      >
                        로그아웃
                      </button>
                    </nav>
                  </div>
                </>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </header>
    </>
  )
}
