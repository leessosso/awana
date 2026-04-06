import admin from 'firebase-admin'
import fs from 'fs'

const SERVICE_ACCOUNT_PATH = './scripts/serviceAccountKey.json'

function parseArgs () {
  const args = process.argv.slice(2)
  const hasApply = args.includes('--apply')
  const hasVerbose = args.includes('--verbose')

  return {
    dryRun: !hasApply,
    verbose: hasVerbose,
  }
}

function initializeFirebaseAdmin () {
  const raw = fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8')
  const serviceAccount = JSON.parse(raw)

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })

  return admin.firestore()
}

function mapLegacyPosition (position) {
  if (position === 'admin_teacher') return 'operations_teacher'
  if (position === 'club_leader') return 'head_teacher'
  return position || 'assistant'
}

function shouldClearHeadTeacherId (position) {
  return position !== 'assistant'
}

function shouldClearTeam (position) {
  return position === 'operations_teacher'
}

function shouldClearProgram (position) {
  return position === 'operations_teacher'
}

async function fetchTeacherUsers (db) {
  const snapshot = await db.collection('users').where('role', '==', 'teacher').get()
  return snapshot.docs.map((doc) => ({ id: doc.id, data: doc.data() }))
}

async function fetchAllStudents (db) {
  const snapshot = await db.collection('students').get()
  return snapshot.docs.map((doc) => ({ id: doc.id, data: doc.data() }))
}

async function runMigration () {
  const { dryRun, verbose } = parseArgs()
  const db = initializeFirebaseAdmin()

  console.log(`\n[시작] 교사 구조 마이그레이션 (${dryRun ? 'DRY RUN' : 'APPLY'})`)

  const teachers = await fetchTeacherUsers(db)
  const teacherMap = new Map(teachers.map((teacher) => [teacher.id, teacher.data]))
  const positionUpdates = []
  const warnings = []

  for (const teacher of teachers) {
    const currentPosition = teacher.data.position
    const nextPosition = mapLegacyPosition(currentPosition)
    const currentHeadTeacherId = teacher.data.headTeacherId
    const currentProgram = teacher.data.program
    const currentTeam = teacher.data.team
    const updatePayload = {}

    if (currentPosition !== nextPosition) {
      updatePayload.position = nextPosition
    }

    if (shouldClearHeadTeacherId(nextPosition)) {
      if (currentHeadTeacherId) {
        updatePayload.headTeacherId = admin.firestore.FieldValue.delete()
      }
    } else if (nextPosition === 'assistant') {
      if (!currentHeadTeacherId) {
        warnings.push(`보조 선생님(${teacher.id}, ${teacher.data.displayName || '-'})에 소속 담임이 없습니다.`)
      } else {
        const headTeacher = teacherMap.get(currentHeadTeacherId)
        if (!headTeacher) {
          warnings.push(`보조 선생님(${teacher.id})의 소속 담임(${currentHeadTeacherId}) 계정을 찾을 수 없습니다.`)
        } else if (mapLegacyPosition(headTeacher.position) !== 'head_teacher') {
          warnings.push(`보조 선생님(${teacher.id})의 소속 담임(${currentHeadTeacherId}) 직책이 담임이 아닙니다.`)
        }
      }
    }

    if (shouldClearTeam(nextPosition) && currentTeam) {
      updatePayload.team = admin.firestore.FieldValue.delete()
    }
    if (shouldClearProgram(nextPosition) && currentProgram) {
      updatePayload.program = admin.firestore.FieldValue.delete()
    }

    if (Object.keys(updatePayload).length > 0) {
      positionUpdates.push({
        userId: teacher.id,
        displayName: teacher.data.displayName || '-',
        before: { position: currentPosition, headTeacherId: currentHeadTeacherId },
        // team은 operations_teacher 전환 시 삭제될 수 있음
        after: {
          position: updatePayload.position || currentPosition,
          headTeacherId: updatePayload.headTeacherId ? undefined : currentHeadTeacherId,
          program: updatePayload.program ? undefined : currentProgram,
          team: updatePayload.team ? undefined : currentTeam,
        },
        payload: updatePayload,
      })
    }
  }

  const students = await fetchAllStudents(db)
  const studentUpdates = []

  for (const student of students) {
    const assignedTeacherId = student.data.assignedTeacherId
    if (!assignedTeacherId) continue

    const assignedTeacher = teacherMap.get(assignedTeacherId)
    if (!assignedTeacher) continue

    const normalizedAssignedTeacherPosition = mapLegacyPosition(assignedTeacher.position)
    if (normalizedAssignedTeacherPosition !== 'assistant') continue

    const headTeacherId = assignedTeacher.headTeacherId
    if (!headTeacherId) {
      warnings.push(`학생(${student.id}, ${student.data.name || '-'})의 담당이 보조 선생님(${assignedTeacherId})이지만 소속 담임이 없습니다.`)
      continue
    }

    const headTeacher = teacherMap.get(headTeacherId)
    if (!headTeacher) {
      warnings.push(`학생(${student.id})의 재배정 대상 담임(${headTeacherId}) 계정을 찾을 수 없습니다.`)
      continue
    }

    if (mapLegacyPosition(headTeacher.position) !== 'head_teacher') {
      warnings.push(`학생(${student.id})의 재배정 대상(${headTeacherId}) 직책이 담임이 아닙니다.`)
      continue
    }

    studentUpdates.push({
      studentId: student.id,
      studentName: student.data.name || '-',
      beforeTeacherId: assignedTeacherId,
      afterTeacherId: headTeacherId,
    })
  }

  console.log(`\n교사 업데이트 대상: ${positionUpdates.length}건`)
  console.log(`학생 담당 재배정 대상: ${studentUpdates.length}건`)
  console.log(`검토 필요 경고: ${warnings.length}건`)

  if (verbose) {
    for (const update of positionUpdates) {
      console.log(`[교사] ${update.displayName} (${update.userId})`, update.before, '=>', update.after)
    }
    for (const update of studentUpdates) {
      console.log(`[학생] ${update.studentName} (${update.studentId}) ${update.beforeTeacherId} => ${update.afterTeacherId}`)
    }
  }

  if (warnings.length > 0) {
    console.log('\n[경고 목록]')
    warnings.forEach((warning) => console.log(`- ${warning}`))
  }

  if (dryRun) {
    console.log('\nDRY RUN 완료. 실제 반영하려면 --apply 옵션으로 다시 실행하세요.')
    return
  }

  const batchSizeLimit = 400
  let batch = db.batch()
  let batchCount = 0

  const commitBatch = async () => {
    if (batchCount === 0) return
    await batch.commit()
    batch = db.batch()
    batchCount = 0
  }

  for (const update of positionUpdates) {
    const ref = db.collection('users').doc(update.userId)
    batch.update(ref, update.payload)
    batchCount++
    if (batchCount >= batchSizeLimit) {
      await commitBatch()
    }
  }

  for (const update of studentUpdates) {
    const ref = db.collection('students').doc(update.studentId)
    batch.update(ref, { assignedTeacherId: update.afterTeacherId })
    batchCount++
    if (batchCount >= batchSizeLimit) {
      await commitBatch()
    }
  }

  await commitBatch()

  console.log('\n적용 완료')
  console.log(`- 교사 업데이트: ${positionUpdates.length}건`)
  console.log(`- 학생 담당 재배정: ${studentUpdates.length}건`)
  console.log(`- 경고(수동 확인 필요): ${warnings.length}건`)
}

runMigration().then(() => {
  process.exit(0)
}).catch((error) => {
  console.error('\n마이그레이션 실패:', error)
  process.exit(1)
})
