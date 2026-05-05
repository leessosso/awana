import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../config/firebase'
import type { Church } from '../models/Church'

export async function createChurch(
    name: string,
    address: string,
    createdBy: string,
  ): Promise<Church> {
    if (!isFirebaseConfigured() || !db) {
      throw new Error('Firebase가 설정되지 않았습니다.')
    }

    try {
      const docRef = await addDoc(collection(db, 'churches'), {
        name,
        address,
        createdAt: Timestamp.now(),
        createdBy,
      })

      const church: Church = {
        id: docRef.id,
        name,
        address,
        createdAt: new Date(),
        createdBy,
      }

      return church
    } catch (error) {
      console.error('교회 생성 실패:', error)
      throw error
    }
  }

export async function getChurch(churchId: string): Promise<Church | null> {
    if (!isFirebaseConfigured() || !db) {
      return null
    }

    try {
      const docSnap = await getDoc(doc(db, 'churches', churchId))
      if (!docSnap.exists()) {
        return null
      }

      const data = docSnap.data()
      return {
        id: docSnap.id,
        ...data,
        createdAt:
          data.createdAt instanceof Timestamp
            ? data.createdAt.toDate()
            : new Date(data.createdAt),
      } as Church
    } catch (error) {
      console.error('교회 정보 가져오기 실패:', error)
      throw error
    }
  }

export async function findChurchByName(churchName: string): Promise<Church | null> {
    if (!isFirebaseConfigured() || !db) {
      return null
    }

    try {
      const q = query(
        collection(db, 'churches'),
        where('name', '==', churchName),
      )
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        return null
      }

      const doc = querySnapshot.docs[0]
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt:
          data.createdAt instanceof Timestamp
            ? data.createdAt.toDate()
            : new Date(data.createdAt),
      } as Church
    } catch (error) {
      console.error('교회 검색 실패:', error)
      throw error
    }
  }

