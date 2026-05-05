import { useState, useEffect } from 'react'

/**
 * 모바일 기기 감지 훅
 * @param breakpoint - 모바일로 간주할 최대 너비 (기본값: 768px)
 * @returns 모바일 여부
 */
export function useMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      // SSR 환경 고려 및 더 정확한 모바일 감지
      const width =
        window.innerWidth ||
        document.documentElement.clientWidth ||
        document.body.clientWidth
      setIsMobile(width < breakpoint)
    }

    // 초기 실행
    checkMobile()

    // resize 및 orientationchange 이벤트 리스너
    window.addEventListener('resize', checkMobile)
    window.addEventListener('orientationchange', checkMobile)

    return () => {
      window.removeEventListener('resize', checkMobile)
      window.removeEventListener('orientationchange', checkMobile)
    }
  }, [breakpoint])

  return isMobile
}
