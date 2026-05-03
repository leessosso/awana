import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { useStudentStore } from '../../store/studentStore';
import { useAuthStore } from '../../store/authStore';
import { useSparksHandbookStore } from '../../store/sparksHandbookStore';
import { useAttendanceStore } from '../../store/attendanceStore';
import { AttendanceStatus } from '../../models';
import { Club } from '../../constants';
import { SparksHandbook, JewelType } from '../../models/SparksHandbookProgress';
import type { JewelSection } from '../../models/SparksHandbookProgress';
import { generateJewelSections, sectionToString } from '../../constants/sparksHandbooks';
import {
  createSparksAchievementCardFilename,
  downloadPdf,
  generateSparksAchievementCardPdf,
} from '../../lib/pdf/generateSparksAchievementCardPdf';

export default function StudentProgressReportPage() {
  const navigate = useNavigate();
  const { studentId } = useParams<{ studentId: string }>();
  const { user } = useAuthStore();
  const { students, fetchStudents } = useStudentStore();
  const { studentProgresses, fetchStudentProgress } = useSparksHandbookStore();
  const { attendanceRecords, fetchAttendanceByStudent } = useAttendanceStore();

  const [loading, setLoading] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState(studentId || '');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState('');

  const student = students?.find((s) => s.id === selectedStudentId);
  const progress = selectedStudentId ? studentProgresses.get(selectedStudentId) || [] : [];
  const studentAttendance = attendanceRecords.filter(a => a.studentId === selectedStudentId);
  const sparksStudents = useMemo(
    () => students?.filter(s => s.club === Club.SPARKS) || [],
    [students]
  );

  useEffect(() => {
    if (user?.churchId) {
      fetchStudents();
    }
  }, [user?.churchId, fetchStudents]);

  useEffect(() => {
    if (selectedStudentId && user?.churchId) {
      fetchStudentProgress(selectedStudentId, user.churchId);
      fetchAttendanceByStudent(selectedStudentId, user.churchId);
    }
  }, [selectedStudentId, user?.churchId, fetchStudentProgress, fetchAttendanceByStudent]);

  useEffect(() => {
    if (students && attendanceRecords) {
      setLoading(false);
    }
  }, [students, attendanceRecords]);

  useEffect(() => {
    if (!selectedStudentId && sparksStudents.length > 0) {
      const firstStudent = sparksStudents[0];
      setSelectedStudentId(firstStudent.id);
      navigate(`/reports/student-progress/${firstStudent.id}`, { replace: true });
    }
  }, [selectedStudentId, sparksStudents, navigate]);

  // 특정 섹션의 완료 날짜 가져오기
  const getSectionDate = (handbook: SparksHandbook, jewelType: JewelType, section: JewelSection): string => {
    const progressItem = progress.find(
      (p) =>
        p.handbook === handbook &&
        p.jewelType === jewelType &&
        p.section.major === section.major &&
        p.section.minor === section.minor
    );

    if (progressItem) {
      const date = progressItem.completedDate;
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }
    return '';
  };

  // 월별 출석 통계 계산
  const getMonthlyAttendance = (month: number) => {
    const monthAttendance = studentAttendance.filter((a) => a.date.getMonth() + 1 === month);
    const presentCount = monthAttendance.filter((a) => a.status === AttendanceStatus.PRESENT).length;
    return presentCount > 0 ? presentCount.toString() : '';
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!student) {
      return;
    }

    setIsGeneratingPdf(true);
    setPdfError('');

    try {
      const pdfBytes = await generateSparksAchievementCardPdf({
        student,
        progress,
        attendance: studentAttendance,
        churchName: user?.churchName,
      });

      downloadPdf(pdfBytes, createSparksAchievementCardFilename(student.name));
    } catch (error) {
      console.error('Sparks 성취기록카드 PDF 생성 실패:', error);
      setPdfError(error instanceof Error ? error.message : 'PDF 생성에 실패했습니다.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleStudentChange = (newStudentId: string) => {
    setSelectedStudentId(newStudentId);
    setPdfError('');
    navigate(`/reports/student-progress/${newStudentId}`, { replace: true });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const sections = generateJewelSections();
  const currentYear = new Date().getFullYear();
  const months = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; // 3월~12월

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <Button variant="outline" onClick={() => navigate('/reports')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          뒤로가기
        </Button>

        <div className="w-full sm:w-48">
          <Select
            value={selectedStudentId}
            onValueChange={handleStudentChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="학생 선택" />
            </SelectTrigger>
            <SelectContent>
              {sparksStudents.map((student) => (
                <SelectItem key={student.id} value={student.id}>
                  {student.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-2" />
          인쇄
        </Button>

        <Button onClick={handleDownloadPdf} disabled={isGeneratingPdf}>
          <Download className="w-4 h-4 mr-2" />
          {isGeneratingPdf ? 'PDF 생성 중...' : '공식 PDF 다운로드'}
        </Button>

        {pdfError && (
          <p className="text-sm text-red-600">{pdfError}</p>
        )}
      </div>

      {!student && (
        <div className="flex justify-center items-center min-h-96">
          <p className="text-muted-foreground">
            {sparksStudents.length > 0 ? '학생을 선택해주세요.' : 'Sparks 학생이 없습니다.'}
          </p>
        </div>
      )}

      {student && (
      <div className="bg-white p-4 max-w-[210mm] mx-auto print:p-2 print:max-w-full print:m-0">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-2 pb-1 border-b-2 border-black">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold">
              🔥 SPARKS 성취기록카드
            </h1>
          </div>
          <p className="text-xs">{currentYear}년</p>
        </div>

        {/* 학생 정보 */}
        <div className="mb-2">
          <table className="w-full border-collapse text-xs">
            <tbody>
              <tr>
                <td className="border border-black p-0.5 font-bold w-[10%]">이름</td>
                <td className="border border-black p-0.5 w-[15%]">{student.name}</td>
                <td className="border border-black p-0.5 font-bold w-[10%]">성별</td>
                <td className="border border-black p-0.5 w-[15%]">{student.gender === 'male' ? '남' : '여'}</td>
                <td className="border border-black p-0.5 font-bold w-[10%]">생년월일</td>
                <td className="border border-black p-0.5 w-[15%]">
                  {student.birthDate ? new Date(student.birthDate).toLocaleDateString('ko-KR').slice(2) : '-'}
                </td>
                <td className="border border-black p-0.5 font-bold w-[10%]">출석교회</td>
                <td className="border border-black p-0.5 w-[15%]">-</td>
              </tr>
              <tr>
                <td className="border border-black p-0.5 font-bold">가족관계</td>
                <td className="border border-black p-0.5" colSpan={2}>{student.parentName || '-'}</td>
                <td className="border border-black p-0.5 font-bold">전화번호</td>
                <td className="border border-black p-0.5" colSpan={4}>{student.parentPhone || '-'}</td>
              </tr>
              <tr>
                <td className="border border-black p-0.5 font-bold">클럽등록일</td>
                <td className="border border-black p-0.5" colSpan={7}>
                  {student.createdAt ? new Date(student.createdAt).toLocaleDateString('ko-KR') : '-'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 전체 진도표 */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[7px] leading-tight">
            <thead>
              <tr>
                {/* 왼쪽: 출결 */}
                <th className="border border-black p-0.5 w-[25px]" rowSpan={3}>월</th>
                <th className="border border-black p-0.5 w-[25px]" rowSpan={3}>주</th>
                <th className="border border-black p-0.5 w-[30px]" rowSpan={3}>일단<br/>과제</th>
                <th className="border border-black p-0.5 w-[25px]" rowSpan={3}>송금</th>

                {/* 오른쪽: 핸드북 3개 */}
                <th className="border border-black p-0.5" colSpan={12}>핸드북</th>
                <th className="border border-black p-0.5 w-[30px]" rowSpan={3}>핸드북<br/>복습</th>
              </tr>
              <tr>
                {/* 행글라이더 */}
                <th className="border border-black p-0.5 bg-red-100" colSpan={4}>행글라이더</th>
                {/* 윙러너 */}
                <th className="border border-black p-0.5 bg-blue-100" colSpan={4}>윙러너</th>
                {/* 스카이스토머 */}
                <th className="border border-black p-0.5 bg-green-100" colSpan={4}>스카이스토머</th>
              </tr>
              <tr>
                {/* 행글라이더 */}
                <th className="border border-black p-0.5 w-[30px] bg-red-50">보석</th>
                <th className="border border-black p-0.5 w-[35px] bg-red-50">빨강</th>
                <th className="border border-black p-0.5 w-[30px] bg-red-50">보석</th>
                <th className="border border-black p-0.5 w-[35px] bg-red-50">초록</th>
                {/* 윙러너 */}
                <th className="border border-black p-0.5 w-[30px] bg-blue-50">보석</th>
                <th className="border border-black p-0.5 w-[35px] bg-blue-50">빨강</th>
                <th className="border border-black p-0.5 w-[30px] bg-blue-50">보석</th>
                <th className="border border-black p-0.5 w-[35px] bg-blue-50">초록</th>
                {/* 스카이스토머 */}
                <th className="border border-black p-0.5 w-[30px] bg-green-50">보석</th>
                <th className="border border-black p-0.5 w-[35px] bg-green-50">빨강</th>
                <th className="border border-black p-0.5 w-[30px] bg-green-50">보석</th>
                <th className="border border-black p-0.5 w-[35px] bg-green-50">초록</th>
              </tr>
            </thead>
            <tbody>
              {/* 16개 섹션 행 */}
              {sections.map((section, idx) => {
                const monthIdx = Math.floor(idx / 2);
                const month = months[monthIdx] || 12;
                const weekNum = (idx % 4) + 1;

                return (
                  <tr key={idx} className="text-center">
                    {/* 월 - 2개씩 병합 */}
                    {idx % 2 === 0 && (
                      <td className="border border-black p-0.5 font-bold" rowSpan={2}>
                        {month}
                      </td>
                    )}

                    {/* 주차 */}
                    <td className="border border-black p-0.5">{weekNum}</td>

                    {/* 일단과제 (출석) - 2개씩 병합 */}
                    {idx % 2 === 0 && (
                      <td className="border border-black p-0.5" rowSpan={2}>
                        {getMonthlyAttendance(month)}
                      </td>
                    )}

                    {/* 송금 */}
                    <td className="border border-black p-0.5"></td>

                    {/* 행글라이더 */}
                    <td className="border border-black p-0.5 text-[7px] bg-red-50">
                      {sectionToString(section)}
                    </td>
                    <td className="border border-black p-0.5 text-[7px] bg-red-50">
                      {getSectionDate(SparksHandbook.HANG_GLIDER, JewelType.RED, section)}
                    </td>
                    <td className="border border-black p-0.5 text-[7px] bg-red-50">
                      {sectionToString(section)}
                    </td>
                    <td className="border border-black p-0.5 text-[7px] bg-red-50">
                      {getSectionDate(SparksHandbook.HANG_GLIDER, JewelType.GREEN, section)}
                    </td>

                    {/* 윙러너 */}
                    <td className="border border-black p-0.5 text-[7px] bg-blue-50">
                      {sectionToString(section)}
                    </td>
                    <td className="border border-black p-0.5 text-[7px] bg-blue-50">
                      {getSectionDate(SparksHandbook.WING_RUNNER, JewelType.RED, section)}
                    </td>
                    <td className="border border-black p-0.5 text-[7px] bg-blue-50">
                      {sectionToString(section)}
                    </td>
                    <td className="border border-black p-0.5 text-[7px] bg-blue-50">
                      {getSectionDate(SparksHandbook.WING_RUNNER, JewelType.GREEN, section)}
                    </td>

                    {/* 스카이스토머 */}
                    <td className="border border-black p-0.5 text-[7px] bg-green-50">
                      {sectionToString(section)}
                    </td>
                    <td className="border border-black p-0.5 text-[7px] bg-green-50">
                      {getSectionDate(SparksHandbook.SKY_STORMER, JewelType.RED, section)}
                    </td>
                    <td className="border border-black p-0.5 text-[7px] bg-green-50">
                      {sectionToString(section)}
                    </td>
                    <td className="border border-black p-0.5 text-[7px] bg-green-50">
                      {getSectionDate(SparksHandbook.SKY_STORMER, JewelType.GREEN, section)}
                    </td>

                    {/* 핸드북 복습 */}
                    <td className="border border-black p-0.5"></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 페이지 하단 정보 */}
        <div className="mt-1 pt-0.5 border-t border-gray-300">
          <p className="text-xs text-muted-foreground">
            * 날짜 형식: 월/일 | 일단과제: 해당 월 출석 횟수
          </p>
        </div>
      </div>
      )}

      {/* 인쇄 스타일 */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}
