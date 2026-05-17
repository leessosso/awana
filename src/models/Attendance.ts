export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
}

export interface Attendance {
  id: string
  studentId: string
  date: Date
  status: AttendanceStatus
  notes?: string
  checkedBy: string
  churchId: string
}

export interface AttendanceFormData {
  studentId: string
  date: Date
  status: AttendanceStatus
  notes?: string
  studentName?: string
  teacherId?: string
  teacherName?: string
}
