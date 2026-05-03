import { PDFDocument, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import koreanFontUrl from 'noto-sans-kr-font/fonts/NotoSansKR-Regular.woff?url'
import { AttendanceStatus, type Attendance } from '../../models/Attendance'
import type { Student } from '../../models/Student'
import type { JewelSectionProgress } from '../../models/SparksHandbookProgress'
import {
  SPARKS_TEMPLATE_PATH,
  getSparksSectionPosition,
  sparksAttendanceLayout,
  sparksStudentLayout,
} from './sparksAchievementCardLayout'

interface GenerateSparksAchievementCardPdfParams {
  student: Student
  progress: JewelSectionProgress[]
  attendance: Attendance[]
  churchName?: string
}

interface DrawTextParams {
  page: PDFPage
  font: PDFFont
  text: string
  x: number
  y: number
  size?: number
}

const months = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

function getAssetUrl(path: string) {
  const baseUrl = import.meta.env.BASE_URL || '/'
  return `${baseUrl}${path}`
}

async function fetchAssetBytes(path: string) {
  const response = await fetch(getAssetUrl(path))

  if (!response.ok) {
    throw new Error(`${path} 파일을 불러오지 못했습니다.`)
  }

  return response.arrayBuffer()
}

async function fetchUrlBytes(url: string) {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('한글 폰트 파일을 불러오지 못했습니다.')
  }

  return response.arrayBuffer()
}

function formatShortDate(date?: Date) {
  if (!date) {
    return ''
  }

  return `${date.getMonth() + 1}/${date.getDate()}`
}

function formatBirthDate(date?: Date) {
  if (!date) {
    return ''
  }

  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')

  return `${year}/${month}/${day}`
}

function getAttendanceWeek(date: Date) {
  return Math.min(Math.ceil(date.getDate() / 7), 5)
}

function getAttendanceStatusText(status: AttendanceStatus) {
  return status === AttendanceStatus.PRESENT ? 'O' : 'X'
}

function drawText({
  page,
  font,
  text,
  x,
  y,
  size = 7,
}: DrawTextParams) {
  if (!text) {
    return
  }

  page.drawText(text, {
    x,
    y,
    size,
    font,
    color: rgb(0, 0, 0),
  })
}

function drawStudentInfo(
  page: PDFPage,
  font: PDFFont,
  student: Student,
  churchName = ''
) {
  drawText({ page, font, text: student.name, ...sparksStudentLayout.name, size: 8 })
  drawText({ page, font, text: student.gender === 'male' ? 'O' : '', ...sparksStudentLayout.genderMale, size: 8 })
  drawText({ page, font, text: student.gender === 'female' ? 'O' : '', ...sparksStudentLayout.genderFemale, size: 8 })
  drawText({ page, font, text: formatBirthDate(student.birthDate), ...sparksStudentLayout.birthDate, size: 7 })
  drawText({ page, font, text: churchName, ...sparksStudentLayout.churchName, size: 7 })
  drawText({ page, font, text: student.address || '', ...sparksStudentLayout.address, size: 7 })
  drawText({ page, font, text: student.parentName || '', ...sparksStudentLayout.parentName, size: 7 })
  drawText({ page, font, text: student.parentPhone || '', ...sparksStudentLayout.parentPhone, size: 7 })
  drawText({ page, font, text: formatBirthDate(student.createdAt), ...sparksStudentLayout.clubRegisteredDate, size: 7 })
}

function drawAttendance(page: PDFPage, font: PDFFont, attendance: Attendance[]) {
  const latestByMonthWeek = new Map<string, Attendance>()

  attendance.forEach((record) => {
    const month = record.date.getMonth() + 1

    if (!months.includes(month)) {
      return
    }

    const week = getAttendanceWeek(record.date)
    const key = `${month}:${week}`
    const existingRecord = latestByMonthWeek.get(key)

    if (!existingRecord || existingRecord.date < record.date) {
      latestByMonthWeek.set(key, record)
    }
  })

  latestByMonthWeek.forEach((record) => {
    const month = record.date.getMonth() + 1
    const monthIndex = months.indexOf(month)

    if (monthIndex === -1) {
      return
    }

    const week = getAttendanceWeek(record.date)
    const y = sparksAttendanceLayout.startY - (monthIndex * sparksAttendanceLayout.monthGap) - ((week - 1) * sparksAttendanceLayout.weekGap)

    drawText({
      page,
      font,
      text: `${record.date.getDate()}`,
      x: sparksAttendanceLayout.dateX,
      y,
      size: 6,
    })
    drawText({
      page,
      font,
      text: getAttendanceStatusText(record.status),
      x: sparksAttendanceLayout.statusX,
      y,
      size: 6,
    })
  })
}

function drawProgress(page: PDFPage, font: PDFFont, progress: JewelSectionProgress[]) {
  progress.forEach((progressItem) => {
    const position = getSparksSectionPosition(
      progressItem.handbook,
      progressItem.jewelType,
      progressItem.section
    )

    drawText({
      page,
      font,
      text: formatShortDate(progressItem.completedDate),
      x: position.x,
      y: position.y,
      size: 5.8,
    })
  })
}

export async function generateSparksAchievementCardPdf({
  student,
  progress,
  attendance,
  churchName,
}: GenerateSparksAchievementCardPdfParams) {
  const [templateBytes, fontBytes] = await Promise.all([
    fetchAssetBytes(SPARKS_TEMPLATE_PATH),
    fetchUrlBytes(koreanFontUrl),
  ])

  const pdfDoc = await PDFDocument.load(templateBytes)
  pdfDoc.registerFontkit(fontkit)

  const font = await pdfDoc.embedFont(fontBytes)
  const [page] = pdfDoc.getPages()

  if (!page) {
    throw new Error('Sparks 성취기록카드 PDF 페이지를 찾을 수 없습니다.')
  }

  drawStudentInfo(page, font, student, churchName)
  drawAttendance(page, font, attendance)
  drawProgress(page, font, progress)

  return pdfDoc.save()
}

export function downloadPdf(bytes: Uint8Array, filename: string) {
  const arrayBuffer = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(arrayBuffer).set(bytes)

  const blob = new Blob([arrayBuffer], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function createSparksAchievementCardFilename(studentName: string) {
  const safeName = studentName.replace(/[\\/:*?"<>|]/g, '_')
  return `${safeName}_Sparks_성취기록카드.pdf`
}
