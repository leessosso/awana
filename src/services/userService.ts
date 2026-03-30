import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../config/firebase';
import type {
  User,
  Theme,
  ThemeColor,
  TeacherPosition,
  TeacherProgram,
  TeacherTeam,
} from '../models/User';
import { UserRole } from '../models/User';

export class UserService {
  async getTeachersByChurch(churchId: string): Promise<User[]> {
    if (!isFirebaseConfigured() || !db) {
      return [];
    }

    try {
      const q = query(
        collection(db, 'users'),
        where('churchId', '==', churchId),
        where('role', '==', UserRole.TEACHER)
      );

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          uid: doc.id,
          ...data,
          createdAt:
            data.createdAt instanceof Timestamp
              ? data.createdAt.toDate()
              : new Date(data.createdAt),
        } as User;
      });
    } catch (error) {
      console.error('선생님 목록 가져오기 실패:', error);
      throw error;
    }
  }

  async updateUserTheme(
    userId: string,
    theme?: Theme,
    themeColor?: ThemeColor
  ): Promise<void> {
    if (!isFirebaseConfigured() || !db) {
      throw new Error('Firebase가 설정되지 않았습니다.');
    }

    try {
      const userRef = doc(db, 'users', userId);
      const updates: Partial<Pick<User, 'theme' | 'themeColor'>> = {};

      if (theme !== undefined) {
        updates.theme = theme;
      }
      if (themeColor !== undefined) {
        updates.themeColor = themeColor;
      }

      await updateDoc(userRef, updates);
    } catch (error) {
      console.error('사용자 테마 설정 업데이트 실패:', error);
      throw error;
    }
  }

  async updateTeacherAssignment(
    teacherId: string,
    payload: {
      position: TeacherPosition;
      program: TeacherProgram;
      team: TeacherTeam;
    }
  ): Promise<void> {
    if (!isFirebaseConfigured() || !db) {
      throw new Error('Firebase가 설정되지 않았습니다.');
    }

    try {
      const userRef = doc(db, 'users', teacherId);
      await updateDoc(userRef, {
        position: payload.position,
        program: payload.program,
        team: payload.team,
      });
    } catch (error) {
      console.error('선생님 소속 정보 업데이트 실패:', error);
      throw error;
    }
  }
}

export const userService = new UserService();
