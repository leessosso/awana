import React, { useState } from 'react'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Alert, AlertDescription } from '../ui/Alert'
import { useTrackFormSubmit, useTrackClarityFormSubmit } from '../../analytics'

interface ContactFormData {
  name: string
  email: string
  company?: string
  message: string
}

interface ContactFormProps {
  onSubmit?: (data: ContactFormData) => Promise<void>
  className?: string
}

export function ContactForm({ onSubmit, className = '' }: ContactFormProps) {
  const trackFormSubmit = useTrackFormSubmit('contact_form')
  const trackClarityFormSubmit = useTrackClarityFormSubmit('contact_form')
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    company: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [alert, setAlert] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setAlert(null)

    try {
      if (onSubmit) {
        await onSubmit(formData)
        setAlert({
          type: 'success',
          message: '문의가 성공적으로 전송되었습니다. 곧 연락드리겠습니다.',
        })
        setFormData({ name: '', email: '', company: '', message: '' })
        // Google Analytics: 폼 제출 성공 추적
        trackFormSubmit(true)
        // Microsoft Clarity: 폼 제출 성공 추적
        trackClarityFormSubmit(true)
      }
    } catch {
      setAlert({
        type: 'error',
        message: '문의 전송 중 오류가 발생했습니다. 다시 시도해주세요.',
      })
      // Google Analytics: 폼 제출 실패 추적
      trackFormSubmit(false)
      // Microsoft Clarity: 폼 제출 실패 추적
      trackClarityFormSubmit(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {alert && (
        <Alert
          variant={alert.type === 'error' ? 'destructive' : 'default'}
          className="mb-4"
        >
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">이름</label>
          <Input
            name="name"
            type="text"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="이름을 입력하세요"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">이메일</label>
          <Input
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="이메일을 입력하세요"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          회사명 (선택사항)
        </label>
        <Input
          name="company"
          type="text"
          value={formData.company}
          onChange={handleChange}
          placeholder="회사명을 입력하세요"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          문의사항
        </label>
        <textarea
          name="message"
          required
          rows={5}
          value={formData.message}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="문의사항을 자세히 작성해주세요"
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? '전송 중...' : '문의 보내기'}
      </Button>
    </form>
  )
}
