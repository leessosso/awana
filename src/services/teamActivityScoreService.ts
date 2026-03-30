import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../config/firebase'
import type {
  TeamActivityProgram,
  TeamActivitySession,
  TeamActivitySessionFormData,
} from '../models/TeamActivityScore'
import {
  calculateTeamActivityTotalScores,
  createEmptyCountsByTeam,
} from '../models/TeamActivityScore'

export class TeamActivityScoreService {
  async createTeamActivitySession (
    sessionData: TeamActivitySessionFormData,
    createdBy: string,
    churchId: string
  ): Promise<TeamActivitySession> {
    if (!isFirebaseConfigured() || !db) {
      throw new Error('Firebase가 설정되지 않았습니다. Firebase 프로젝트를 설정해주세요.')
    }

    try {
      const countsByTeam = sessionData.countsByTeam || createEmptyCountsByTeam()
      const totalScores = calculateTeamActivityTotalScores(countsByTeam)
      const docRef = await addDoc(collection(db, 'teamActivityScores'), {
        date: Timestamp.fromDate(sessionData.date),
        program: sessionData.program,
        countsByTeam,
        totalScores,
        churchId,
        createdBy,
        createdAt: Timestamp.now(),
      })

      return {
        id: docRef.id,
        date: sessionData.date,
        program: sessionData.program,
        countsByTeam,
        totalScores,
        churchId,
        createdBy,
        createdAt: new Date(),
      }
    } catch (error) {
      console.error('팀 활동 점수 생성 실패:', error)
      throw error
    }
  }

  async updateTeamActivitySession (
    sessionId: string,
    sessionData: Partial<TeamActivitySessionFormData>
  ): Promise<void> {
    if (!isFirebaseConfigured() || !db) {
      throw new Error('Firebase가 설정되지 않았습니다. Firebase 프로젝트를 설정해주세요.')
    }

    try {
      const updateData: Record<string, unknown> = {}
      if (sessionData.date !== undefined) {
        updateData.date = Timestamp.fromDate(sessionData.date)
      }
      if (sessionData.program !== undefined) {
        updateData.program = sessionData.program
      }
      if (sessionData.countsByTeam !== undefined) {
        updateData.countsByTeam = sessionData.countsByTeam
        updateData.totalScores = calculateTeamActivityTotalScores(sessionData.countsByTeam)
      }

      await updateDoc(doc(db, 'teamActivityScores', sessionId), updateData)
    } catch (error) {
      console.error('팀 활동 점수 수정 실패:', error)
      throw error
    }
  }

  async deleteTeamActivitySession (sessionId: string): Promise<void> {
    if (!isFirebaseConfigured() || !db) {
      throw new Error('Firebase가 설정되지 않았습니다. Firebase 프로젝트를 설정해주세요.')
    }

    try {
      await deleteDoc(doc(db, 'teamActivityScores', sessionId))
    } catch (error) {
      console.error('팀 활동 점수 삭제 실패:', error)
      throw error
    }
  }

  async getTeamActivitySessionByDate (
    date: Date,
    churchId: string,
    program: TeamActivityProgram
  ): Promise<TeamActivitySession | null> {
    if (!isFirebaseConfigured() || !db) {
      return null
    }

    try {
      const q = query(
        collection(db, 'teamActivityScores'),
        where('churchId', '==', churchId)
      )
      const snapshot = await getDocs(q)
      const targetDateStr = date.toISOString().split('T')[0]

      const sessions = snapshot.docs
        .map((docItem) => {
          const data = docItem.data()
          const countsByTeam = data.countsByTeam || createEmptyCountsByTeam()
          return {
            id: docItem.id,
            ...data,
            program: data.program || 'Sparks',
            countsByTeam,
            totalScores: data.totalScores || calculateTeamActivityTotalScores(countsByTeam),
            date:
              data.date instanceof Timestamp
                ? data.date.toDate()
                : new Date(data.date),
            createdAt:
              data.createdAt instanceof Timestamp
                ? data.createdAt.toDate()
                : new Date(data.createdAt),
          } as TeamActivitySession
        })
        .filter((session) => {
          const sessionDateStr = session.date.toISOString().split('T')[0]
          return sessionDateStr === targetDateStr && session.program === program
        })

      return sessions[0] || null
    } catch (error) {
      console.error('날짜별 팀 활동 점수 가져오기 실패:', error)
      if (
        error instanceof Error &&
        (error.message.includes('requires an index') ||
          error.message.includes('not found'))
      ) {
        return null
      }
      throw error
    }
  }
}

export const teamActivityScoreService = new TeamActivityScoreService()
