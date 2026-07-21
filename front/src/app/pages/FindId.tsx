import { useState } from 'react';
import { Link } from 'react-router';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { findId } from '../lib/dataSource';

// AccountSettings.tsx의 maskEmail/maskPhone과 동일한 톤(●로 가운데를 가림) - 앞 2자/뒤 2자만 노출
function maskLoginId(loginId: string) {
  if (loginId.length <= 4) {
    return loginId.slice(0, 1) + '●'.repeat(Math.max(loginId.length - 1, 0));
  }
  const head = loginId.slice(0, 2);
  const tail = loginId.slice(-2);
  const maskedLength = loginId.length - head.length - tail.length;
  return `${head}${'●'.repeat(maskedLength)}${tail}`;
}

export default function FindId() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [foundLoginId, setFoundLoginId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !phone) {
      setError('이름과 전화번호를 모두 입력해주세요');
      return;
    }

    setIsSubmitting(true);
    try {
      // #14 FIND-ID - POST /api/auth/find-id
      const data = await findId({ name, phone });
      setFoundLoginId(data.login_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : '아이디 찾기에 실패했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-[40px] border-2 border-purple-200 p-8 shadow-lg">
          {foundLoginId === null ? (
            <>
              <Link
                to="/login"
                className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-purple-600 mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                로그인으로 돌아가기
              </Link>

              <h1 className="text-center text-purple-700 mb-2">아이디 찾기</h1>
              <p className="text-center text-sm text-gray-500 mb-8">
                가입 시 등록한 이름과 전화번호를 입력해주세요
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="text"
                  placeholder="이름을 입력해주세요"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border-indigo-200 focus:border-purple-400"
                />
                <Input
                  type="text"
                  placeholder="전화번호를 입력해주세요 (예: 010-1234-5678)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border-indigo-200 focus:border-purple-400"
                />

                {error && <p className="text-sm text-red-600">{error}</p>}

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl h-12"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : '아이디 찾기'}
                </Button>
              </form>
            </>
          ) : (
            <>
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-purple-700 mb-2">아이디를 찾았어요</h1>
                <p className="text-sm text-gray-500">회원님의 아이디는 아래와 같습니다</p>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-xl py-4 px-6 text-center mb-8">
                <span className="text-xl font-bold tracking-wide bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  {maskLoginId(foundLoginId)}
                </span>
              </div>

              <div className="space-y-3">
                <Link to="/login">
                  <Button className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl">
                    로그인 하러 가기
                  </Button>
                </Link>
                <Link to="/find-password">
                  <Button variant="outline" className="w-full h-12 rounded-xl border-purple-300 text-purple-600 hover:bg-purple-50">
                    비밀번호 찾기
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
