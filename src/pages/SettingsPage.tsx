import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { ThemeSelector } from '../components/ui/ThemeSelector';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Alert, AlertDescription } from '../components/ui/Alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { useAuthStore } from '../store/authStore';
import { userService } from '../services/userService';
import { createTeacherAccount } from '../services/teacherAccountService';
import { updateCurrentUserPassword } from '../services/authService';
import type { User } from '../models/User';
import { TeacherPosition, type TeacherProgram, type TeacherTeam } from '../models/User';
import { TEACHER_POSITIONS, getPositionLabel } from '../constants/teacherPositions';
import {
  TEACHER_PROGRAM_OPTIONS,
  TEACHER_TEAM_OPTIONS,
  getTeacherProgramLabel,
  getTeacherTeamLabel,
} from '../constants/teacherAssignment';
import { canManageUsers } from '../utils/permissions';
import { normalizeLoginInput } from '../utils/loginIdentity';

const INITIAL_TEACHER_PASSWORD = '123456';
const DEFAULT_TEACHER_PROGRAM: TeacherProgram = 'Sparks';
const DEFAULT_TEACHER_TEAM: TeacherTeam = 'yellow';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [teachers, setTeachers] = useState<User[]>([]);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccessMessage, setPasswordSuccessMessage] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState('');
  const [position, setPosition] = useState<TeacherPosition>(TeacherPosition.ASSISTANT);
  const [program, setProgram] = useState<TeacherProgram>(DEFAULT_TEACHER_PROGRAM);
  const [team, setTeam] = useState<TeacherTeam>(DEFAULT_TEACHER_TEAM);
  const [isSavingTeacherId, setIsSavingTeacherId] = useState<string | null>(null);
  const [editingAssignments, setEditingAssignments] = useState<
    Record<string, {
      position: TeacherPosition
      program: TeacherProgram
      team: TeacherTeam
    }>
  >({});
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const isUserManager = canManageUsers(user);
  const canRenderTeacherSettings = isUserManager && !!user?.churchId;
  const previewLoginId = normalizeLoginInput(displayName);

  const loadTeachers = useCallback(async () => {
    if (!user?.churchId || !canRenderTeacherSettings) {
      return;
    }

    setIsLoadingTeachers(true);
    try {
      const teacherList = await userService.getTeachersByChurch(user.churchId);
      setTeachers(teacherList);
      setEditingAssignments(
        teacherList.reduce((acc, teacher) => ({
          ...acc,
          [teacher.uid]: {
            position: teacher.position || TeacherPosition.ASSISTANT,
            program: teacher.program || DEFAULT_TEACHER_PROGRAM,
            team: teacher.team || DEFAULT_TEACHER_TEAM,
          },
        }), {} as Record<string, {
          position: TeacherPosition
          program: TeacherProgram
          team: TeacherTeam
        }>)
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '선생님 목록을 불러오지 못했습니다.');
    } finally {
      setIsLoadingTeachers(false);
    }
  }, [canRenderTeacherSettings, user?.churchId]);

  useEffect(() => {
    void loadTeachers();
  }, [loadTeachers]);

  const handleCreateTeacher = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const currentUser = user;
    if (!canRenderTeacherSettings || !currentUser?.churchId || !currentUser?.churchName) {
      setError('관리자 권한이 필요합니다.');
      return;
    }

    const normalizedName = displayName.trim().normalize('NFC');
    if (!/^[a-z0-9가-힣ㄱ-ㅎㅏ-ㅣ._-]{2,30}$/i.test(normalizedName)) {
      setError('이름(로그인 아이디)은 한글/영문/숫자/._- 조합으로 2~30자여야 합니다.');
      return;
    }

    setIsCreating(true);
    try {
      const createdTeacher = await createTeacherAccount({
        displayName: normalizedName,
        loginId: normalizedName,
        password: INITIAL_TEACHER_PASSWORD,
        churchId: currentUser.churchId,
        churchName: currentUser.churchName,
        position,
        program,
        team,
      });
      setDisplayName('');
      setPosition(TeacherPosition.ASSISTANT);
      setProgram(DEFAULT_TEACHER_PROGRAM);
      setTeam(DEFAULT_TEACHER_TEAM);
      setSuccessMessage(
        `${createdTeacher.displayName} 선생님 계정을 생성했습니다. 로그인 아이디는 ${createdTeacher.loginId}이고, 초기 비밀번호는 ${INITIAL_TEACHER_PASSWORD} 입니다.`
      );
      await loadTeachers();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : '선생님 계정 생성에 실패했습니다.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSaveTeacherAssignment = async (teacher: User) => {
    const assignment = editingAssignments[teacher.uid];
    if (!assignment) {
      setError('수정할 선생님 정보를 찾을 수 없습니다.');
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setIsSavingTeacherId(teacher.uid);
    try {
      await userService.updateTeacherAssignment(teacher.uid, assignment);
      setSuccessMessage(`${teacher.displayName} 선생님의 소속 정보를 저장했습니다.`);
      await loadTeachers();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : '선생님 정보 저장에 실패했습니다.');
    } finally {
      setIsSavingTeacherId(null);
    }
  };

  const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError(null);
    setPasswordSuccessMessage(null);

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordError('모든 비밀번호 항목을 입력해주세요.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('새 비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await updateCurrentUserPassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPasswordSuccessMessage('비밀번호가 변경되었습니다.');
    } catch (passwordUpdateError) {
      setPasswordError(
        passwordUpdateError instanceof Error
          ? passwordUpdateError.message
          : '비밀번호 변경에 실패했습니다.'
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">설정</h1>
        <p className="text-muted-foreground mt-2">
          테마 및 앱 설정을 관리할 수 있습니다.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>테마 설정</CardTitle>
          <CardDescription>
            앱의 색상 테마와 모드를 변경할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeSelector />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>내 비밀번호 변경</CardTitle>
          <CardDescription>
            선생님은 로그인 후 언제든지 본인 비밀번호를 변경할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(passwordError || passwordSuccessMessage) && (
            <Alert variant={passwordError ? 'destructive' : 'default'}>
              <AlertDescription>{passwordError || passwordSuccessMessage}</AlertDescription>
            </Alert>
          )}
          <form className="grid gap-4 md:grid-cols-2 mt-4" onSubmit={handleChangePassword}>
            <Input
              type="password"
              placeholder="현재 비밀번호"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              disabled={isChangingPassword}
              required
            />
            <div />
            <Input
              type="password"
              placeholder="새 비밀번호 (6자 이상)"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              disabled={isChangingPassword}
              required
            />
            <Input
              type="password"
              placeholder="새 비밀번호 확인"
              value={confirmNewPassword}
              onChange={(event) => setConfirmNewPassword(event.target.value)}
              disabled={isChangingPassword}
              required
            />
            <div className="md:col-span-2">
              <Button type="submit" variant="secondary" disabled={isChangingPassword}>
                {isChangingPassword ? '변경 중...' : '내 비밀번호 변경'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {canRenderTeacherSettings && (
        <>
          {(error || successMessage) && (
            <Alert variant={error ? 'destructive' : 'default'}>
              <AlertDescription>{error || successMessage}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>선생님 계정 등록</CardTitle>
              <CardDescription>
                이름을 입력하면 로그인 아이디가 자동으로 생성되고, 초기 비밀번호는 고정값으로 설정됩니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreateTeacher}>
                <div className="space-y-2">
                  <label className="text-sm font-medium">선생님 이름</label>
                  <Input
                    placeholder="선생님 이름 (동명이인은 A/B/C 포함)"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    required
                    disabled={isCreating}
                  />
                </div>
                <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                  로그인 아이디: {previewLoginId || '이름 입력 후 자동 생성'}
                </div>
                <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                  초기 비밀번호: {INITIAL_TEACHER_PASSWORD}
                </div>
                <Select
                  value={position}
                  onValueChange={(value) => setPosition(value as TeacherPosition)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="직책 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEACHER_POSITIONS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={program}
                  onValueChange={(value) => setProgram(value as TeacherProgram)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="소속 클럽 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEACHER_PROGRAM_OPTIONS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={team}
                  onValueChange={(value) => setTeam(value as TeacherTeam)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="소속 팀 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEACHER_TEAM_OPTIONS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="md:col-span-2">
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? '생성 중...' : '선생님 계정 생성'}
                  </Button>
                </div>
                <div className="md:col-span-2 rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground">
                  생성 후 안내: 1) 이름(로그인 아이디)과 초기 비밀번호 전달 2) 첫 로그인 후 설정에서 비밀번호 변경 안내
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>계정 변경 안내</CardTitle>
              <CardDescription>
                Spark 플랜에서는 서버 함수 없이 타인 비밀번호를 직접 변경할 수 없습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                <li>아이디/비밀번호 변경이 필요하면 새 계정을 생성해서 안내해주세요.</li>
                <li>Blaze 플랜 전환 후 Cloud Functions를 사용하면 관리자 수정 기능을 안전하게 추가할 수 있습니다.</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>등록된 선생님 계정</CardTitle>
              <CardDescription>
                현재 교회에 등록된 선생님 계정 목록입니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTeachers ? (
                <p className="text-sm text-muted-foreground">불러오는 중...</p>
              ) : teachers.length === 0 ? (
                <p className="text-sm text-muted-foreground">등록된 선생님 계정이 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {teachers.map((teacher) => (
                    <div
                      key={teacher.uid}
                      className="rounded-md border p-3 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{teacher.displayName}</p>
                          <p className="text-sm text-muted-foreground">
                            로그인 아이디: {teacher.loginId || teacher.email}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            현재: {teacher.position ? getPositionLabel(teacher.position) : '직책 미지정'} / {getTeacherProgramLabel(teacher.program)} / {getTeacherTeamLabel(teacher.team)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          disabled={isSavingTeacherId === teacher.uid}
                          onClick={() => handleSaveTeacherAssignment(teacher)}
                        >
                          {isSavingTeacherId === teacher.uid ? '저장 중...' : '정보 저장'}
                        </Button>
                      </div>
                      <div className="grid gap-2 md:grid-cols-3">
                        <Select
                          value={editingAssignments[teacher.uid]?.position || TeacherPosition.ASSISTANT}
                          onValueChange={(value) =>
                            setEditingAssignments((prev) => ({
                              ...prev,
                              [teacher.uid]: {
                                position: value as TeacherPosition,
                                program: prev[teacher.uid]?.program || teacher.program || DEFAULT_TEACHER_PROGRAM,
                                team: prev[teacher.uid]?.team || teacher.team || DEFAULT_TEACHER_TEAM,
                              },
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="직책 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            {TEACHER_POSITIONS.map((item) => (
                              <SelectItem key={item.value} value={item.value}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={editingAssignments[teacher.uid]?.program || DEFAULT_TEACHER_PROGRAM}
                          onValueChange={(value) =>
                            setEditingAssignments((prev) => ({
                              ...prev,
                              [teacher.uid]: {
                                position: prev[teacher.uid]?.position || teacher.position || TeacherPosition.ASSISTANT,
                                program: value as TeacherProgram,
                                team: prev[teacher.uid]?.team || teacher.team || DEFAULT_TEACHER_TEAM,
                              },
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="클럽 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            {TEACHER_PROGRAM_OPTIONS.map((item) => (
                              <SelectItem key={item.value} value={item.value}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={editingAssignments[teacher.uid]?.team || DEFAULT_TEACHER_TEAM}
                          onValueChange={(value) =>
                            setEditingAssignments((prev) => ({
                              ...prev,
                              [teacher.uid]: {
                                position: prev[teacher.uid]?.position || teacher.position || TeacherPosition.ASSISTANT,
                                program: prev[teacher.uid]?.program || teacher.program || DEFAULT_TEACHER_PROGRAM,
                                team: value as TeacherTeam,
                              },
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="팀 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            {TEACHER_TEAM_OPTIONS.map((item) => (
                              <SelectItem key={item.value} value={item.value}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {isUserManager && !user?.churchId && (
        <Alert variant="destructive">
          <AlertDescription>
            관리자 계정에 교회 정보가 없어 선생님 계정을 관리할 수 없습니다.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

