import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

type FirebaseConfig = {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
  measurementId?: string
};

const firebaseConfig: FirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || undefined,
};

const requiredFirebaseConfigKeys: Array<keyof FirebaseConfig> = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
];

const missingFirebaseConfigKeys = requiredFirebaseConfigKeys.filter((key) => !firebaseConfig[key]);

// 디버깅: 환경 변수 로드 확인
if (import.meta.env.DEV) {
  console.log('Firebase Config:', {
    apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 10)}...` : 'undefined',
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    appId: firebaseConfig.appId,
    measurementId: firebaseConfig.measurementId,
    hasApiKey: !!firebaseConfig.apiKey,
    hasAuthDomain: !!firebaseConfig.authDomain,
    hasProjectId: !!firebaseConfig.projectId,
    hasStorageBucket: !!firebaseConfig.storageBucket,
    hasAppId: !!firebaseConfig.appId,
    hasMeasurementId: !!firebaseConfig.measurementId,
  });
  // 환경 변수가 undefined인 경우 경고
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
    console.error('⚠️ 환경 변수가 로드되지 않았습니다. .env 파일을 확인하고 개발 서버를 재시작하세요.');
  }
}

// Firebase 설정이 완료되었는지 확인
export const isFirebaseConfigured = (): boolean => {
  return missingFirebaseConfigKeys.length === 0;
};

let app: ReturnType<typeof initializeApp> | null = null;
let auth: ReturnType<typeof getAuth> | null = null;
let db: ReturnType<typeof getFirestore> | null = null;

if (!isFirebaseConfigured()) {
  throw new Error(
    `Firebase 설정이 필요합니다. 누락된 환경 변수: ${missingFirebaseConfigKeys.join(', ')}`
  );
}

try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  // app이 성공적으로 초기화된 경우에만 auth와 db 설정
  if (app) {
    auth = getAuth(app);
    db = getFirestore(app);

    // 디버깅: auth 객체 확인
    if (import.meta.env.DEV) {
      console.log('Firebase 초기화 성공:', {
        hasApp: !!app,
        hasAuth: !!auth,
        hasDb: !!db,
        authDomain: firebaseConfig.authDomain,
      });
    }
  } else {
    throw new Error('Firebase 앱 초기화에 실패했습니다.');
  }
} catch (error) {
  console.error('Firebase 초기화 실패:', error);
  if (import.meta.env.DEV) {
    console.error('Firebase Config 값:', firebaseConfig);
  }
  throw error;
}

export { app, auth, db };
