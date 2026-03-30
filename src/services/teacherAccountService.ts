import { createUserWithEmailAndPassword, getAuth, updateProfile } from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';
import { collection, getDocs, limit, query, setDoc, where, doc } from 'firebase/firestore';
import { app, db, isFirebaseConfigured } from '../config/firebase';
import type {
  TeacherPosition,
  TeacherProgram,
  TeacherTeam,
  User,
} from '../models/User';
import { UserRole } from '../models/User';
import {
  normalizeLoginInput,
  toLoginEmail,
  toLoginIndexKey,
} from '../utils/loginIdentity';

interface CreateTeacherAccountRequest {
  displayName: string;
  loginId: string;
  password: string;
  churchId: string;
  churchName: string;
  position?: TeacherPosition;
  program: TeacherProgram;
  team: TeacherTeam;
}

const SECONDARY_APP_NAME = 'teacher-account-manager';
const LOGIN_ID_PATTERN = /^[a-z0-9가-힣ㄱ-ㅎㅏ-ㅣ._-]{2,30}$/i;

export async function createTeacherAccount(
  payload: CreateTeacherAccountRequest
): Promise<User> {
  if (!isFirebaseConfigured() || !app || !db) {
    throw new Error('Firebase가 설정되지 않았습니다.');
  }

  const loginId = normalizeLoginInput(payload.loginId);
  if (!LOGIN_ID_PATTERN.test(loginId)) {
    throw new Error('아이디는 한글/영문/숫자/._- 조합으로 2~30자여야 합니다.');
  }

  if (payload.password.trim().length < 6) {
    throw new Error('비밀번호는 6자 이상이어야 합니다.');
  }

  const duplicateQuery = query(
    collection(db, 'users'),
    where('loginId', '==', loginId),
    limit(1)
  );
  const duplicateSnapshot = await getDocs(duplicateQuery);
  if (!duplicateSnapshot.empty) {
    throw new Error('이미 사용 중인 아이디입니다.');
  }

  const secondaryApp =
    getApps().find((candidate) => candidate.name === SECONDARY_APP_NAME) ||
    initializeApp(app.options, SECONDARY_APP_NAME);
  const secondaryAuth = getAuth(secondaryApp);

  const email = toLoginEmail(loginId);
  const userCredential = await createUserWithEmailAndPassword(
    secondaryAuth,
    email,
    payload.password.trim()
  );
  const firebaseUser = userCredential.user;

  await updateProfile(firebaseUser, { displayName: payload.displayName.trim() });

  const teacherData: User = {
    uid: firebaseUser.uid,
    email,
    loginId,
    displayName: payload.displayName.trim(),
    role: UserRole.TEACHER,
    position: payload.position,
    program: payload.program,
    team: payload.team,
    churchId: payload.churchId,
    churchName: payload.churchName,
    createdAt: new Date(),
  };

  await setDoc(doc(db, 'users', firebaseUser.uid), teacherData);
  await setDoc(doc(db, 'loginIndex', toLoginIndexKey(loginId)), {
    email,
    loginId,
    uid: firebaseUser.uid,
    churchId: payload.churchId,
    createdAt: new Date(),
  });

  return teacherData;
}
