import {
  Edit as EditIcon,
  Trash2 as DeleteIcon,
  User as PersonIcon,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Student } from '../../models/Student'
import type { User } from '../../models/User'
import { Button } from '../ui/Button'
import { Card, CardContent } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Checkbox } from '../ui/checkbox'
import { useStudentStore } from '../../store/studentStore'

interface StudentCardProps {
  student: Student
  teachers: User[]
  isAdmin: boolean
  isSelected?: boolean
  onSelect?: (studentId: string) => void
  onDelete?: (studentId: string) => void
  onEdit?: (student: Student) => void
  onUpdate?: () => void
}

export function StudentCard({
  student,
  teachers,
  isAdmin,
  isSelected = false,
  onSelect,
  onDelete,
  onEdit,
  onUpdate,
}: StudentCardProps) {
  const navigate = useNavigate()

  const getTeacherName = (teacherId?: string) => {
    if (!teacherId) return '미배정'
    const teacher = teachers.find((t) => t.uid === teacherId)
    return teacher?.displayName || '알 수 없음'
  }

  const getClubText = (club: string) => {
    const clubMap: Record<string, string> = {
      Sparks: 'Sparks',
      'T&T': 'T&T',
      Trek: 'Trek',
    }
    return clubMap[club] || club
  }

  const getGenderText = (gender: 'male' | 'female') => {
    return gender === 'male' ? '남자' : '여자'
  }

  const handleCancelTempAssignment = async () => {
    if (!window.confirm('임시 담당 배정을 취소하시겠습니까?')) {
      return
    }

    try {
      await useStudentStore.getState().updateStudent(student.id, {
        tempAssignedTeacherId: null as any,
        tempAssignedUntil: null as any,
      })

      // 학생 목록 새로고침
      if (onUpdate) {
        onUpdate()
      }

      alert('임시 담당이 취소되었습니다.')
    } catch (error) {
      console.error('임시 담당 취소 실패:', error)
      alert('임시 담당 취소에 실패했습니다.')
    }
  }

  const hasTempAssignment = (() => {
    if (!student.tempAssignedTeacherId || !student.tempAssignedUntil) {
      return false
    }
    const now = new Date()
    const tempUntil =
      student.tempAssignedUntil instanceof Date
        ? student.tempAssignedUntil
        : new Date(student.tempAssignedUntil)
    return tempUntil >= now
  })()

  return (
    <Card
      className={`hover:shadow-lg transition-shadow min-h-[130px] md:min-h-[150px] ${isSelected ? 'ring-2 ring-primary' : ''}`}
    >
      <CardContent className="p-4">
        <div className="space-y-2">
          {/* 상단: 학생 기본 정보 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-grow">
              {isAdmin && onSelect && (
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onSelect(student.id)}
                  className="mr-3"
                />
              )}
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mr-3">
                <PersonIcon className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="flex-grow">
                <h3 className="font-semibold text-lg">{student.name}</h3>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline">{getClubText(student.club)}</Badge>
                  <Badge variant="outline">
                    {getGenderText(student.gender)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  담당: {getTeacherName(student.assignedTeacherId) || '미배정'}
                </p>
              </div>
            </div>
            {isAdmin && (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    onEdit
                      ? onEdit(student)
                      : navigate(`/students/${student.id}/edit`)
                  }
                >
                  <EditIcon className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete?.(student.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <DeleteIcon className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* 하단: 임시 배정 정보 */}
          {hasTempAssignment && (
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-orange-600">
                  임시: {getTeacherName(student.tempAssignedTeacherId)}(
                  {student.tempAssignedUntil?.toLocaleDateString()}까지)
                </p>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelTempAssignment}
                    className="text-xs h-6 px-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                  >
                    취소
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
