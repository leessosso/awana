import { useEffect, useState } from 'react';
import {
  Plus as AddIcon,
  Search as SearchIcon,
  Users as UsersIcon,
  Clock as ClockIcon,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert, AlertDescription } from '../../components/ui/Alert';
import { Badge } from '../../components/ui/Badge';
import { useStudentStore } from '../../store/studentStore';
import { useAuthStore } from '../../store/authStore';
import { userService } from '../../services/userService';
import { canManageChurchData } from '../../utils/permissions';
import { Club } from '../../constants';
import type { Student, StudentFormData } from '../../models/Student';
import type { User } from '../../models/User';
import { StudentFormDialog } from '../../components/forms';
import { StudentCard } from '../../components/students';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';

export default function StudentsPage() {
  const { user } = useAuthStore();
  const {
    students,
    isLoading,
    error,
    fetchStudents,
    deleteStudent,
    createStudent
  } = useStudentStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [tempAssignmentDialogOpen, setTempAssignmentDialogOpen] = useState(false);
  const [studentTransferDialogOpen, setStudentTransferDialogOpen] = useState(false);
  const [studentDialogOpen, setStudentDialogOpen] = useState(false);
  const [tempTeacherId, setTempTeacherId] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');
  const [fromTeacherId, setFromTeacherId] = useState('');
  const [toTeacherId, setToTeacherId] = useState('');
  const [transferStudents, setTransferStudents] = useState<Set<string>>(new Set());
  const [transferEndDate, setTransferEndDate] = useState('');
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const canManageAllStudents = canManageChurchData(user);

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

  useEffect(() => {
    if (user?.churchId) {
      fetchStudents();
    }
  }, [user?.churchId, fetchStudents]);

  // 선생님 ID로 선생님 이름을 찾는 함수
  const getTeacherName = (teacherId?: string) => {
    if (!teacherId) return '미배정';
    const teacher = teachers.find(t => t.uid === teacherId);
    return teacher?.displayName || '알 수 없음';
  };

  // 학생의 현재 담당 선생님 ID를 가져오는 함수
  const getCurrentTeacherId = (student: { tempAssignedTeacherId?: string; tempAssignedUntil?: Date | string; assignedTeacherId?: string }) => {
    // 임시 담당 선생님이 있고, 임시 담당 종료일이 아직 지나지 않은 경우
    if (student.tempAssignedTeacherId && student.tempAssignedUntil) {
      const now = new Date();
      const tempUntil = student.tempAssignedUntil instanceof Date ? student.tempAssignedUntil : new Date(student.tempAssignedUntil);
      if (tempUntil >= now) {
        return student.tempAssignedTeacherId;
      }
    }
    // 기본 담당 선생님
    return student.assignedTeacherId;
  };

  useEffect(() => {
    if (students) {
      const filtered = students.filter(student => {
        const teacherName = getTeacherName(student.assignedTeacherId);
        return student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          teacherName.toLowerCase().includes(searchTerm.toLowerCase());
      });
      setFilteredStudents(filtered);
    }
  }, [students, searchTerm, teachers]);

  const handleDeleteStudent = async (studentId: string) => {
    if (window.confirm('정말로 이 학생을 삭제하시겠습니까?')) {
      await deleteStudent(studentId);
    }
  };

  const handleEditStudent = (student: Student) => {
    setEditStudent(student);
    setEditDialogOpen(true);
  };

  const handleUpdateStudent = async (formData: StudentFormData) => {
    if (!editStudent) return;

    try {
      await useStudentStore.getState().updateStudent(editStudent.id, formData);
      setEditDialogOpen(false);
      setEditStudent(null);
      alert('학생 정보가 수정되었습니다.');
      fetchStudents(); // 목록 새로고침
    } catch (error) {
      console.error('학생 수정 실패:', error);
      alert('학생 수정에 실패했습니다.');
      throw error;
    }
  };

  // 학생 선택 토글
  const handleStudentSelect = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  // 전체 선택/해제
  const handleSelectAll = () => {
    if (selectedStudents.size === filteredStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredStudents.map(s => s.id)));
    }
  };

  // 임시 담당 설정
  const handleTempAssignment = async () => {
    if (!tempTeacherId || !tempEndDate) {
      alert('임시 담당 선생님과 종료일을 모두 선택해주세요.');
      return;
    }

    try {
      const endDate = new Date(tempEndDate);
      endDate.setHours(23, 59, 59, 999); // 종료일의 마지막 순간으로 설정

      for (const studentId of selectedStudents) {
        await useStudentStore.getState().updateStudent(studentId, {
          tempAssignedTeacherId: tempTeacherId,
          tempAssignedUntil: endDate,
        });
      }

      setSelectedStudents(new Set());
      setTempAssignmentDialogOpen(false);
      setTempTeacherId('');
      setTempEndDate('');
      alert('임시 담당 선생님이 설정되었습니다.');
    } catch (error) {
      console.error('임시 담당 설정 실패:', error);
      alert('임시 담당 설정에 실패했습니다.');
    }
  };

  // 임시 담당 취소
  const handleCancelTempAssignment = async () => {
    try {
      for (const studentId of selectedStudents) {
        await useStudentStore.getState().updateStudent(studentId, {
          tempAssignedTeacherId: undefined,
          tempAssignedUntil: undefined,
        });
      }

      setSelectedStudents(new Set());
      alert('임시 담당이 취소되었습니다.');
    } catch (error) {
      console.error('임시 담당 취소 실패:', error);
      alert('임시 담당 취소에 실패했습니다.');
    }
  };

  // 보내는 선생님이 변경될 때 해당 선생님의 학생들 가져오기
  const getStudentsByTeacher = (teacherId: string) => {
    return filteredStudents.filter(student => {
      const currentTeacher = getCurrentTeacherId(student);
      return currentTeacher === teacherId;
    });
  };

  // 학생 이동 처리
  const handleStudentTransfer = async () => {
    if (!fromTeacherId || !toTeacherId || !transferEndDate) {
      alert('보내는 선생님, 받는 선생님, 종료일을 모두 선택해주세요.');
      return;
    }

    if (fromTeacherId === toTeacherId) {
      alert('보내는 선생님과 받는 선생님이 같습니다.');
      return;
    }

    if (transferStudents.size === 0) {
      alert('이동할 학생을 선택해주세요.');
      return;
    }

    try {
      const endDate = new Date(transferEndDate);
      endDate.setHours(23, 59, 59, 999);

      for (const studentId of transferStudents) {
        await useStudentStore.getState().updateStudent(studentId, {
          tempAssignedTeacherId: toTeacherId,
          tempAssignedUntil: endDate,
        });
      }

      // 상태 초기화
      setStudentTransferDialogOpen(false);
      setFromTeacherId('');
      setToTeacherId('');
      setTransferStudents(new Set());
      setTransferEndDate('');

      alert(`${transferStudents.size}명의 학생이 임시로 이동되었습니다.`);
    } catch (error) {
      console.error('학생 이동 실패:', error);
      alert('학생 이동에 실패했습니다.');
    }
  };

  // 보내는 선생님 선택 시 초기화
  const handleFromTeacherChange = (teacherId: string) => {
    setFromTeacherId(teacherId);
    setTransferStudents(new Set()); // 학생 선택 초기화
    setToTeacherId(''); // 받는 선생님 초기화
  };

  const getClubText = (club: string) => {
    const clubMap: Record<string, string> = {
      [Club.SPARKS]: 'Sparks',
      [Club.TNT]: 'T&T',
      [Club.TREK]: 'Trek',
    };
    return clubMap[club] || club;
  };

  return (
    <div className="space-y-6">
      {/* 모바일 우선 헤더 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            {canManageAllStudents ? '학생 관리' : '학생 조회'}
          </h1>
          {selectedStudents.size > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {selectedStudents.size}명의 학생 선택됨
            </p>
          )}
        </div>
        <div className="flex gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
          {canManageAllStudents && selectedStudents.size > 0 && (
            <>
              <Button
                onClick={() => setTempAssignmentDialogOpen(true)}
                variant="outline"
                className="w-full sm:w-auto"
              >
                <UsersIcon className="w-4 h-4 mr-2" />
                임시 담당
              </Button>
              <Button
                onClick={handleCancelTempAssignment}
                variant="outline"
                className="w-full sm:w-auto"
              >
                <ClockIcon className="w-4 h-4 mr-2" />
                임시 취소
              </Button>
            </>
          )}
          {canManageAllStudents && (
            <>
              <Button
                onClick={() => setStudentTransferDialogOpen(true)}
                variant="default"
                className="flex-1 sm:w-auto"
              >
                <UsersIcon className="w-4 h-4 mr-2" />
                학생 이동
              </Button>
              <Button
                onClick={() => setStudentDialogOpen(true)}
                className="flex-1 sm:w-auto"
              >
                <AddIcon className="w-4 h-4 mr-2" />
                학생 추가
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 모바일 우선 검색 및 선택 */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative w-full sm:flex-1">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder={canManageAllStudents ? "학생 이름 또는 담당 선생님으로 검색" : "학생 이름으로 검색"}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        {canManageAllStudents && filteredStudents.length > 0 && (
          <div className="flex items-center gap-2">
            <Checkbox
              id="select-all"
              checked={selectedStudents.size === filteredStudents.length && filteredStudents.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <label htmlFor="select-all" className="text-sm font-medium">
              전체 선택
            </label>
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* 모바일 우선 학생 목록 */}
      {isLoading ? (
        <div className="text-center py-8">
          <p>로딩 중...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {searchTerm ? '검색 결과가 없습니다.' : '등록된 학생이 없습니다.'}
          </p>
        </div>
      ) : (
        // 카드 형태
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredStudents.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              teachers={teachers}
              isAdmin={canManageAllStudents}
              isSelected={selectedStudents.has(student.id)}
              onSelect={handleStudentSelect}
              onDelete={handleDeleteStudent}
              onEdit={handleEditStudent}
              onUpdate={fetchStudents}
            />
          ))}
        </div>
      )}

      {filteredStudents.length > 0 && (
        <div className="mt-4 text-sm text-muted-foreground">
          총 {filteredStudents.length}명의 학생
        </div>
      )}

      {/* 모바일 FAB 버튼 */}
      {canManageAllStudents && (
        <Button
          className="fixed bottom-4 right-4 rounded-full w-14 h-14 shadow-lg md:hidden"
          size="icon"
          onClick={() => setStudentDialogOpen(true)}
        >
          <AddIcon className="w-6 h-6" />
        </Button>
      )}

      {/* 임시 담당 설정 다이얼로그 */}
      <Dialog open={tempAssignmentDialogOpen} onOpenChange={setTempAssignmentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>임시 담당 선생님 설정</DialogTitle>
            <DialogDescription>
              선택된 {selectedStudents.size}명의 학생을 임시로 다른 선생님에게 배정합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                임시 담당 선생님
              </label>
              <Select value={tempTeacherId} onValueChange={setTempTeacherId}>
                <SelectTrigger>
                  <SelectValue placeholder="선생님을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.uid} value={teacher.uid}>
                      {teacher.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                임시 담당 종료일
              </label>
              <Input
                type="date"
                value={tempEndDate}
                onChange={(e) => setTempEndDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                style={{ colorScheme: 'light dark' }}
              />
              <p className="text-xs text-muted-foreground mt-1">
                종료일까지 임시 담당이 유지됩니다.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setTempAssignmentDialogOpen(false);
                setTempTeacherId('');
                setTempEndDate('');
              }}
            >
              취소
            </Button>
            <Button onClick={handleTempAssignment}>
              설정하기
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 학생 이동 다이얼로그 */}
      <Dialog open={studentTransferDialogOpen} onOpenChange={setStudentTransferDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>📚 학생 임시 이동</DialogTitle>
            <DialogDescription>
              선생님의 학생들을 다른 선생님에게 임시로 이동시킵니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* 선생님 선택 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  📤 보내는 선생님
                </label>
                <Select value={fromTeacherId} onValueChange={handleFromTeacherChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="선생님 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.uid} value={teacher.uid}>
                        {teacher.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  📥 받는 선생님
                </label>
                <Select value={toTeacherId} onValueChange={setToTeacherId}>
                  <SelectTrigger>
                    <SelectValue placeholder="선생님 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers
                      .filter(teacher => teacher.uid !== fromTeacherId)
                      .map((teacher) => (
                        <SelectItem key={teacher.uid} value={teacher.uid}>
                          {teacher.displayName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 종료일 설정 */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                🗓️ 임시 이동 종료일
              </label>
              <Input
                type="date"
                value={transferEndDate}
                onChange={(e) => setTransferEndDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full"
                style={{ colorScheme: 'light dark' }}
              />
              <p className="text-xs text-muted-foreground mt-1">
                이 날짜까지 임시 이동이 유지됩니다.
              </p>
            </div>

            {/* 학생 선택 */}
            {fromTeacherId && (
              <div>
                <label className="text-sm font-medium mb-3 block">
                  👥 이동할 학생 선택 ({transferStudents.size}명 선택됨)
                </label>
                <div className="border rounded-lg p-4 max-h-60 overflow-y-auto bg-muted">
                  {getStudentsByTeacher(fromTeacherId).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      해당 선생님의 학생이 없습니다.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-3">
                        <Checkbox
                          id="select-all-transfer"
                          checked={transferStudents.size === getStudentsByTeacher(fromTeacherId).length && getStudentsByTeacher(fromTeacherId).length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setTransferStudents(new Set(getStudentsByTeacher(fromTeacherId).map(s => s.id)));
                            } else {
                              setTransferStudents(new Set());
                            }
                          }}
                        />
                        <label htmlFor="select-all-transfer" className="text-sm font-medium">
                          전체 선택
                        </label>
                      </div>
                      {getStudentsByTeacher(fromTeacherId).map((student) => (
                        <div
                          key={student.id}
                          className={`flex items-center gap-3 p-2 rounded border ${transferStudents.has(student.id) ? 'bg-primary/10 border-primary' : 'bg-card border-border'
                            }`}
                        >
                          <Checkbox
                            checked={transferStudents.has(student.id)}
                            onCheckedChange={(checked) => {
                              const newSelected = new Set(transferStudents);
                              if (checked) {
                                newSelected.add(student.id);
                              } else {
                                newSelected.delete(student.id);
                              }
                              setTransferStudents(newSelected);
                            }}
                          />
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{student.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {getClubText(student.club)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setStudentTransferDialogOpen(false);
                setFromTeacherId('');
                setToTeacherId('');
                setTransferStudents(new Set());
                setTransferEndDate('');
              }}
            >
              취소
            </Button>
            <Button
              onClick={handleStudentTransfer}
              disabled={!fromTeacherId || !toTeacherId || !transferEndDate || transferStudents.size === 0}
            >
              학생 이동하기
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 학생 추가 다이얼로그 */}
      <StudentFormDialog
        open={studentDialogOpen}
        onOpenChange={setStudentDialogOpen}
        onSubmit={async (formData) => {
          await createStudent(formData);
        }}
        isLoading={isLoading}
      />

      {/* 학생 수정 다이얼로그 */}
      <StudentFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSubmit={handleUpdateStudent}
        isLoading={isLoading}
        student={editStudent || undefined}
      />
    </div>
  );
}
