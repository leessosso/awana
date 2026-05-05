import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../config/firebase'
import type {
  GameTimeSession,
  GameTimeSessionFormData,
  GameTimeProgram,
} from '../models/GameTimeScore'
import { calculateTotalScores } from '../models/GameTimeScore'

export async function createGameTimeSession(
    sessionData: GameTimeSessionFormData,
    createdBy: string,
    churchId: string,
  ): Promise<GameTimeSession> {
    if (!isFirebaseConfigured() || !db) {
      throw new Error(
        'Firebase가 설정되지 않았습니다. Firebase 프로젝트를 설정해주세요.',
      )
    }

    try {
      const totalScores = calculateTotalScores(
        sessionData.gameScores || [],
        sessionData.cheerScores || [],
      )

      const docRef = await addDoc(collection(db, 'gameTimeSessions'), {
        date: Timestamp.fromDate(sessionData.date),
        program: sessionData.program,
        gameScores: sessionData.gameScores || [],
        cheerScores: sessionData.cheerScores || [],
        totalScores,
        churchId,
        createdBy,
        createdAt: Timestamp.now(),
      })

      const session: GameTimeSession = {
        id: docRef.id,
        date: sessionData.date,
        program: sessionData.program,
        gameScores: sessionData.gameScores || [],
        cheerScores: sessionData.cheerScores || [],
        totalScores,
        churchId,
        createdBy,
        createdAt: new Date(),
      }

      return session
    } catch (error) {
      console.error('게임시간 세션 생성 실패:', error)
      throw error
    }
  }

export async function updateGameTimeSession(
    sessionId: string,
    sessionData: Partial<GameTimeSessionFormData>,
  ): Promise<void> {
    if (!isFirebaseConfigured() || !db) {
      throw new Error(
        'Firebase가 설정되지 않았습니다. Firebase 프로젝트를 설정해주세요.',
      )
    }

    try {
      const updateData: any = {}

      if (sessionData.date !== undefined) {
        updateData.date = Timestamp.fromDate(sessionData.date)
      }

      if (sessionData.program !== undefined) {
        updateData.program = sessionData.program
      }

      if (
        sessionData.gameScores !== undefined ||
        sessionData.cheerScores !== undefined
      ) {
        // 기존 데이터 가져오기
        const existingDoc = await getDoc(doc(db, 'gameTimeSessions', sessionId))
        const existingData = existingDoc.data()

        const gameScores =
          sessionData.gameScores !== undefined
            ? sessionData.gameScores
            : existingData?.gameScores || []
        const cheerScores =
          sessionData.cheerScores !== undefined
            ? sessionData.cheerScores
            : existingData?.cheerScores || []

        if (sessionData.gameScores !== undefined) {
          updateData.gameScores = sessionData.gameScores
        }
        if (sessionData.cheerScores !== undefined) {
          updateData.cheerScores = sessionData.cheerScores
        }
        updateData.totalScores = calculateTotalScores(gameScores, cheerScores)
      }

      await updateDoc(doc(db, 'gameTimeSessions', sessionId), updateData)
    } catch (error) {
      console.error('게임시간 세션 수정 실패:', error)
      throw error
    }
  }

export async function deleteGameTimeSession(sessionId: string): Promise<void> {
    if (!isFirebaseConfigured() || !db) {
      throw new Error(
        'Firebase가 설정되지 않았습니다. Firebase 프로젝트를 설정해주세요.',
      )
    }

    try {
      await deleteDoc(doc(db, 'gameTimeSessions', sessionId))
    } catch (error) {
      console.error('게임시간 세션 삭제 실패:', error)
      throw error
    }
  }

export async function getGameTimeSessionByDate(
    date: Date,
    churchId: string,
    program: GameTimeProgram,
  ): Promise<GameTimeSession | null> {
    if (!isFirebaseConfigured() || !db) {
      return null
    }

    try {
      // 먼저 해당 교회의 모든 세션 데이터를 가져옴 (단일 필드 쿼리만 사용)
      const q = query(
        collection(db, 'gameTimeSessions'),
        where('churchId', '==', churchId),
      )
      const querySnapshot = await getDocs(q)

      const targetDateStr = date.toISOString().split('T')[0] // YYYY-MM-DD 형식

      // 클라이언트 측에서 날짜와 프로그램 필터링
      const sessions = querySnapshot.docs
        .map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
            program: data.program || 'Sparks', // 기본값 (하위 호환성)
            gameScores:
              data.gameScores ||
              data.games?.map((_g: any, idx: number) => ({
                id: `game-${idx}`,
                team: 'red' as const,
                score: 0,
              })) ||
              [],
            cheerScores: data.cheerScores || [],
            date:
              data.date instanceof Timestamp
                ? data.date.toDate()
                : new Date(data.date),
            createdAt:
              data.createdAt instanceof Timestamp
                ? data.createdAt.toDate()
                : new Date(data.createdAt),
          } as GameTimeSession
        })
        .filter((session) => {
          const sessionDateStr = session.date.toISOString().split('T')[0]
          return sessionDateStr === targetDateStr && session.program === program
        })

      return sessions.length > 0 ? sessions[0] : null
    } catch (error) {
      console.error('날짜별 게임시간 세션 가져오기 실패:', error)
      if (
        error instanceof Error &&
        (error.message.includes('requires an index') ||
          error.message.includes('not found'))
      ) {
        console.warn(
          '게임시간 세션 데이터가 없거나 인덱스 생성이 필요합니다. 빈 데이터를 반환합니다.',
        )
        return null
      }
      throw error
    }
  }

export async function getGameTimeSessionsByChurch(
    churchId: string,
  ): Promise<GameTimeSession[]> {
    if (!isFirebaseConfigured() || !db) {
      return []
    }

    try {
      const q = query(
        collection(db, 'gameTimeSessions'),
        where('churchId', '==', churchId),
      )
      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          gameScores:
            data.gameScores ||
            data.games?.map((_g: any, idx: number) => ({
              id: `game-${idx}`,
              team: 'red' as const,
              score: 0,
            })) ||
            [],
          cheerScores: data.cheerScores || [],
          date:
            data.date instanceof Timestamp
              ? data.date.toDate()
              : new Date(data.date),
          createdAt:
            data.createdAt instanceof Timestamp
              ? data.createdAt.toDate()
              : new Date(data.createdAt),
        } as GameTimeSession
      })
    } catch (error) {
      console.error('교회별 게임시간 세션 목록 가져오기 실패:', error)
      throw error
    }
  }

