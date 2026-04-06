import { useEffect, useState } from 'react';
import { User as UserIcon, CheckCircle2, Circle, CheckCircle, Calendar, Plus } from 'lucide-react';
import { useMobile } from '../../hooks/useMobile';
import { useAttendanceStore } from '../../store/attendanceStore';
import { useStudentStore } from '../../store/studentStore';
import { useAuthStore } from '../../store/authStore';
import { userService } from '../../services/userService';
import { studentService } from '../../services/studentService';
import { AttendanceStatus } from '../../models/Attendance';
import { canManageChurchData, getScopedTeacherId } from '../../utils/permissions';
import { Club } from '../../constants/clubs';
import type { User } from '../../models/User';
import type { Student } from '../../models/Student';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../components/ui/dialog';
import { Card, CardContent } from '../../components/ui';
import { Badge } from '../../components/ui';
import { Alert, AlertDescription } from '../../components/ui';
import { Avatar, AvatarFallback } from '../../components/ui';
import { DataTable } from '../../components/data-visualization/DataTable';
import { StudentFormDialog } from '../../components/forms';
import type { ColumnDef } from '@tanstack/react-table';

type StudentWithAttendance = {
  id: string;
  name: string;
  club: Club;
  assignedTeacherId?: string;
  tempAssignedTeacherId?: string;
  tempAssignedUntil?: Date;
  attendance?: AttendanceStatus;
  teacherName: string;
};

export default function AttendancePage() {
  const isMobile = useMobile();
  const { user } = useAuthStore();
  const {
    attendances,
    isLoading,
    error,
    fetchAttendances,
    createAttendance,
    updateAttendance,
    clearError
  } = useAttendanceStore();
  const { createStudent } = useStudentStore();

  const [students, setStudents] = useState<Student[]>([]);
  const [isStudentLoading, setIsStudentLoading] = useState(false);

  // 한국 시간 기준 오늘 날짜 계산
  const getKoreanDateString = () => {
    const now = new Date();
    // 한국 시간으로 변환 (UTC+9)
    const koreanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    return koreanTime.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(getKoreanDateString());
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [selectedAttendances, setSelectedAttendances] = useState<Set<string>>(new Set());
  const [teachers, setTeachers] = useState<User[]>([]);
  const [studentDialogOpen, setStudentDialogOpen] = useState(false);
  const studentIdSet = new Set((students || []).map(student => student.id));

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

  // 학생 목록 가져오기 (출석관리 권한에 따라 전체/담당 학생만 조회)
  const fetchStudentsForAttendance = async () => {
    if (!user?.churchId) return;

    setIsStudentLoading(true);
    try {
      // 교회 전체 관리 권한이 있으면 전체 학생 조회, 아니면 담당 학생만 조회
      const teacherId = canManageChurchData(user) ? undefined : getScopedTeacherId(user);
      const studentList = await studentService.getStudentsByChurch(user.churchId, teacherId);
      setStudents(studentList);
    } catch (error) {
      console.error('학생 목록 가져오기 실패:', error);
    } finally {
      setIsStudentLoading(false);
    }
  };

  useEffect(() => {
    if (user?.churchId) {
      fetchStudentsForAttendance();
      fetchAttendances(user.churchId, selectedDate);
    }
  }, [user?.churchId, selectedDate, fetchAttendances]);

  const handleOpenAttendanceDialog = () => {
    // 해당 날짜의 기존 출결 데이터를 로드
    const existingAttendances = attendances?.filter(a =>
      a.date.toISOString().split('T')[0] === selectedDate &&
      studentIdSet.has(a.studentId)
    ) || [];

    const presentStudentIds = new Set(
      existingAttendances
        .filter(a => a.status === AttendanceStatus.PRESENT)
        .map(a => a.studentId)
    );

    setSelectedAttendances(presentStudentIds);
    setAttendanceDialogOpen(true);
  };

  const handleSaveAttendance = async () => {
    if (!user?.churchId) return;

    try {
      // 기존 출결 데이터 삭제 후 새로 생성
      const existingAttendances = attendances?.filter(a =>
        a.date.toISOString().split('T')[0] === selectedDate &&
        studentIdSet.has(a.studentId)
      ) || [];

      // 각 학생에 대해 출결 기록 생성/업데이트
      for (const student of students || []) {
        const isPresent = selectedAttendances.has(student.id);
        const existingAttendance = existingAttendances.find(a => a.studentId === student.id);

        if (existingAttendance) {
          // 기존 기록 업데이트
          await updateAttendance(existingAttendance.id, {
            ...existingAttendance,
            status: isPresent ? AttendanceStatus.PRESENT : AttendanceStatus.ABSENT,
          });
        } else {
          // 새 기록 생성
          const teacherId = getCurrentTeacherId(student);
          const teacherName = getTeacherName(teacherId);
          await createAttendance({
            studentId: student.id,
            date: new Date(selectedDate),
            status: isPresent ? AttendanceStatus.PRESENT : AttendanceStatus.ABSENT,
            studentName: student.name,
            teacherId: teacherId || '',
            teacherName: teacherName,
          });
        }
      }

      await fetchAttendances(user.churchId, selectedDate);
      setAttendanceDialogOpen(false);
    } catch (error) {
      console.error('출결 저장 실패:', error);
    }
  };

  const handleStudentToggle = (studentId: string) => {
    const newSelected = new Set(selectedAttendances);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedAttendances(newSelected);
  };

  // 선생님 ID로 선생님 이름을 찾는 함수
  const getTeacherName = (teacherId?: string) => {
    if (!teacherId) return '미배정';
    const teacher = teachers.find(t => t.uid === teacherId);
    return teacher?.displayName || '알 수 없음';
  };

  // 클럽을 텍스트로 변환하는 함수
  const getClubText = (club: Club): string => {
    const clubMap: Record<Club, string> = {
      [Club.SPARKS]: 'Sparks',
      [Club.TNT]: 'T&T',
      [Club.TREK]: 'Trek',
    };
    return clubMap[club] || club;
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

  const getAttendanceStats = () => {
    if (!attendances) return { present: 0, absent: 0, total: 0 };

    const dayAttendances = attendances.filter(a =>
      a.date.toISOString().split('T')[0] === selectedDate &&
      studentIdSet.has(a.studentId)
    );

    const present = dayAttendances.filter(a => a.status === AttendanceStatus.PRESENT).length;
    const absent = dayAttendances.filter(a => a.status === AttendanceStatus.ABSENT).length;
    const total = students?.length || 0;

    return { present, absent, total };
  };

  const stats = getAttendanceStats();

  // 테이블 데이터 준비
  const tableData: StudentWithAttendance[] = (students || []).map(student => {
    const attendance = attendances?.find(a =>
      a.studentId === student.id &&
      a.date.toISOString().split('T')[0] === selectedDate
    );
    return {
      id: student.id,
      name: student.name,
      club: student.club,
      assignedTeacherId: student.assignedTeacherId,
      tempAssignedTeacherId: student.tempAssignedTeacherId,
      tempAssignedUntil: student.tempAssignedUntil,
      attendance: attendance?.status,
      teacherName: getTeacherName(getCurrentTeacherId(student)),
    };
  });

  const columns: ColumnDef<StudentWithAttendance>[] = [
    {
      accessorKey: 'name',
      header: '학생 이름',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.name}</div>
      ),
    },
    {
      accessorKey: 'club',
      header: '클럽',
      cell: ({ row }) => (
        <Badge variant="outline">
          {getClubText(row.original.club)}
        </Badge>
      ),
    },
    {
      accessorKey: 'teacherName',
      header: '담당 선생님',
    },
    {
      accessorKey: 'attendance',
      header: '출결 상태',
      cell: ({ row }) => {
        const attendance = row.original.attendance;
        if (!attendance) {
          return <Badge variant="outline">미등록</Badge>;
        }
        return (
          <div className="flex items-center gap-2">
            {attendance === AttendanceStatus.PRESENT ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <Circle className="h-5 w-5 text-red-500" />
            )}
            <span className={`text-sm ${
              attendance === AttendanceStatus.PRESENT
                ? 'text-green-500'
                : 'text-red-500'
            }`}>
              {attendance === AttendanceStatus.PRESENT ? '출석' : '결석'}
            </span>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* 모바일 우선 헤더 */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold">출결 관리</h1>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              onClick={() => setStudentDialogOpen(true)}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              학생 추가
            </Button>
            <Button
              onClick={handleOpenAttendanceDialog}
              className="w-full sm:w-auto"
            >
              <Calendar className="mr-2 h-4 w-4" />
              출결 체크
            </Button>
          </div>
        </div>

        {/* 날짜 표시 및 통계 배지들 */}
        <div className="flex gap-2 items-center justify-between overflow-x-auto">
          <div className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap">
            <Calendar className="h-4 w-4" />
            <span className={`font-medium ${selectedDate === getKoreanDateString() ? 'text-primary font-semibold' : ''}`}>
              {new Date(selectedDate).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>

          <div className="flex gap-2 whitespace-nowrap">
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500">
              출석: {stats.present}
            </Badge>
            <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500">
              결석: {stats.absent}
            </Badge>
            <Badge variant="outline">
              총원: {stats.total}
            </Badge>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={clearError}
              className="ml-4 text-sm underline"
            >
              닫기
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* 모바일 우선 학생 출결 목록 */}
      {isLoading ? (
        <div className="text-center py-8">
          <p>로딩 중...</p>
        </div>
      ) : students && students.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">등록된 학생이 없습니다.</p>
        </div>
      ) : isMobile ? (
        // 모바일: 카드 형태
        <div className="flex flex-col gap-4">
          {students?.map((student) => {
            const attendance = attendances?.find(a =>
              a.studentId === student.id &&
              a.date.toISOString().split('T')[0] === selectedDate
            );

            return (
              <Card key={student.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <Avatar className="h-10 w-10 bg-primary">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          <UserIcon className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold">{student.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {getClubText(student.club)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            담당: {getTeacherName(getCurrentTeacherId(student))}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      {attendance ? (
                        <div className="flex items-center gap-2">
                          {attendance.status === AttendanceStatus.PRESENT ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-red-500" />
                          )}
                          <span className={`text-sm ${
                            attendance.status === AttendanceStatus.PRESENT
                              ? 'text-green-500'
                              : 'text-red-500'
                          }`}>
                            {attendance.status === AttendanceStatus.PRESENT ? '출석' : '결석'}
                          </span>
                        </div>
                      ) : (
                        <Badge variant="outline">미등록</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        // 데스크톱: 테이블 형태
        <DataTable
          data={tableData}
          columns={columns}
          searchable={false}
        />
      )}

      {/* 모바일 출결 체크 FAB */}
      {isMobile && !attendanceDialogOpen && !studentDialogOpen && (
        <>
          <Button
            className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg z-50 bg-muted hover:bg-muted/80 border-2 border-primary"
            onClick={() => setStudentDialogOpen(true)}
            variant="outline"
            style={{ zIndex: 9999 }}
          >
            <Plus className="h-6 w-6" />
          </Button>
          <Button
            className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg z-50 bg-primary hover:bg-primary/90"
            onClick={handleOpenAttendanceDialog}
            style={{ zIndex: 9999 }}
          >
            <Calendar className="h-6 w-6" />
          </Button>
        </>
      )}

      {/* 출결 체크 다이얼로그 */}
      <Dialog open={attendanceDialogOpen} onOpenChange={setAttendanceDialogOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader className="text-center pb-2">
            <DialogTitle className="text-xl font-bold">📅 출결 체크</DialogTitle>
            <DialogDescription className="text-base">
              {selectedDate} 출결 현황
            </DialogDescription>
          </DialogHeader>

          {/* 날짜 선택 */}
          <div className="mb-4">
            <label className="text-sm font-medium mb-2 block">
              📅 출결 날짜 선택
            </label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full"
              style={{ colorScheme: 'light dark' }}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {selectedDate === getKoreanDateString()
                ? "오늘의 출결을 확인하고 있습니다."
                : `${new Date(selectedDate).toLocaleDateString('ko-KR')}의 출결을 확인하고 있습니다.`
              }
            </p>
          </div>

          {/* 학생 선택 리스트 */}
          <div className="max-h-60 overflow-y-auto space-y-2">
            {students?.map((student) => (
              <div
                key={student.id}
                onClick={() => handleStudentToggle(student.id)}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer ${
                  selectedAttendances.has(student.id)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card border-border'
                }`}
              >
                <span className="font-medium">
                  {student.name} ({getClubText(student.club)})
                </span>
                <CheckCircle
                  className={`h-5 w-5 ${
                    selectedAttendances.has(student.id) ? 'text-primary-foreground' : 'text-muted-foreground'
                  }`}
                />
              </div>
            ))}
          </div>

          <p className="text-sm text-muted-foreground text-center mt-4 mb-6">
            출석한 학생을 선택해주세요
          </p>

          <div className="flex justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => setAttendanceDialogOpen(false)}
              className="px-6 py-2"
            >
              취소
            </Button>
            <Button
              onClick={handleSaveAttendance}
              className="px-6 py-2 shadow-md hover:shadow-lg transition-all"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              저장하기
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
          await fetchStudentsForAttendance(); // 학생 목록 새로고침
        }}
        isLoading={isStudentLoading}
      />
    </div>
  );
}
