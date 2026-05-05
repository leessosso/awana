// Microsoft Clarity 분석 도구 Provider
export class ClarityProvider {
  // Clarity가 활성화되어 있는지 확인
  isEnabled(): boolean {
    // 일시적으로 Clarity 비활성화
    return false
  }

  // Clarity가 로드되었는지 확인
  isLoaded(): boolean {
    return typeof window !== 'undefined' && !!(window as any).clarity
  }

  // 이벤트 추적 (Clarity는 제한된 이벤트만 지원)
  trackEvent(eventName: string, properties?: Record<string, any>): void {
    if (!this.isEnabled() || !this.isLoaded()) return

    try {
      ;(window as any).clarity('event', eventName, properties)
    } catch (error) {
      console.warn('Clarity event tracking failed:', error)
    }
  }

  // 페이지뷰 추적 (Clarity는 자동으로 추적하므로 수동 추적은 제한적)
  trackPageView(pagePath?: string): void {
    if (!this.isEnabled()) return

    // Clarity는 기본적으로 자동 페이지뷰 추적을 하므로
    // 특별한 페이지뷰 이벤트가 필요할 때만 사용
    if (pagePath) {
      this.trackEvent('page_view', { page_path: pagePath })
    }
  }

  // 사용자 식별 (선택사항)
  identify(userId: string, properties?: Record<string, any>): void {
    if (!this.isEnabled() || !this.isLoaded()) return

    try {
      ;(window as any).clarity('identify', userId, properties)
    } catch (error) {
      console.warn('Clarity user identification failed:', error)
    }
  }

  // 사용자 속성 설정
  setUserProperty(key: string, value: string | number | boolean): void {
    if (!this.isEnabled() || !this.isLoaded()) return

    try {
      ;(window as any).clarity('set', key, value)
    } catch (error) {
      console.warn('Clarity user property setting failed:', error)
    }
  }
}

// 글로벌 타입 확장
declare global {
  interface Window {
    clarity: (command: string, ...args: unknown[]) => void
  }
}
