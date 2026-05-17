import { Club } from '../constants'

export interface HandbookProgress {
  id: string
  studentId: string
  handbookId: string
  club: Club
  unitNumber: number
  unitTitle: string
  completedDate: Date
  completedBy: string
  notes?: string
  churchId: string
}

export interface HandbookProgressFormData {
  studentId: string
  handbookId: string
  club: Club
  unitNumber: number
  unitTitle: string
  notes?: string
}
