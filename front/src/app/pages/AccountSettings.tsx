import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { toast } from 'sonner';
import { Toaster } from '../components/ui/sonner';
import { clearToken, getMockPassword, setMockPassword } from '../lib/dataSource';
import { ArrowLeft, User, Camera, Lock, AlertTriangle, UserX, Save, Pencil } from 'lucide-react';

// 이메일 로컬파트(@ 앞부분)는 앞 3글자만 보여주고 나머지는 ●로 모자이크, @ 뒤 도메인은 그대로 표시
function maskEmail(email: string) {
  const atIndex = email.indexOf('@');
  if (atIndex === -1) {
    return email.length <= 3 ? email : email.slice(0, 3) + '●'.repeat(email.length - 3);
  }
  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex);
  if (local.length <= 3) return local + domain;
  return local.slice(0, 3) + '●'.repeat(local.length - 3) + domain;
}

// 전화번호 010-1234-5678 형식에서 가운데 자리만 보여주고 앞/뒤는 ●로 모자이크
function maskPhone(phone: string) {
  const parts = phone.split('-');
  if (parts.length !== 3) return phone;
  const [first, middle, last] = parts;
  return `${'●'.repeat(first.length)}-${middle}-${'●'.repeat(last.length)}`;
}

export default function AccountSettings() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 개인정보 수정 - 저장된 값(마스킹 표시용)과 수정 중인 값(편집 화면용)을 분리해서 관리
  const [savedProfile, setSavedProfile] = useState({
    name: '테스트 사용자',
    email: 'test01@test.com',
    phone: '010-1234-5678',
  });
  const [isProfileUnlocked, setIsProfileUnlocked] = useState(false);
  const [draftName, setDraftName] = useState(savedProfile.name);
  const [draftEmail, setDraftEmail] = useState(savedProfile.email);
  const [draftPhone, setDraftPhone] = useState(savedProfile.phone);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // 현재 비밀번호 확인 다이얼로그 (개인정보 수정 진입 전 본인 확인용)
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [verifyPassword, setVerifyPassword] = useState('');
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // 프리뷰용으로 만든 objectURL은 다음 파일 선택/언마운트 시 반드시 해제해야 메모리가 안 샘
  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleOpenVerifyDialog = () => {
    setVerifyPassword('');
    setVerifyError(null);
    setShowVerifyDialog(true);
  };

  const handleVerifyPassword = () => {
    // TODO(백엔드): POST /api/users/me/verify-password (current_password) 로 실제 비밀번호 검증 필요
    // 목업에서는 find-password(#14~#16) 흐름과 동일한 저장소(mock_password)를 기준으로 검증함
    if (verifyPassword !== getMockPassword()) {
      setVerifyError('비밀번호가 일치하지 않습니다');
      return;
    }
    setDraftName(savedProfile.name);
    setDraftEmail(savedProfile.email);
    setDraftPhone(savedProfile.phone);
    setIsProfileUnlocked(true);
    setShowVerifyDialog(false);
  };

  const handleCancelEditProfile = () => {
    setIsProfileUnlocked(false);
  };

  const handleSaveProfile = () => {
    // TODO(백엔드): PATCH /api/users/me (name, email, phone) + POST /api/users/me/profile-image (프로필 사진 업로드) 필요
    setSavedProfile({ name: draftName, email: draftEmail, phone: draftPhone });
    setIsProfileUnlocked(false);
    toast.success('개인정보가 수정되었습니다');
  };

  // 비밀번호 변경
  const [currentPassword, setCurrentPassword] = useState('');
  const [currentPasswordError, setCurrentPasswordError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const passwordMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  const handleChangePassword = () => {
    // TODO(백엔드): PATCH /api/users/me/password (current_password, new_password) 필요
    // 목업에서는 find-password(#14~#16) 흐름과 동일한 저장소(mock_password)를 기준으로
    // 현재 비밀번호를 검증하고, 통과하면 그 저장소를 새 비밀번호로 갱신함
    if (currentPassword !== getMockPassword()) {
      setCurrentPasswordError('현재 비밀번호가 일치하지 않습니다');
      return;
    }
    if (passwordMismatch) {
      toast.error('새 비밀번호가 일치하지 않습니다');
      return;
    }
    setMockPassword(newPassword);
    toast.success('비밀번호가 변경되었습니다');
    setCurrentPassword('');
    setCurrentPasswordError(null);
    setNewPassword('');
    setConfirmPassword('');
  };

  // 회원 탈퇴
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDeleteAccount = () => {
    // TODO(백엔드): DELETE /api/users/me 필요
    toast.success('회원 탈퇴가 처리되었습니다');
    clearToken();
    setShowDeleteDialog(false);
    navigate('/login');
  };

  return (
    <div className="space-y-6">
      <Toaster />

      <div>
        <Link
          to="/dashboard/profile"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-purple-600 mb-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          프로필로 돌아가기
        </Link>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <User className="w-8 h-8 text-purple-500" />
          계정 관리
        </h1>
        <p className="text-gray-600 mt-1">개인정보와 비밀번호를 관리하세요</p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* 1. 개인정보 수정 */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle>개인정보 수정</CardTitle>
                <CardDescription>이름, 이메일, 전화번호와 프로필 사진을 관리하세요</CardDescription>
              </div>
            </div>
          </CardHeader>
          {isProfileUnlocked ? (
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    {avatarPreview && <AvatarImage src={avatarPreview} alt="프로필 사진" />}
                    <AvatarFallback className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-2xl">
                      <User className="w-10 h-10" />
                    </AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-8 h-8 bg-purple-600 hover:bg-purple-700 rounded-full flex items-center justify-center text-white shadow-md transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
                <div>
                  <p className="font-semibold text-sm">프로필 사진</p>
                  <p className="text-xs text-gray-500 mt-1">
                    카메라 아이콘을 눌러 사진을 선택하면 바로 미리보기가 반영됩니다
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="account-name">이름</Label>
                <Input id="account-name" value={draftName} onChange={(e) => setDraftName(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account-email">이메일</Label>
                <Input id="account-email" type="email" value={draftEmail} onChange={(e) => setDraftEmail(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account-phone">전화번호</Label>
                <Input id="account-phone" value={draftPhone} onChange={(e) => setDraftPhone(e.target.value)} />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={handleCancelEditProfile}>
                  취소
                </Button>
                <Button
                  onClick={handleSaveProfile}
                  className="flex-1 h-11 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  저장하기
                </Button>
              </div>
            </CardContent>
          ) : (
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="w-24 h-24">
                  {avatarPreview && <AvatarImage src={avatarPreview} alt="프로필 사진" />}
                  <AvatarFallback className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-2xl">
                    <User className="w-10 h-10" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">프로필 사진</p>
                  <p className="text-xs text-gray-500 mt-1">
                    수정하기를 눌러 비밀번호 확인 후 변경할 수 있어요
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-500">이름</span>
                  <span className="font-medium">{savedProfile.name}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-500">이메일</span>
                  <span className="font-medium tracking-wide">{maskEmail(savedProfile.email)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-500">전화번호</span>
                  <span className="font-medium tracking-wide">{maskPhone(savedProfile.phone)}</span>
                </div>
              </div>

              <Button
                onClick={handleOpenVerifyDialog}
                className="w-full h-11 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                <Pencil className="w-4 h-4 mr-2" />
                수정하기
              </Button>
            </CardContent>
          )}
        </Card>

        {/* 2. 비밀번호 변경 */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle>비밀번호 변경</CardTitle>
                <CardDescription>주기적으로 변경해 계정을 안전하게 보호하세요</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">현재 비밀번호</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  setCurrentPasswordError(null);
                }}
                aria-invalid={!!currentPasswordError}
              />
              {currentPasswordError && (
                <p className="text-sm text-red-500">{currentPasswordError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">새 비밀번호</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">새 비밀번호 확인</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                aria-invalid={passwordMismatch}
              />
              {passwordMismatch && (
                <p className="text-sm text-red-500">새 비밀번호가 일치하지 않습니다</p>
              )}
            </div>

            <Button
              onClick={handleChangePassword}
              disabled={!currentPassword || !newPassword || !confirmPassword || passwordMismatch}
              className="w-full h-11 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              <Lock className="w-4 h-4 mr-2" />
              비밀번호 변경
            </Button>
          </CardContent>
        </Card>

        {/* 3. 회원 탈퇴 */}
        <Card className="shadow-md border-2 border-red-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-red-700">회원 탈퇴</CardTitle>
                <CardDescription className="text-red-600/80">
                  탈퇴 시 모든 학습 기록과 점수가 영구적으로 삭제되며 복구할 수 없습니다
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setShowDeleteDialog(true)}
              variant="outline"
              className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <UserX className="w-4 h-4 mr-2" />
              회원 탈퇴하기
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 개인정보 수정 진입 전 비밀번호 확인 다이얼로그 */}
      <Dialog
        open={showVerifyDialog}
        onOpenChange={(open) => {
          setShowVerifyDialog(open);
          if (!open) {
            setVerifyPassword('');
            setVerifyError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-purple-600" />
              본인 확인
            </DialogTitle>
            <DialogDescription>개인정보를 수정하려면 현재 비밀번호를 입력해주세요</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            <Label htmlFor="verify-password">현재 비밀번호</Label>
            <Input
              id="verify-password"
              type="password"
              value={verifyPassword}
              onChange={(e) => setVerifyPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleVerifyPassword()}
              aria-invalid={!!verifyError}
              autoFocus
            />
            {verifyError && <p className="text-sm text-red-500">{verifyError}</p>}
            <p className="text-xs text-gray-400">데모 계정 기본 비밀번호는 "password123" 입니다 (비밀번호 찾기로 재설정했다면 그 비밀번호를 입력해주세요)</p>
          </div>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setShowVerifyDialog(false)}>
              취소
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              onClick={handleVerifyPassword}
            >
              확인
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 탈퇴 확인 다이얼로그 */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              정말 탈퇴하시겠어요?
            </DialogTitle>
            <DialogDescription>
              탈퇴하면 모든 학습 기록, 점수, 티어 정보가 영구적으로 삭제되며 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setShowDeleteDialog(false)}>
              취소
            </Button>
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDeleteAccount}
            >
              탈퇴 확정
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
