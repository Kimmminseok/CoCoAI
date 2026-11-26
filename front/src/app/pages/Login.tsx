
import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { login, signup, setToken, getMyLearningSetting } from '../lib/dataSource';
import loginImage from 'figma:asset/dd895531611369f3db5a3376814a32d651a82392.png';
import kakaoLoginImage from 'figma:asset/kakao_login_wide.png';
import naverLoginImage from 'figma:asset/naver_login_wide.png';

// 구글 공식 "Sign in with Google" 버튼(gsi-material-button)을 React로 옮긴 컴포넌트.
// 카카오/네이버는 공식 이미지 에셋을 쓰기 때문에, 구글도 동일한 높이/모서리로 맞춰서
// 세 버튼이 나란히 있을 때 톤이 어긋나지 않도록 함
function GoogleLoginButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full h-12 rounded-full flex items-center justify-center gap-3 text-sm border border-gray-300 bg-white text-[#1f1f1f] transition-colors hover:bg-gray-50 hover:border-gray-400"
    >
      <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
      </svg>
      <span className="font-medium" style={{ fontFamily: 'Roboto, arial, sans-serif' }}>
        Google로 로그인
      </span>
    </button>
  );
}

const SAVED_LOGIN_ID_KEY = 'cocoai_saved_login_id';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || window.location.origin;


export default function Login() {
  const navigate = useNavigate();
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem(SAVED_LOGIN_ID_KEY));

  // #01 LOGIN
  const [loginId, setLoginId] = useState(() => localStorage.getItem(SAVED_LOGIN_ID_KEY) ?? '');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // #02 SIGNUP
  const [showSignup, setShowSignup] = useState(false);
  const [signupForm, setSignupForm] = useState({
    login_id: '',
    email: '',
    password: '',
    name: '',
    phone: '',
  });
  const [signupError, setSignupError] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginId || !password) {
      setLoginError('ID와 Password를 모두 입력해주세요');
      return;
    }

    setIsLoggingIn(true);
    try {
      // #01 LOGIN - POST /api/auth/login
      const data = await login({ login_id: loginId, password });
      setToken(data.token);

      if (rememberMe) {
        localStorage.setItem(SAVED_LOGIN_ID_KEY, loginId);
      } else {
        localStorage.removeItem(SAVED_LOGIN_ID_KEY);
      }

	try {
	  const settingResult: any = await getMyLearningSetting();

	  const setting =
        
settingResult?.data?.setting ??
        settingResult?.data ??
        settingResult?.setting ??
        settingResult;

      if (!setting || !setting.language_id) {
        navigate('/dashboard/learning-settings', { replace: true });
        return;
      }

      navigate('/dashboard', { replace: true });
      return;
    } catch (error) {
      navigate('/dashboard/learning-settings', { replace: true });
      return;
    }
  } catch (err) {
    setLoginError(err instanceof Error ? err.message : '로그인에 실패했습니다');
  } finally {
    setIsLoggingIn(false);
  }
};
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');

    const { login_id, email, password: pw, name, phone } = signupForm;
    if (!login_id || !email || !pw || !name || !phone) {
      setSignupError('모든 항목을 입력해주세요');
      return;
    }

    setIsSigningUp(true);
    try {
      // #02 SIGNUP - POST /api/auth/signup
      await signup(signupForm);
      // 회원가입 성공 후 바로 로그인 폼으로 전환하고, 방금 만든 아이디를 채워줌
      setShowSignup(false);
      setLoginId(login_id);
      setPassword('');
    } catch (err) {
      setSignupError(err instanceof Error ? err.message : '회원가입에 실패했습니다');
    } finally {
      setIsSigningUp(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-[40px] border-2 border-purple-200 p-8 shadow-lg">
          {!showSignup ? (
            <>
              {/* Title */}
              <h1 className="text-center text-purple-700 mb-8">
                회원 로그인
              </h1>

              {/* 데모 계정: test01 / password123 (비밀번호 찾기나 계정 관리에서 바꾸지 않았다면 이 값으로 로그인) */}
              <p className="text-center text-xs text-indigo-400 mb-4">
                데모 계정: test01 / password123
              </p>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <Input
                  type="text"
                  placeholder="ID를 입력해주세요"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  className="w-full border-indigo-200 focus:border-purple-400"
                />
                <Input
                  type="password"
                  placeholder="Password를 입력해주세요"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border-indigo-200 focus:border-purple-400"
                />

                {loginError && (
                  <p className="text-sm text-red-600">{loginError}</p>
                )}

                {/* Remember Me and Links */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    />
                    <label htmlFor="remember" className="cursor-pointer text-gray-600">
                      ID 또는 E-Mail 저장
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <Link to="/find-id" className="text-indigo-500 hover:underline">
                      아이디 찾기
                    </Link>
                    <span className="text-gray-300">|</span>
                    <Link to="/find-password" className="text-indigo-500 hover:underline">
                      비밀번호 찾기
                    </Link>
                  </div>
                </div>

                {/* Login Button */}
                <Button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl h-12"
                >
                  {isLoggingIn ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    '로그인'
                  )}
                </Button>
              </form>

              {/* Sign Up Link */}
              <button
                type="button"
                onClick={() => setShowSignup(true)}
                className="w-full mt-4 border-2 border-purple-400 text-purple-600 hover:bg-purple-50 rounded-xl py-3 transition-colors"
              >
                <span className="font-bold text-indigo-600">CoCoAI</span> 간편 회원 가입
              </button>

              {/* SNS Login Section */}
              {/* 네이버/카카오/구글 로그인은 API 명세서에 없어 백엔드 연동 전까지는 준비중 처리로 유지 */}
              {/* 카카오/네이버는 공식 배포 버튼 이미지, 구글은 공식 gsi-material-button을 React로 옮긴 컴포넌트.
                  세 버튼 모두 h-12(48px)·rounded-full·max-w-xs 컨테이너로 높이/너비를 통일함 */}
              <div className="mt-6">
                <p className="text-sm mb-4 text-center">SNS 계정으로 로그인/가입</p>
                <div className="flex flex-col gap-3 max-w-xs mx-auto">
                  {/* #04 SNS-KAKAO - 명세서에 없음, 백엔드 연동 대기 */}
                  <button
                    type="button"
		    onClick={() => {
			window.location.href = `${API_BASE_URL}/api/auth/kakao`;
		    }}
                    className="w-full h-12 rounded-full overflow-hidden hover:opacity-85 transition-opacity"
                  >
                    <img
                      src={kakaoLoginImage}
                      alt="카카오 로그인"
                      className="w-full h-full object-contain"
                    />
                  </button>
                  {/* #03 SNS-NAVER - 명세서에 없음, 백엔드 연동 대기 */}
                  <button
                    type="button"
onClick={() => {
  window.location.href = `${API_BASE_URL}/api/auth/naver`;
	}}
                   className="w-full h-12 rounded-full overflow-hidden hover:opacity-85 transition-opacity"
                  >
                    <img
                      src={naverLoginImage}
                      alt="네이버 로그인"
                      className="w-full h-full object-contain"
                    />
                  </button>
                  {/* #05 SNS-GOOGLE - 명세서에 없음, 백엔드 연동 대기 */}
<button
  type="button"
  onClick={() => {
    window.location.href = `${API_BASE_URL}/api/auth/github`;
  }}
  className="w-full h-12 rounded-full bg-[#24292f] text-white font-semibold hover:opacity-85 transition-opacity flex items-center justify-center"
>
  GitHub로 로그인
</button>
                </div>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-center text-purple-700 mb-8">회원 가입</h1>

              <form onSubmit={handleSignup} className="space-y-4">
                <Input
                  type="text"
                  placeholder="아이디"
                  value={signupForm.login_id}
                  onChange={(e) => setSignupForm({ ...signupForm, login_id: e.target.value })}
                  className="w-full border-indigo-200 focus:border-purple-400"
                />
                <Input
                  type="email"
                  placeholder="이메일"
                  value={signupForm.email}
                  onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                  className="w-full border-indigo-200 focus:border-purple-400"
                />
                <Input
                  type="password"
                  placeholder="비밀번호"
                  value={signupForm.password}
                  onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                  className="w-full border-indigo-200 focus:border-purple-400"
                />
                <Input
                  type="text"
                  placeholder="이름"
                  value={signupForm.name}
                  onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                  className="w-full border-indigo-200 focus:border-purple-400"
                />
                <Input
                  type="text"
                  placeholder="전화번호 (예: 010-1234-5678)"
                  value={signupForm.phone}
                  onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                  className="w-full border-indigo-200 focus:border-purple-400"
                />

                {signupError && (
                  <p className="text-sm text-red-600">{signupError}</p>
                )}

                <Button
                  type="submit"
                  disabled={isSigningUp}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl h-12"
                >
                  {isSigningUp ? <Loader2 className="w-5 h-5 animate-spin" /> : '가입하기'}
                </Button>
              </form>

              <button
                type="button"
                onClick={() => setShowSignup(false)}
                className="w-full mt-4 text-purple-600 hover:underline text-sm"
              >
                로그인 화면으로 돌아가기
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
