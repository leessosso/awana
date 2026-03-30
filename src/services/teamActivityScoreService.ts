import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../config/firebase'
import type {
  TeamActivityCounts,
  TeamKey,
  TeamActivityProgram,
  TeamActivitySession,
  TeamActivitySessionFormData,
} from '../models/TeamActivityScore'
import {
  calculateTeamActivityTotalScores,
  createEmptyCountsByTeam,
  normalizeTeamActivitySessionData,
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
      const normalized = normalizeTeamActivitySessionData(sessionData)
      const countsByTeam = normalized.countsByTeam
      const teacherEntriesByTeam = normalized.teacherEntriesByTeam
      const totalScores = calculateTeamActivityTotalScores(countsByTeam)
      const docRef = await addDoc(collection(db, 'teamActivityScores'), {
        date: Timestamp.fromDate(sessionData.date),
        program: sessionData.program,
        countsByTeam,
        teacherEntriesByTeam,
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
        teacherEntriesByTeam,
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

      if (sessionData.countsByTeam !== undefined || sessionData.teacherEntriesByTeam !== undefined) {
        const snapshot = await getDoc(doc(db, 'teamActivityScores', sessionId))
        const currentData = snapshot.data() as TeamActivitySessionFormData | undefined
        let normalized

        if (sessionData.teacherEntriesByTeam !== undefined) {
          normalized = normalizeTeamActivitySessionData({
            teacherEntriesByTeam: sessionData.teacherEntriesByTeam,
          })
        } else if (sessionData.countsByTeam !== undefined) {
          normalized = normalizeTeamActivitySessionData({
            countsByTeam: sessionData.countsByTeam,
          })
        } else {
          normalized = normalizeTeamActivitySessionData({
            countsByTeam: currentData?.countsByTeam ?? createEmptyCountsByTeam(),
            teacherEntriesByTeam: currentData?.teacherEntriesByTeam,
          })
        }

        updateData.countsByTeam = normalized.countsByTeam
        updateData.teacherEntriesByTeam = normalized.teacherEntriesByTeam
        updateData.totalScores = calculateTeamActivityTotalScores(normalized.countsByTeam)
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

  async updateTeacherTeamCounts (
    sessionId: string,
    team: TeamKey,
    teacherId: string,
    counts: TeamActivityCounts
  ): Promise<void> {
    if (!isFirebaseConfigured() || !db) {
      throw new Error('Firebase가 설정되지 않았습니다. Firebase 프로젝트를 설정해주세요.')
    }

    const firestore = db
    try {
      await runTransaction(firestore, async (transaction) => {
        const docRef = doc(firestore, 'teamActivityScores', sessionId)
        const snapshot = await transaction.get(docRef)
        if (!snapshot.exists()) {
          throw new Error('팀 활동 점수 세션을 찾을 수 없습니다.')
        }

        const data = snapshot.data() as TeamActivitySessionFormData
        const normalized = normalizeTeamActivitySessionData({
          countsByTeam: data.countsByTeam,
          teacherEntriesByTeam: data.teacherEntriesByTeam,
        })

        const teacherEntriesByTeam = {
          ...normalized.teacherEntriesByTeam,
          [team]: {
            ...normalized.teacherEntriesByTeam[team],
            [teacherId]: counts,
          },
        }

        const countsByTeam = normalizeTeamActivitySessionData({
          teacherEntriesByTeam,
        }).countsByTeam

        transaction.update(docRef, {
          teacherEntriesByTeam,
          countsByTeam,
          totalScores: calculateTeamActivityTotalScores(countsByTeam),
        })
      })
    } catch (error) {
      console.error('선생님별 팀 활동 점수 수정 실패:', error)
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
          const normalized = normalizeTeamActivitySessionData({
            countsByTeam: data.countsByTeam,
            teacherEntriesByTeam: data.teacherEntriesByTeam,
          })
          return {
            id: docItem.id,
            ...data,
            program: data.program || 'Sparks',
            countsByTeam: normalized.countsByTeam,
            teacherEntriesByTeam: normalized.teacherEntriesByTeam,
            totalScores:
              data.totalScores || calculateTeamActivityTotalScores(normalized.countsByTeam),
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
