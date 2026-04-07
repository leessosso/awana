import { useEffect, useState } from 'react';
import { User as UserIcon, CheckCircle2, Circle, Calendar, Plus } from 'lucide-react';
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

  const handleAttendanceChange = async (student: Student, status: AttendanceStatus) => {
    if (!user?.churchId) return;

    try {
      const existingAttendances = attendances?.filter(a =>
        a.date.toISOString().split('T')[0] === selectedDate &&
        a.studentId === student.id
      ) || [];

      const existingAttendance = existingAttendances[0];
      if (existingAttendance) {
        await updateAttendance(existingAttendance.id, {
          ...existingAttendance,
          status,
        });
      } else {
        const teacherId = getCurrentTeacherId(student);
        const teacherName = getTeacherName(teacherId);
        await createAttendance({
          studentId: student.id,
          date: new Date(selectedDate),
          status,
          studentName: student.name,
          teacherId: teacherId || '',
          teacherName: teacherName,
        });
      }

      await fetchAttendances(user.churchId, selectedDate);
    } catch (error) {
      console.error('출결 변경 실패:', error);
    }
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
    {
      id: 'actions',
      header: '바로 체크',
      cell: ({ row }) => {
        const student = students.find(item => item.id === row.original.id);
        if (!student) return null;

        return (
          <div className="flex items-center gap-2">
            <Button
              className="h-11 px-5 text-base"
              variant={row.original.attendance === AttendanceStatus.PRESENT ? 'default' : 'outline'}
              onClick={() => handleAttendanceChange(student, AttendanceStatus.PRESENT)}
            >
              출석
            </Button>
            <Button
              className="h-11 px-5 text-base"
              variant={row.original.attendance === AttendanceStatus.ABSENT ? 'default' : 'outline'}
              onClick={() => handleAttendanceChange(student, AttendanceStatus.ABSENT)}
            >
              결석
            </Button>
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
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full sm:w-[180px]"
              style={{ colorScheme: 'light dark' }}
            />
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
                      <div className="flex flex-col items-end gap-2">
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
                        <div className="flex items-center gap-2">
                          <Button
                            className="h-11 px-5 text-base"
                            variant={attendance?.status === AttendanceStatus.PRESENT ? 'default' : 'outline'}
                            onClick={() => handleAttendanceChange(student, AttendanceStatus.PRESENT)}
                          >
                            출석
                          </Button>
                          <Button
                            className="h-11 px-5 text-base"
                            variant={attendance?.status === AttendanceStatus.ABSENT ? 'default' : 'outline'}
                            onClick={() => handleAttendanceChange(student, AttendanceStatus.ABSENT)}
                          >
                            결석
                          </Button>
                        </div>
                      </div>
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
      {isMobile && !studentDialogOpen && (
        <>
          <Button
            className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg z-50 bg-muted hover:bg-muted/80 border-2 border-primary"
            onClick={() => setStudentDialogOpen(true)}
            variant="outline"
            style={{ zIndex: 9999 }}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </>
      )}

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
