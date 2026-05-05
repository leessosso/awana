import { useCallback, useEffect, useState } from 'react'
import { ClarityProvider } from './providers/ClarityProvider'

// Clarity Provider 인스턴스 생성
const clarityProvider = new ClarityProvider()

// Microsoft Clarity를 위한 React hooks
export const useClarity = () => {
  const [isLoaded, setIsLoaded] = useState(false)

  // Clarity 로드 상태 확인
  useEffect(() => {
    const checkClarityLoaded = () => {
      if (clarityProvider.isLoaded()) {
        setIsLoaded(true)
      }
    }

    // 초기 체크
    checkClarityLoaded()

    // 주기적으로 체크 (스크립트 로딩 대기)
    const interval = setInterval(checkClarityLoaded, 100)
    const timeout = setTimeout(() => clearInterval(interval), 10000) // 10초 후 중단

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [])

  // 이벤트 추적
  const trackEvent = useCallback(
    (eventName: string, properties?: Record<string, unknown>) => {
      if (clarityProvider.isEnabled()) {
        clarityProvider.trackEvent(eventName, properties)
      }
    },
    [],
  )

  // 페이지뷰 추적
  const trackPageView = useCallback((pagePath?: string) => {
    clarityProvider.trackPageView(pagePath)
  }, [])

  // 사용자 식별
  const identify = useCallback(
    (userId: string, properties?: Record<string, unknown>) => {
      if (clarityProvider.isEnabled()) {
        clarityProvider.identify(userId, properties)
      }
    },
    [],
  )

  // 사용자 속성 설정
  const setUserProperty = useCallback(
    (key: string, value: string | number | boolean) => {
      clarityProvider.setUserProperty(key, value)
    },
    [],
  )

  return {
    isEnabled: clarityProvider.isEnabled(),
    isLoaded,
    trackEvent,
    trackPageView,
    identify,
    setUserProperty,
  }
}

// 특정 이벤트 추적을 위한 특화 hooks
export const useTrackClarityEvent = (eventName: string) => {
  const { trackEvent } = useClarity()

  const track = useCallback(
    (properties?: Record<string, any>) => {
      trackEvent(eventName, properties)
    },
    [trackEvent, eventName],
  )

  return track
}

// 버튼 클릭 추적을 위한 hook
export const useTrackClarityClick = (buttonName: string) => {
  const trackClick = useTrackClarityEvent('button_click')

  const handleClick = useCallback(() => {
    if (clarityProvider.isEnabled()) {
      trackClick({
        button_name: buttonName,
        page_url: window.location.href,
        timestamp: new Date().toISOString(),
      })
    }
  }, [trackClick, buttonName])

  return handleClick
}

// 폼 제출 추적을 위한 hook
export const useTrackClarityFormSubmit = (formName: string) => {
  const trackSubmit = useTrackClarityEvent('form_submit')

  const handleSubmit = useCallback(
    (success: boolean = true) => {
      trackSubmit({
        form_name: formName,
        success,
        page_url: window.location.href,
        timestamp: new Date().toISOString(),
      })
    },
    [trackSubmit, formName],
  )

  return handleSubmit
}

// 스크롤 추적을 위한 hook
export const useTrackClarityScroll = (threshold: number = 50) => {
  const { trackEvent } = useClarity()

  useEffect(() => {
    let hasTracked = false

    const handleScroll = () => {
      if (hasTracked) return

      const scrolled =
        (window.scrollY /
          (document.documentElement.scrollHeight - window.innerHeight)) *
        100

      if (scrolled >= threshold) {
        trackEvent('scroll_threshold_reached', {
          threshold,
          scroll_percentage: Math.round(scrolled),
          page_url: window.location.href,
        })
        hasTracked = true
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [trackEvent, threshold])
}
