import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../config/firebase'
import { AttendanceStatus } from '../models/Attendance'
import type { Attendance, AttendanceFormData } from '../models/Attendance'

// Firestore 문서 타입 정의 (주석 처리 - 현재 사용하지 않음)
// interface AttendanceDocument {
//   studentId: string;
//   date: Timestamp;
//   status: AttendanceStatus;
//   notes?: string;
//   checkedBy: string;
//   churchId: string;
// }

export async function createAttendance(
    attendanceData: AttendanceFormData,
    checkedBy: string,
    churchId: string,
  ): Promise<Attendance> {
    if (!isFirebaseConfigured() || !db) {
      throw new Error(
        'Firebase가 설정되지 않았습니다. Firebase 프로젝트를 설정해주세요.',
      )
    }

    try {
      const docRef = await addDoc(collection(db, 'attendance'), {
        ...attendanceData,
        date: Timestamp.fromDate(attendanceData.date),
        checkedBy,
        churchId,
      })

      const attendance: Attendance = {
        id: docRef.id,
        ...attendanceData,
        date: attendanceData.date,
        checkedBy,
        churchId,
      }

      return attendance
    } catch (error) {
      console.error('출결 등록 실패:', error)
      throw error
    }
  }

export async function updateAttendance(
    attendanceId: string,
    attendanceData: Partial<AttendanceFormData>,
  ): Promise<void> {
    if (!isFirebaseConfigured() || !db) {
      throw new Error(
        'Firebase가 설정되지 않았습니다. Firebase 프로젝트를 설정해주세요.',
      )
    }

    try {
      // Firestore에 저장할 데이터 생성 (undefined 값들은 제외)
      const updateData: any = {}

      // 필드별로 undefined가 아닌 경우만 추가
      if (attendanceData.studentId !== undefined) {
        updateData.studentId = attendanceData.studentId
      }
      if (attendanceData.date !== undefined) {
        updateData.date = attendanceData.date
          ? Timestamp.fromDate(attendanceData.date)
          : null
      }
      if (attendanceData.status !== undefined) {
        updateData.status = attendanceData.status
      }
      if (attendanceData.notes !== undefined) {
        updateData.notes = attendanceData.notes
      }

      await updateDoc(doc(db, 'attendance', attendanceId), updateData)
    } catch (error) {
      console.error('출결 정보 수정 실패:', error)
      throw error
    }
  }

export async function deleteAttendance(attendanceId: string): Promise<void> {
    if (!isFirebaseConfigured() || !db) {
      throw new Error(
        'Firebase가 설정되지 않았습니다. Firebase 프로젝트를 설정해주세요.',
      )
    }

    try {
      await deleteDoc(doc(db, 'attendance', attendanceId))
    } catch (error) {
      console.error('출결 삭제 실패:', error)
      throw error
    }
  }

export async function getAttendanceByStudent(
    studentId: string,
    churchId: string,
  ): Promise<Attendance[]> {
    if (!isFirebaseConfigured() || !db) {
      return []
    }

    try {
      const q = query(
        collection(db, 'attendance'),
        where('studentId', '==', studentId),
        where('churchId', '==', churchId),
      )
      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          date:
            data.date instanceof Timestamp
              ? data.date.toDate()
              : new Date(data.date),
        } as Attendance
      })
    } catch (error) {
      console.error('출결 목록 가져오기 실패:', error)
      throw error
    }
  }

export async function getAttendanceByDate(
    date: Date,
    churchId: string,
  ): Promise<Attendance[]> {
    if (!isFirebaseConfigured() || !db) {
      return []
    }

    try {
      // 먼저 해당 교회의 모든 출결 데이터를 가져옴 (단일 필드 쿼리만 사용)
      const q = query(
        collection(db, 'attendance'),
        where('churchId', '==', churchId),
      )
      const querySnapshot = await getDocs(q)

      const targetDateStr = date.toISOString().split('T')[0] // YYYY-MM-DD 형식

      // 클라이언트 측에서 날짜 필터링
      return querySnapshot.docs
        .map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            date:
              data.date instanceof Timestamp
                ? data.date.toDate()
                : new Date(data.date),
          } as Attendance
        })
        .filter((attendance) => {
          // 날짜가 같은지 비교
          const attendanceDateStr = attendance.date.toISOString().split('T')[0]
          return attendanceDateStr === targetDateStr
        })
    } catch (error) {
      console.error('날짜별 출결 가져오기 실패:', error)
      // 컬렉션이 존재하지 않거나 인덱스 문제가 있는 경우 빈 배열 반환
      if (
        error instanceof Error &&
        (error.message.includes('requires an index') ||
          error.message.includes('not found'))
      ) {
        console.warn(
          '출결 데이터가 없거나 인덱스 생성이 필요합니다. 빈 데이터를 반환합니다.',
        )
        return []
      }
      throw error
    }
  }

export async function getAllAttendance(churchId: string): Promise<Attendance[]> {
    if (!isFirebaseConfigured() || !db) {
      return []
    }

    try {
      const q = query(
        collection(db, 'attendance'),
        where('churchId', '==', churchId),
      )
      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          date:
            data.date instanceof Timestamp
              ? data.date.toDate()
              : new Date(data.date),
        } as Attendance
      })
    } catch (error) {
      console.error('전체 출결 목록 가져오기 실패:', error)
      throw error
    }
  }

export async function getAttendanceStats(
    studentId: string,
    churchId: string,
  ): Promise<{
    total: number
    present: number
    absent: number
    attendanceRate: number
  }> {
    try {
      const allAttendance = await getAttendanceByStudent(
        studentId,
        churchId,
      )
      const total = allAttendance.length
      const present = allAttendance.filter(
        (a) => a.status === AttendanceStatus.PRESENT,
      ).length
      const absent = total - present
      const attendanceRate = total > 0 ? (present / total) * 100 : 0

      return { total, present, absent, attendanceRate }
    } catch (error) {
      console.error('출석률 계산 실패:', error)
      throw error
    }
  }

