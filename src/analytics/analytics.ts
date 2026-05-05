// Google Analytics 유틸리티 함수들
declare global {
  interface Window {
    gtag: (
      command: string,
      targetId: string,
      config?: Record<string, unknown>,
    ) => void
    dataLayer: unknown[]
  }
}

// Google Analytics 설정
const GA_MEASUREMENT_ID =
  import.meta.env.VITE_GA_MEASUREMENT_ID || 'GA_MEASUREMENT_ID'

// GA가 로드되었는지 확인
export const isGAReady = (): boolean => {
  return typeof window !== 'undefined' && typeof window.gtag !== 'undefined'
}

// 페이지뷰 추적
export const trackPageView = (
  page_path?: string,
  page_title?: string,
): void => {
  if (!isGAReady()) return

  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: page_path || window.location.pathname,
    page_title: page_title || document.title,
  })
}

// 이벤트 추적
export interface EventParams {
  category: string
  action: string
  label?: string
  value?: number
  customParameters?: Record<string, unknown>
}

// EventParams의 부분 집합을 허용하는 타입
export type PartialEventParams = Partial<
  Omit<EventParams, 'customParameters'>
> & {
  customParameters?: Record<string, unknown>
}

export const trackEvent = (params: PartialEventParams): void => {
  if (!isGAReady()) return

  const { category, action, label, value, customParameters } = params

  const eventParams: Record<string, any> = {
    event_category: category,
    ...customParameters,
  }

  if (label !== undefined) {
    eventParams.event_label = label
  }

  if (value !== undefined) {
    eventParams.value = value
  }

  ;(window as any).gtag('event', action, eventParams)
}

// 사용자 정의 이벤트 추적 헬퍼 함수들
export const trackButtonClick = (buttonName: string, page?: string): void => {
  trackEvent({
    category: 'engagement',
    action: 'button_click',
    label: buttonName,
    customParameters: {
      page: page || window.location.pathname,
    },
  })
}

export const trackFormSubmit = (
  formName: string,
  success: boolean = true,
): void => {
  trackEvent({
    category: 'form',
    action: success ? 'form_submit_success' : 'form_submit_error',
    label: formName,
  })
}

export const trackSearch = (
  searchTerm: string,
  resultsCount?: number,
): void => {
  trackEvent({
    category: 'search',
    action: 'search_performed',
    label: searchTerm,
    value: resultsCount,
  })
}

export const trackConversion = (
  conversionType: string,
  value?: number,
): void => {
  trackEvent({
    category: 'conversion',
    action: 'conversion',
    label: conversionType,
    value: value,
  })
}

// 사용자 속성 설정
export const setUserProperty = (
  name: string,
  value: string | number | boolean,
): void => {
  if (!isGAReady()) return

  window.gtag('config', GA_MEASUREMENT_ID, {
    custom_map: { [name]: value },
  })
}

// E-commerce 이벤트 추적
export interface Product {
  id: string
  name: string
  category?: string
  brand?: string
  price?: number
  quantity?: number
}

export const trackPurchase = (
  transactionId: string,
  products: Product[],
  total: number,
): void => {
  if (!isGAReady()) return

  window.gtag('event', 'purchase', {
    transaction_id: transactionId,
    value: total,
    currency: 'KRW',
    items: products.map((product, index) => ({
      item_id: product.id,
      item_name: product.name,
      item_category: product.category,
      item_brand: product.brand,
      price: product.price,
      quantity: product.quantity || 1,
      index: index,
    })),
  })
}

export const trackAddToCart = (product: Product): void => {
  if (!isGAReady()) return

  window.gtag('event', 'add_to_cart', {
    currency: 'KRW',
    value: product.price,
    items: [
      {
        item_id: product.id,
        item_name: product.name,
        item_category: product.category,
        item_brand: product.brand,
        price: product.price,
        quantity: product.quantity || 1,
      },
    ],
  })
}

// 타이밍 추적
export const trackTiming = (
  category: string,
  variable: string,
  value: number,
  label?: string,
): void => {
  if (!isGAReady()) return

  window.gtag('event', 'timing_complete', {
    name: variable,
    value: value,
    event_category: category,
    event_label: label,
  })
}
