import { useTheme } from '../../contexts/ThemeContext'
import type { Theme, ThemeColor } from '../../contexts/ThemeContext'

const themeOptions: { value: Theme; label: string; icon: string }[] = [
  { value: 'light', label: '라이트', icon: '☀️' },
  { value: 'dark', label: '다크', icon: '🌙' },
]

const colorOptions: { value: ThemeColor; label: string; color: string }[] = [
  { value: 'blue', label: '블루', color: '#3b82f6' },
  { value: 'green', label: '그린', color: '#22c55e' },
  { value: 'purple', label: '퍼플', color: '#9333ea' },
  { value: 'orange', label: '오렌지', color: '#f97316' },
  { value: 'rose', label: '로즈', color: '#f43f5e' },
  { value: 'emerald', label: '에메랄드', color: '#10b981' },
  { value: 'red', label: '레드', color: '#dc2626' },
  { value: 'indigo', label: '인디고', color: '#4f46e5' },
]

export function ThemeSelector() {
  const { theme, themeColor, setTheme, setThemeColor } = useTheme()

  return (
    <div className="flex flex-col gap-4 p-4 bg-card border border-border rounded-lg">
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">테마 모드</h3>
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground">
            {themeOptions.find((t) => t.value === 'light')?.icon}
          </span>
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              theme === 'dark' ? 'bg-primary' : 'bg-muted'
            }`}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-muted-foreground">
            {themeOptions.find((t) => t.value === 'dark')?.icon}
          </span>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          {themeOptions.find((t) => t.value === theme)?.label} 모드
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">색상 테마</h3>
        <div className="flex gap-2 flex-wrap">
          {colorOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setThemeColor(option.value)}
              className={`w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                themeColor === option.value
                  ? 'border-primary scale-110 ring-2 ring-primary/20'
                  : 'border-border hover:scale-105 hover:border-primary/50'
              }`}
              style={{ backgroundColor: option.color }}
              title={option.label}
            />
          ))}
        </div>
      </div>

      <div className="text-xs text-muted-foreground pt-2 border-t border-border">
        색상 테마: {colorOptions.find((c) => c.value === themeColor)?.label}
      </div>
    </div>
  )
}
