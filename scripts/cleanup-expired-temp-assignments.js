// Firebase Admin SDK를 사용하여 만료된 임시 배정 데이터 정리
// Node.js 환경에서 실행 (Firebase Admin SDK 필요)
//
// 설치: npm install firebase-admin
// 실행: node scripts/cleanup-expired-temp-assignments.js

import admin from 'firebase-admin'
import fs from 'fs'

const SERVICE_ACCOUNT_PATH = './scripts/serviceAccountKey.json'

function loadServiceAccount () {
  const serviceAccountFromEnv = process.env.FIREBASE_SERVICE_ACCOUNT_KEY

  if (serviceAccountFromEnv) {
    try {
      return JSON.parse(serviceAccountFromEnv)
    } catch (err) {
      throw new Error(`FIREBASE_SERVICE_ACCOUNT_KEY 파싱 실패: ${err.message}`)
    }
  }

  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    throw new Error(
      `서비스 계정 키 파일이 없습니다: ${SERVICE_ACCOUNT_PATH}. ` +
      '파일을 생성하거나 FIREBASE_SERVICE_ACCOUNT_KEY 환경 변수를 설정하세요.'
    )
  }

  const raw = fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8').trim()
  if (!raw) {
    throw new Error(
      `서비스 계정 키 파일이 비어 있습니다: ${SERVICE_ACCOUNT_PATH}. ` +
      'GitHub Secret(FIREBASE_SERVICE_ACCOUNT_KEY) 값을 확인하세요.'
    )
  }

  try {
    return JSON.parse(raw)
  } catch (err) {
    throw new Error(`서비스 계정 키 JSON 파싱 실패(${SERVICE_ACCOUNT_PATH}): ${err.message}`)
  }
}

const serviceAccount = loadServiceAccount()

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

/**
 * 만료된 임시 배정 데이터를 정리하는 함수
 */
async function cleanupExpiredTempAssignments() {
  const now = new Date()
  console.log(`임시 배정 만료 데이터 정리 시작: ${now.toISOString()}`)

  try {
    let totalProcessed = 0
    let totalCleaned = 0

    // 모든 교회에 대해 반복
    const churchesSnapshot = await db.collection('churches').get()
    console.log(`총 ${churchesSnapshot.size}개의 교회를 발견했습니다.`)

    for (const churchDoc of churchesSnapshot.docs) {
      const churchId = churchDoc.id
      console.log(`교회 ${churchId} 처리 중...`)

      // 해당 교회의 모든 학생 조회
      const studentsQuery = db.collection('students').where('churchId', '==', churchId)
      const studentsSnapshot = await studentsQuery.get()

      let batch = db.batch()
      let batchSize = 0
      let churchCleaned = 0

      for (const studentDoc of studentsSnapshot.docs) {
        const studentData = studentDoc.data()
        totalProcessed++

        // 임시 배정 정보 확인
        const tempAssignedTeacherId = studentData.tempAssignedTeacherId
        const tempAssignedUntil = studentData.tempAssignedUntil

        // 임시 배정이 있고 기간이 만료되었는지 확인
        if (tempAssignedTeacherId && tempAssignedUntil) {
          // Firestore Timestamp를 Date로 변환
          const tempUntilDate = tempAssignedUntil.toDate
            ? tempAssignedUntil.toDate()
            : new Date(tempAssignedUntil)

          if (tempUntilDate < now) {
            // 기간 만료됨 - 임시 배정 정보 삭제
            const studentRef = db.collection('students').doc(studentDoc.id)
            batch.update(studentRef, {
              tempAssignedTeacherId: admin.firestore.FieldValue.delete(),
              tempAssignedUntil: admin.firestore.FieldValue.delete()
            })
            batchSize++

            console.log(`학생 ${studentData.name} (${studentDoc.id})의 만료된 임시 배정 정리`)

            // 배치가 500개에 도달하면 커밋
            if (batchSize >= 500) {
              await batch.commit()
              totalCleaned += batchSize
              churchCleaned += batchSize
              batchSize = 0
              // 커밋된 배치는 재사용할 수 없으므로 새 배치를 시작
              batch = db.batch()
            }
          }
        }
      }

      // 남은 배치 커밋
      if (batchSize > 0) {
        await batch.commit()
        totalCleaned += batchSize
        churchCleaned += batchSize
      }

      console.log(`교회 ${churchId}: ${studentsSnapshot.size}명의 학생 중 ${churchCleaned}명의 만료 데이터 정리 완료`)
    }

    console.log(`임시 배정 만료 데이터 정리 완료: 총 ${totalProcessed}명 처리, ${totalCleaned}명 정리`)

    return {
      success: true,
      totalProcessed,
      totalCleaned,
      executedAt: now.toISOString()
    }

  } catch (error) {
    console.error('임시 배정 만료 데이터 정리 중 오류 발생:', error)
    throw error
  }
}

// 스크립트 실행
cleanupExpiredTempAssignments().then((result) => {
  console.log('✅ 정리 작업이 성공적으로 완료되었습니다.')
  console.log('결과:', JSON.stringify(result, null, 2))
  process.exit(0)
}).catch((error) => {
  console.error('❌ 정리 작업이 실패했습니다.')
  console.error('오류:', error)
  process.exit(1)
})
