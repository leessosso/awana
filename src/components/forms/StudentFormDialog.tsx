import { useState, useEffect, useMemo } from 'react';
import type { StudentFormData, Student } from '../../models/Student';
import type { User } from '../../models/User';
import { Club, CLUB_OPTIONS } from '../../constants/clubs';

// 클럽별 기본 학년 매핑
const CLUB_TO_GRADE_MAP: Record<Club, number> = {
  [Club.SPARKS]: 2,  // 7세~2학년
  [Club.TNT]: 3,     // 3~6학년
  [Club.TREK]: 4,    // 중등부
};
import { useAuthStore } from '../../store/authStore';
import { userService } from '../../services/userService';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface StudentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (formData: StudentFormData) => Promise<void>;
  isLoading?: boolean;
  student?: Student; // 수정할 학생 데이터 (선택사항)
}

export function StudentFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
  student,
}: StudentFormDialogProps) {
  const { user } = useAuthStore();
  const [teachers, setTeachers] = useState<User[]>([]);
  const [studentForm, setStudentForm] = useState<StudentFormData>({
    name: '',
    club: Club.SPARKS,
    grade: 2,
    gender: 'male',
    birthDate: undefined,
    assignedTeacherId: undefined,
    parentName: '',
    parentPhone: '',
    address: '',
  });

  // 선생님 목록 가져오기
  useEffect(() => {
    const fetchTeachers = async () => {
      if (user?.churchId) {
        try {
          const teacherList = await userService.getTeachersByChurch(user.churchId);
          setTeachers(teacherList);
        } catch (error) {
          console.error('선생님 목록 가져오기 실패:', error);
        }
      }
    };
    fetchTeachers();
  }, [user?.churchId]);

  // 수정 모드인지 확인
  const isEditMode = !!student;

  const filteredTeachers = useMemo(() => {
    return teachers.filter((teacher) => teacher.program === studentForm.club)
  }, [teachers, studentForm.club])

  useEffect(() => {
    if (!studentForm.assignedTeacherId) return

    const hasAssignedTeacherInClub = filteredTeachers.some(
      (teacher) => teacher.uid === studentForm.assignedTeacherId
    )

    if (hasAssignedTeacherInClub) return

    setStudentForm((prev) => ({
      ...prev,
      assignedTeacherId: undefined
    }))
  }, [filteredTeachers, studentForm.assignedTeacherId])

  // 다이얼로그가 열릴 때 학생 데이터로 폼 초기화
  useEffect(() => {
    if (open) {
      if (student) {
        // 수정 모드: 기존 학생 데이터로 초기화
        setStudentForm({
          name: student.name,
          club: student.club,
          grade: student.grade,
          gender: student.gender,
          birthDate: student.birthDate,
          assignedTeacherId: student.assignedTeacherId,
          parentName: student.parentName || '',
          parentPhone: student.parentPhone || '',
          address: student.address || '',
        });
      } else {
        // 추가 모드: 빈 폼으로 초기화
        setStudentForm({
          name: '',
          club: Club.SPARKS,
          grade: CLUB_TO_GRADE_MAP[Club.SPARKS],
          gender: 'male',
          birthDate: undefined,
          assignedTeacherId: undefined,
          parentName: '',
          parentPhone: '',
          address: '',
        });
      }
    }
  }, [open, student]);

  // 다이얼로그가 닫힐 때 폼 초기화
  const handleClose = (open: boolean) => {
    if (!open) {
      setStudentForm({
        name: '',
        club: Club.SPARKS,
        grade: CLUB_TO_GRADE_MAP[Club.SPARKS],
        gender: 'male',
        birthDate: undefined,
        assignedTeacherId: undefined,
        parentName: '',
        parentPhone: '',
        address: '',
      });
    }
    onOpenChange(open);
  };

  const handleSubmit = async () => {
    if (!studentForm.name.trim()) {
      alert('이름을 입력해주세요.');
      return;
    }

    try {
      await onSubmit(studentForm);
      handleClose(false);
    } catch (error) {
      console.error('학생 추가 실패:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? '학생 정보 수정' : '학생 추가'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? '학생 정보를 수정합니다.' : '새로운 학생을 등록합니다.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 이름 */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              이름 <span className="text-red-500">*</span>
            </label>
            <Input
              value={studentForm.name}
              onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
              placeholder="학생 이름을 입력하세요"
              required
            />
          </div>

          {/* 클럽 */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              클럽 <span className="text-red-500">*</span>
            </label>
            <Select
              value={studentForm.club}
              onValueChange={(value) => {
                const selectedClub = value as Club;
                setStudentForm({
                  ...studentForm,
                  club: selectedClub,
                  grade: CLUB_TO_GRADE_MAP[selectedClub]
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="클럽을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {CLUB_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              선택된 클럽에 따라 학년이 자동으로 설정됩니다.
            </p>
          </div>

          {/* 성별 */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              성별 <span className="text-red-500">*</span>
            </label>
            <Select
              value={studentForm.gender}
              onValueChange={(value) => setStudentForm({ ...studentForm, gender: value as 'male' | 'female' })}
            >
              <SelectTrigger>
                <SelectValue placeholder="성별을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">남자</SelectItem>
                <SelectItem value="female">여자</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 생년월일 */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              생년월일
            </label>
            <Input
              type="date"
              value={studentForm.birthDate ? new Date(studentForm.birthDate).toISOString().split('T')[0] : ''}
              onChange={(e) => setStudentForm({
                ...studentForm,
                birthDate: e.target.value ? new Date(e.target.value) : undefined
              })}
              style={{ colorScheme: 'light dark' }}
            />
          </div>

          {/* 담당 선생님 */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              담당 선생님
            </label>
            <Select
              value={studentForm.assignedTeacherId || 'none'}
              onValueChange={(value) => setStudentForm({
                ...studentForm,
                assignedTeacherId: value === 'none' ? undefined : value
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="담당 선생님을 선택하세요 (선택사항)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">미배정</SelectItem>
                {filteredTeachers.map((teacher) => (
                  <SelectItem key={teacher.uid} value={teacher.uid}>
                    {teacher.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filteredTeachers.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                선택된 클럽에 배정된 선생님이 없습니다.
              </p>
            )}
          </div>

          {/* 학부모 이름 */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              학부모 이름
            </label>
            <Input
              value={studentForm.parentName || ''}
              onChange={(e) => setStudentForm({ ...studentForm, parentName: e.target.value || undefined })}
              placeholder="학부모 이름을 입력하세요"
            />
          </div>

          {/* 학부모 연락처 */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              학부모 연락처
            </label>
            <Input
              type="tel"
              value={studentForm.parentPhone || ''}
              onChange={(e) => setStudentForm({ ...studentForm, parentPhone: e.target.value || undefined })}
              placeholder="학부모 연락처를 입력하세요"
            />
          </div>

          {/* 주소 */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              주소
            </label>
            <Input
              value={studentForm.address || ''}
              onChange={(e) => setStudentForm({ ...studentForm, address: e.target.value || undefined })}
              placeholder="주소를 입력하세요"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
          >
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !studentForm.name.trim()}
          >
            {isLoading ? (isEditMode ? '수정 중...' : '등록 중...') : (isEditMode ? '수정하기' : '등록하기')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

