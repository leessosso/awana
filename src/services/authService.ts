import {
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updatePassword,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth';
import { collection, doc, getDoc, getDocs, limit, query, setDoc, where } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../config/firebase';
import { UserRole } from '../models/User';
import type { User } from '../models/User';
import { churchService } from './churchService';
import { logger } from '../utils/logger';

const LOGIN_DOMAIN = 'awana.local';

// Firebase 에러 타입 정의
interface FirebaseError {
  code?: string;
  message?: string;
  customData?: Record<string, unknown>;
}

function toLoginEmail(loginInput: string): string {
  const normalized = loginInput.trim().normalize('NFC').toLowerCase();
  if (normalized.includes('@')) {
    return normalized;
  }
  return `${normalized}@${LOGIN_DOMAIN}`;
}

async function resolveLoginToEmail(loginInput: string): Promise<string> {
  const normalized = loginInput.trim().normalize('NFC').toLowerCase();
  if (normalized.includes('@')) {
    return normalized;
  }

  if (!db) {
    return toLoginEmail(normalized);
  }

  const q = query(
    collection(db, 'users'),
    where('loginId', '==', normalized),
    limit(2)
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    // 이전 방식과의 호환을 위해 fallback 유지
    return toLoginEmail(normalized);
  }

  if (snapshot.size > 1) {
    throw new Error('동일한 아이디가 중복 등록되어 있습니다. 관리자에게 문의해주세요.');
  }

  const userData = snapshot.docs[0].data() as User;
  if (!userData.email) {
    throw new Error('계정 이메일 정보가 누락되었습니다. 관리자에게 문의해주세요.');
  }

  return userData.email;
}

export async function signUp(
  email: string,
  password: string,
  displayName: string,
  churchName: string,
  churchAddress: string = '',
  role: UserRole = UserRole.TEACHER
): Promise<User> {
    if (!isFirebaseConfigured() || !auth || !db) {
      throw new Error('Firebase가 설정되지 않았습니다. Firebase 프로젝트를 설정해주세요.');
    }

    try {
      // 먼저 사용자 생성
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const firebaseUser = userCredential.user;

      await updateProfile(firebaseUser, { displayName });

      // 교회 이름으로 기존 교회 검색
      let church = await churchService.findChurchByName(churchName);

      // 교회가 없으면 새로 생성
      if (!church) {
        church = await churchService.createChurch(
          churchName,
          churchAddress,
          firebaseUser.uid
        );
      }

      const userData: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName,
        role,
        churchName,
        churchId: church.id,
        createdAt: new Date(),
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), userData);

      return userData;
    } catch (error) {
      console.error('회원가입 실패:', error);
      throw error;
    }
}

export async function signIn(email: string, password: string): Promise<User> {
    if (!isFirebaseConfigured() || !auth || !db) {
      console.error('Firebase 설정 확인:', {
        isConfigured: isFirebaseConfigured(),
        hasAuth: !!auth,
        hasDb: !!db,
      });
      throw new Error('Firebase가 설정되지 않았습니다. Firebase 프로젝트를 설정해주세요.');
    }

    try {
      if (!auth) {
        throw new Error('Firebase Auth가 초기화되지 않았습니다. Firebase Console에서 Authentication을 활성화해주세요.');
      }

      // 디버깅: auth 객체 상세 정보
      logger.debug('로그인 시도', {
        hasAuth: !!auth,
        authApp: auth?.app?.name,
        authConfig: auth?.config,
      });

      const loginEmail = await resolveLoginToEmail(email);

      const userCredential = await signInWithEmailAndPassword(
        auth,
        loginEmail,
        password
      );
      const firebaseUser = userCredential.user;

      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (!userDoc.exists()) {
        throw new Error('사용자 정보를 찾을 수 없습니다.');
      }

      const userData = userDoc.data() as User;
      const defaultLoginId = firebaseUser.email?.endsWith(`@${LOGIN_DOMAIN}`)
        ? firebaseUser.email.replace(`@${LOGIN_DOMAIN}`, '')
        : undefined;
      return {
        ...userData,
        loginId: userData.loginId || defaultLoginId,
        createdAt: userData.createdAt instanceof Date
          ? userData.createdAt
          : new Date(userData.createdAt),
      };
    } catch (error) {
      console.error('로그인 실패:', error);

      // Firebase 에러 타입 체크
      const firebaseError = error as FirebaseError;
      console.error('에러 상세:', {
        code: firebaseError?.code,
        message: firebaseError?.message,
        customData: firebaseError?.customData,
      });

      // configuration-not-found 에러인 경우 상세 안내
      if (firebaseError?.code === 'auth/configuration-not-found') {
        throw new Error(
          'Firebase Authentication이 설정되지 않았습니다.\n\n' +
          'Firebase Console에서 다음을 확인해주세요:\n' +
          '1. Authentication 메뉴 > Sign-in method > 이메일/비밀번호 활성화\n' +
          '2. 프로젝트 설정 > 일반 > 내 앱에서 웹 앱이 올바르게 등록되어 있는지 확인'
        );
      }

      throw error;
    }
}

export async function signOut(): Promise<void> {
    if (!isFirebaseConfigured() || !auth) {
      return;
    }

    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('로그아웃 실패:', error);
      throw error;
    }
}

export async function updateCurrentUserPassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  if (!isFirebaseConfigured() || !auth) {
    throw new Error('Firebase가 설정되지 않았습니다.');
  }

  const firebaseUser = auth.currentUser;
  if (!firebaseUser || !firebaseUser.email) {
    throw new Error('로그인 사용자 정보를 찾을 수 없습니다.');
  }

  if (newPassword.trim().length < 6) {
    throw new Error('새 비밀번호는 6자 이상이어야 합니다.');
  }

  const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
  await reauthenticateWithCredential(firebaseUser, credential);
  await updatePassword(firebaseUser, newPassword);
}

// 인증 상태 변경 리스너
export function onAuthStateChange(callback: (user: User | null) => void): () => void {
    if (!isFirebaseConfigured() || !auth || !db) {
      return () => {};
    }

    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db!, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            const defaultLoginId = firebaseUser.email?.endsWith(`@${LOGIN_DOMAIN}`)
              ? firebaseUser.email.replace(`@${LOGIN_DOMAIN}`, '')
              : undefined;
            const user: User = {
              ...userData,
              loginId: userData.loginId || defaultLoginId,
              createdAt: userData.createdAt instanceof Date
                ? userData.createdAt
                : new Date(userData.createdAt),
            };
            callback(user);
          } else {
            callback(null);
          }
        } catch (error) {
          console.error('사용자 데이터 조회 실패:', error);
          callback(null);
        }
      } else {
        callback(null);
      }
    });
}

export async function getCurrentUser(): Promise<User | null> {
    if (!isFirebaseConfigured() || !auth || !db) {
      return null;
    }

    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      return null;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (!userDoc.exists()) {
        return null;
      }

      const userData = userDoc.data() as User;
      const defaultLoginId = firebaseUser.email?.endsWith(`@${LOGIN_DOMAIN}`)
        ? firebaseUser.email.replace(`@${LOGIN_DOMAIN}`, '')
        : undefined;
      return {
        ...userData,
        loginId: userData.loginId || defaultLoginId,
        createdAt: userData.createdAt instanceof Date
          ? userData.createdAt
          : new Date(userData.createdAt),
      };
    } catch (error) {
      console.error('사용자 정보 가져오기 실패:', error);
      return null;
    }
  }
