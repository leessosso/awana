import { useEffect, useCallback } from 'react'
import {
  trackPageView,
  trackEvent,
  trackButtonClick,
  trackFormSubmit,
  trackSearch,
  trackConversion,
  setUserProperty,
  trackPurchase,
  trackAddToCart,
  trackTiming,
  isGAReady,
} from './index'
import type { PartialEventParams, Product } from './index'

// 페이지뷰 자동 추적을 위한 hook
export const usePageTracking = (pageTitle?: string) => {
  useEffect(() => {
    // 컴포넌트가 마운트될 때 페이지뷰 추적
    trackPageView(window.location.pathname, pageTitle)

    // 페이지 타이틀 변경 감지 및 추적
    const originalTitle = document.title
    if (pageTitle && pageTitle !== originalTitle) {
      document.title = pageTitle
    }

    return () => {
      // cleanup: 원래 타이틀로 복원
      if (pageTitle && pageTitle !== originalTitle) {
        document.title = originalTitle
      }
    }
  }, [pageTitle])
}

// 이벤트 추적을 위한 hook
export const useAnalytics = () => {
  const trackCustomEvent = useCallback((params: PartialEventParams) => {
    trackEvent(params)
  }, [])

  const trackButton = useCallback((buttonName: string, page?: string) => {
    trackButtonClick(buttonName, page)
  }, [])

  const trackForm = useCallback((formName: string, success: boolean = true) => {
    trackFormSubmit(formName, success)
  }, [])

  const trackSearchQuery = useCallback(
    (searchTerm: string, resultsCount?: number) => {
      trackSearch(searchTerm, resultsCount)
    },
    [],
  )

  const trackConversionEvent = useCallback(
    (conversionType: string, value?: number) => {
      trackConversion(conversionType, value)
    },
    [],
  )

  const setUserProp = useCallback(
    (name: string, value: string | number | boolean) => {
      setUserProperty(name, value)
    },
    [],
  )

  const trackPurchaseEvent = useCallback(
    (transactionId: string, products: Product[], total: number) => {
      trackPurchase(transactionId, products, total)
    },
    [],
  )

  const trackCartAddition = useCallback((product: Product) => {
    trackAddToCart(product)
  }, [])

  const trackTime = useCallback(
    (category: string, variable: string, value: number, label?: string) => {
      trackTiming(category, variable, value, label)
    },
    [],
  )

  return {
    trackEvent: trackCustomEvent,
    trackButtonClick: trackButton,
    trackFormSubmit: trackForm,
    trackSearch: trackSearchQuery,
    trackConversion: trackConversionEvent,
    setUserProperty: setUserProp,
    trackPurchase: trackPurchaseEvent,
    trackAddToCart: trackCartAddition,
    trackTiming: trackTime,
    isGAReady,
  }
}

// 버튼 클릭 추적을 위한 hook
export const useTrackButtonClick = (buttonName: string, page?: string) => {
  const { trackButtonClick } = useAnalytics()

  const handleClick = useCallback(() => {
    trackButtonClick(buttonName, page)
    // 원래 이벤트 핸들러가 있다면 그대로 실행
  }, [trackButtonClick, buttonName, page])

  return handleClick
}

// 폼 제출 추적을 위한 hook
export const useTrackFormSubmit = (formName: string) => {
  const { trackFormSubmit } = useAnalytics()

  const handleSubmit = useCallback(
    (success: boolean = true) => {
      trackFormSubmit(formName, success)
    },
    [trackFormSubmit, formName],
  )

  return handleSubmit
}

// 검색 추적을 위한 hook
export const useTrackSearch = () => {
  const { trackSearch } = useAnalytics()

  const handleSearch = useCallback(
    (searchTerm: string, resultsCount?: number) => {
      trackSearch(searchTerm, resultsCount)
    },
    [trackSearch],
  )

  return handleSearch
}

// 전환 추적을 위한 hook
export const useTrackConversion = (conversionType: string) => {
  const { trackConversion } = useAnalytics()

  const handleConversion = useCallback(
    (value?: number) => {
      trackConversion(conversionType, value)
    },
    [trackConversion, conversionType],
  )

  return handleConversion
}
