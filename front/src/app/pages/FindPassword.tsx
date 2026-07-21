import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Loader2, ArrowLeft, MailCheck, KeyRound, CheckCircle2, Info } from 'lucide-react';
import { requestPasswordReset, resetPassword } from '../lib/dataSource';

type Phase = 'request' | 'notice' | 'reset' | 'done';

const STEP_LABEL: Record<Phase, string> = {
  request: '1 / 3',
  notice: '2 / 3',
  reset: '2 / 3',
  done: '3 / 3',
};

export default function FindPassword() {
  // 이메일로 받은 재설정 링크(/find-password?token=xxx)로 들어온 경우를 판별.
  // token이 있으면 바로 reset 단계로, 없으면 기존과 동일하게 request 단계부터 시작.
  // (token이 없는 상태로는 reset 단계가 초기 진입 단계가 될 수 없으므로,
  //  "주소창에 /find-password만 직접 입력"하는 경우는 자연스럽게 request 단계로 시작됨)
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token');

  const [phase, setPhase] = useState<Phase>(tokenFromUrl ? 'reset' : 'request');

  // 1단계 - 요청
  const [loginId, setLoginId] = useState('');
  const [email, setEmail] = useState('');
  const [requestError, setRequestError] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);

  // 2단계 - 재설정
  // 이메일 링크의 token 쿼리 파라미터 값. resetPassword 호출 시 함께 전달됨
  // (백엔드 스펙 미확정 - api.ts의 PasswordResetPayload 주석 참고)
  const [token] = useState(tokenFromUrl ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestError('');

    if (!loginId || !email) {
      setRequestError('아이디와 이메일을 모두 입력해주세요');
      return;
    }

    setIsRequesting(true);
    try {
      // #15 PASSWORD-RESET-REQUEST - POST /api/auth/password-reset-request
      await requestPasswordReset({ login_id: loginId, email });
      setPhase('notice');
    } catch (err) {
      setRequestError(err instanceof Error ? err.message : '비밀번호 재설정 요청에 실패했습니다');
    } finally {
      setIsRequesting(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');

    if (!newPassword || !confirmPassword) {
      setResetError('새 비밀번호를 모두 입력해주세요');
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError('새 비밀번호가 일치하지 않습니다');
      return;
    }

    setIsResetting(true);
    try {
      // #16 PASSWORD-RESET - POST /api/auth/password-reset
      // token: 이메일 링크로 들어온 경우 여기 담김. login_id: 목업 호환용(하위 호환), 1단계에서
      // 입력했다면 함께 전달 (백엔드 스펙 미확정 - api.ts의 PasswordResetPayload 주석 참고)
      await resetPassword({ token, login_id: loginId || undefined, new_password: newPassword });
      setPhase('done');
    } catch (err) {
      setResetError(err instanceof Error ? err.message : '비밀번호 변경에 실패했습니다');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-[40px] border-2 border-purple-200 p-8 shadow-lg">
          {phase === 'request' && (
            <>
              <Link
                to="/login"
                className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-purple-600 mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                로그인으로 돌아가기
              </Link>

              <p className="text-center text-xs text-purple-400 mb-2">{STEP_LABEL[phase]}</p>
              <h1 className="text-center text-purple-700 mb-2">비밀번호 찾기</h1>
              <p className="text-center text-sm text-gray-500 mb-8">
                가입 시 등록한 아이디와 이메일을 입력해주세요
              </p>

              <form onSubmit={handleRequestSubmit} className="space-y-4">
                <Input
                  type="text"
                  placeholder="아이디를 입력해주세요"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  className="w-full border-indigo-200 focus:border-purple-400"
                />
                <Input
                  type="email"
                  placeholder="이메일을 입력해주세요"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border-indigo-200 focus:border-purple-400"
                />

                {requestError && <p className="text-sm text-red-600">{requestError}</p>}

                <Button
                  type="submit"
                  disabled={isRequesting}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl h-12"
                >
                  {isRequesting ? <Loader2 className="w-5 h-5 animate-spin" /> : '비밀번호 재설정 링크 받기'}
                </Button>
              </form>
            </>
          )}

          {/* TODO(정리 필요): 실제 이메일 링크 진입(token 쿼리 파라미터)이 백엔드와 연동되면
              이 notice 단계와 버튼은 삭제 대상입니다. 지금은 백엔드 없이 흐름을 확인하기
              위한 임시 우회 경로입니다. */}
          {phase === 'notice' && (
            <>
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mb-4">
                  <MailCheck className="w-8 h-8 text-white" />
                </div>
                <p className="text-xs text-purple-400 mb-2">{STEP_LABEL[phase]}</p>
                <h1 className="text-purple-700 mb-2">재설정 링크를 보냈어요</h1>
                <p className="text-sm text-gray-500">
                  <span className="font-medium text-gray-700">{email}</span>(으)로
                  <br />
                  비밀번호 재설정 링크를 보냈습니다
                </p>
              </div>

              <div className="flex gap-2 bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6">
                <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <p className="text-xs text-gray-600 leading-relaxed">
                  (목업 환경 안내) 실제로는 이메일의 링크를 클릭해서 들어오지만, 지금은 백엔드가 없어 아래에서 바로
                  진행합니다.
                </p>
              </div>

              <Button
                onClick={() => setPhase('reset')}
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl"
              >
                새 비밀번호 설정하러 가기
              </Button>
            </>
          )}

          {phase === 'reset' && (
            <>
              <p className="text-center text-xs text-purple-400 mb-2">{STEP_LABEL[phase]}</p>
              <h1 className="text-center text-purple-700 mb-2">새 비밀번호 설정</h1>
              <p className="text-center text-sm text-gray-500 mb-8">새로 사용할 비밀번호를 입력해주세요</p>

              <form onSubmit={handleResetSubmit} className="space-y-4">
                <Input
                  type="password"
                  placeholder="새 비밀번호"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border-indigo-200 focus:border-purple-400"
                />
                <Input
                  type="password"
                  placeholder="새 비밀번호 확인"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  aria-invalid={!!resetError}
                  className="w-full border-indigo-200 focus:border-purple-400"
                />

                {resetError && <p className="text-sm text-red-600">{resetError}</p>}

                <Button
                  type="submit"
                  disabled={isResetting}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl h-12"
                >
                  {isResetting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      <KeyRound className="w-4 h-4 mr-2" />
                      비밀번호 변경 완료
                    </>
                  )}
                </Button>
              </form>
            </>
          )}

          {phase === 'done' && (
            <>
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <p className="text-xs text-purple-400 mb-2">{STEP_LABEL[phase]}</p>
                <h1 className="text-purple-700 mb-2">비밀번호가 변경되었어요</h1>
                <p className="text-sm text-gray-500">새 비밀번호로 다시 로그인해주세요</p>
              </div>

              <Link to="/login">
                <Button className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl">
                  로그인 하러 가기
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
