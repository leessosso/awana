import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  updateDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../config/firebase'
import type {
  HandbookProgress,
  HandbookProgressFormData,
} from '../models/HandbookProgress'

export async function createHandbookProgress(
    progressData: HandbookProgressFormData,
    completedBy: string,
    churchId: string,
  ): Promise<HandbookProgress> {
    if (!isFirebaseConfigured() || !db) {
      throw new Error(
        'Firebase가 설정되지 않았습니다. Firebase 프로젝트를 설정해주세요.',
      )
    }

    try {
      const docRef = await addDoc(collection(db, 'handbookProgress'), {
        ...progressData,
        completedDate: Timestamp.now(),
        completedBy,
        churchId,
      })

      const progress: HandbookProgress = {
        id: docRef.id,
        ...progressData,
        completedDate: new Date(),
        completedBy,
        churchId,
      }

      return progress
    } catch (error) {
      console.error('핸드북 진도 등록 실패:', error)
      throw error
    }
  }

export async function deleteHandbookProgress(progressId: string): Promise<void> {
    if (!isFirebaseConfigured() || !db) {
      throw new Error(
        'Firebase가 설정되지 않았습니다. Firebase 프로젝트를 설정해주세요.',
      )
    }

    try {
      await deleteDoc(doc(db, 'handbookProgress', progressId))
    } catch (error) {
      console.error('핸드북 진도 삭제 실패:', error)
      throw error
    }
  }

export async function getHandbookProgressByStudent(
    studentId: string,
    churchId: string,
  ): Promise<HandbookProgress[]> {
    if (!isFirebaseConfigured() || !db) {
      return []
    }

    try {
      const q = query(
        collection(db, 'handbookProgress'),
        where('studentId', '==', studentId),
        where('churchId', '==', churchId),
      )
      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          completedDate:
            data.completedDate instanceof Timestamp
              ? data.completedDate.toDate()
              : new Date(data.completedDate),
        } as HandbookProgress
      })
    } catch (error) {
      console.error('핸드북 진도 목록 가져오기 실패:', error)
      throw error
    }
  }

export async function updateHandbookProgress(
    progressId: string,
    progressData: Partial<HandbookProgressFormData>,
  ): Promise<void> {
    if (!isFirebaseConfigured() || !db) {
      throw new Error(
        'Firebase가 설정되지 않았습니다. Firebase 프로젝트를 설정해주세요.',
      )
    }

    try {
      await updateDoc(doc(db, 'handbookProgress', progressId), {
        ...progressData,
        updatedAt: Timestamp.now(),
      })
    } catch (error) {
      console.error('핸드북 진도 수정 실패:', error)
      throw error
    }
  }

export async function getHandbookProgressByChurch(
    churchId: string,
  ): Promise<HandbookProgress[]> {
    if (!isFirebaseConfigured() || !db) {
      return []
    }

    try {
      const q = query(
        collection(db, 'handbookProgress'),
        where('churchId', '==', churchId),
      )
      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          completedDate:
            data.completedDate instanceof Timestamp
              ? data.completedDate.toDate()
              : new Date(data.completedDate),
          updatedAt:
            data.updatedAt instanceof Timestamp
              ? data.updatedAt.toDate()
              : data.updatedAt
                ? new Date(data.updatedAt)
                : undefined,
        } as unknown as HandbookProgress
      })
    } catch (error) {
      console.error('교회별 핸드북 진도 목록 가져오기 실패:', error)
      throw error
    }
  }

export async function getHandbookProgressStats(
    studentId: string,
    handbookId: string,
    totalUnits: number,
    churchId: string,
  ): Promise<{ completed: number; total: number; progressRate: number }> {
    if (!isFirebaseConfigured() || !db) {
      return { completed: 0, total: totalUnits, progressRate: 0 }
    }

    try {
      const q = query(
        collection(db, 'handbookProgress'),
        where('studentId', '==', studentId),
        where('handbookId', '==', handbookId),
        where('churchId', '==', churchId),
      )
      const querySnapshot = await getDocs(q)

      const completed = querySnapshot.size
      const progressRate = totalUnits > 0 ? (completed / totalUnits) * 100 : 0

      return { completed, total: totalUnits, progressRate }
    } catch (error) {
      console.error('핸드북 진도율 계산 실패:', error)
      throw error
    }
  }

