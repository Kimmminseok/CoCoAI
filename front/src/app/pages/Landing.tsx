import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import TryProblemWidget from '../components/TryProblemWidget';
import { Sparkles, Code, Zap, ArrowRight } from 'lucide-react';
import { getToken } from '../lib/dataSource';

export default function Landing() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!getToken());
  }, []);

  const goToAuthArea = () => navigate(isLoggedIn ? '/dashboard' : '/login');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              CoCoAI
            </h1>
          </div>
          <Button onClick={goToAuthArea} variant="outline">
            {isLoggedIn ? '대시보드로 이동' : '로그인'}
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h2 className="text-5xl font-bold mb-6 leading-tight">
          AI 기반 맞춤형<br />
          <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            코딩 학습 플랫폼
          </span>
        </h2>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          생성형 AI가 만드는 맞춤형 이론 자료와 4지선다 문제!
            <br />
          체계적으로 프로그래밍을 학습하세요.
        </p>

        <div className="flex items-center justify-center gap-8 text-sm text-gray-600 mb-12">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-purple-500" />
            <span>9개 프로그래밍 언어</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-500" />
            <span>AI 맞춤형 학습</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <span>티어 랭킹 시스템</span>
          </div>
        </div>

        <Button
          onClick={goToAuthArea}
          className="h-14 px-10 text-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
        >
          {isLoggedIn ? '대시보드로 이동' : '지금 시작하기'}
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>

        <div className="mt-20">
          <TryProblemWidget />
        </div>
      </main>
    </div>
  );
}
