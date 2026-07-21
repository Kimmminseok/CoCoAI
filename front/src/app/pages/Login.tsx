import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { login, signup, setToken, getMyLearningSetting } from '../lib/dataSource';

const SAVED_LOGIN_ID_KEY = 'cocoai_saved_login_id';
const API_BASE_URL = 'http://localhost:5001';

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

  const moveAfterLogin = async () => {
    try {
      await getMyLearningSetting();
      navigate('/dashboard');
    } catch {
      navigate('/dashboard/learning-settings');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginId || !password) {
      setLoginError('ID와 Password를 모두 입력해주세요');
      return;
    }

    setIsLoggingIn(true);

    try {
      const data = await login({ login_id: loginId, password });
      setToken(data.token);

      if (rememberMe) {
        localStorage.setItem(SAVED_LOGIN_ID_KEY, loginId);
      } else {
        localStorage.removeItem(SAVED_LOGIN_ID_KEY);
      }

      await moveAfterLogin();
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
      await signup(signupForm);

      // 회원가입 성공 후 로그인 폼으로 전환하고, 방금 만든 아이디를 채워줌
      setShowSignup(false);
      setLoginId(login_id);
      setPassword('');
      setSignupError('');
    } catch (err) {
      setSignupError(err instanceof Error ? err.message : '회원가입에 실패했습니다');
    } finally {
      setIsSigningUp(false);
    }
  };

  const handleSocialLogin = (provider: 'naver' | 'kakao' | 'google') => {
    window.location.href = `${API_BASE_URL}/api/auth/${provider}`;
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
              <div className="mt-6">
                <p className="text-sm mb-4">SNS 계정으로 로그인/가입</p>

                <div className="flex justify-center gap-6">
                  {/* Naver */}
                  <button
                    type="button"
                    onClick={() => handleSocialLogin('naver')}
                    className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center hover:opacity-80 transition-opacity"
                  >
                    <span className="text-white font-bold text-2xl">N</span>
                  </button>

                  {/* Kakao */}
                  <button
                    type="button"
                    onClick={() => handleSocialLogin('kakao')}
                    className="w-16 h-16 rounded-full bg-yellow-400 flex items-center justify-center hover:opacity-80 transition-opacity"
                  >
                    <span className="text-black font-bold text-sm">TALK</span>
                  </button>

                  {/* Google */}
                  <button
                    type="button"
                    onClick={() => handleSocialLogin('google')}
                    className="w-16 h-16 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-3xl">G</span>
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
                  {isSigningUp ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    '가입하기'
                  )}
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