import { useEffect } from "react";

import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStudentStore } from '../../store/studentStore'
import { useAuthStore } from '../../store/authStore'
import { useSparksHandbookStore } from '../../store/sparksHandbookStore'
import { useAttendanceStore } from '../../store/attendanceStore'
import { AttendanceStatus } from '../../models'
import { Club } from '../../constants'
import { SparksHandbook, JewelType } from '../../models/SparksHandbookProgress'
import type { JewelSection } from '../../models/SparksHandbookProgress'
import {
  createSparksAchievementCardFilename,
  downloadPdf,
  generateSparksAchievementCardPdf,
} from '../../lib/pdf/generateSparksAchievementCardPdf'

export function useStudentProgressReport() {
  const navigate = useNavigate()
  const { studentId } = useParams<{ studentId: string }>()
  const { user } = useAuthStore()
  const { students } = useStudentStore()
  const { studentProgresses } = useSparksHandbookStore()
  const { attendanceRecords } = useAttendanceStore()

  const [loading] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState(studentId || '')
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [pdfError, setPdfError] = useState('')

  const student = students?.find((s) => s.id === selectedStudentId)
  const progress = selectedStudentId
    ? studentProgresses.get(selectedStudentId) || []
    : []
  const studentAttendance = attendanceRecords.filter(
    (a) => a.studentId === selectedStudentId,
  )
  const sparksStudents = useMemo(
    () => students?.filter((s) => s.club === Club.SPARKS) || [],
    [students],
  )

  useEffect(() => {
    if (!selectedStudentId && sparksStudents.length > 0) {
      const firstStudent = sparksStudents[0]
      setSelectedStudentId(firstStudent.id)
      navigate(`/reports/student-progress/${firstStudent.id}`, {
        replace: true,
      })
    }
  }, [selectedStudentId, sparksStudents, navigate])

  // 특정 섹션의 완료 날짜 가져오기
  const getSectionDate = (
    handbook: SparksHandbook,
    jewelType: JewelType,
    section: JewelSection,
  ): string => {
    const progressItem = progress.find(
      (p) =>
        p.handbook === handbook &&
        p.jewelType === jewelType &&
        p.section.major === section.major &&
        p.section.minor === section.minor,
    )

    if (progressItem) {
      const date = progressItem.completedDate
      return `${date.getMonth() + 1}/${date.getDate()}`
    }
    return ''
  }

  // 월별 출석 통계 계산
  const getMonthlyAttendance = (month: number) => {
    const monthAttendance = studentAttendance.filter(
      (a) => a.date.getMonth() + 1 === month,
    )
    const presentCount = monthAttendance.filter(
      (a) => a.status === AttendanceStatus.PRESENT,
    ).length
    return presentCount > 0 ? presentCount.toString() : ''
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPdf = async () => {
    if (!student) {
      return
    }

    setIsGeneratingPdf(true)
    setPdfError('')

    try {
      const pdfBytes = await generateSparksAchievementCardPdf({
        student,
        progress,
        attendance: studentAttendance,
        churchName: user?.churchName,
      })

      downloadPdf(pdfBytes, createSparksAchievementCardFilename(student.name))
    } catch (error) {
      console.error('Sparks 성취기록카드 PDF 생성 실패:', error)
      setPdfError(
        error instanceof Error ? error.message : 'PDF 생성에 실패했습니다.',
      )
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const handleStudentChange = (newStudentId: string) => {
    setSelectedStudentId(newStudentId)
    setPdfError('')
    navigate(`/reports/student-progress/${newStudentId}`, { replace: true })
  }

  return {
    loading,
    student,
    sparksStudents,
    selectedStudentId,
    isGeneratingPdf,
    pdfError,
    getSectionDate,
    getMonthlyAttendance,
    handlePrint,
    handleDownloadPdf,
    handleStudentChange,
  }
}
