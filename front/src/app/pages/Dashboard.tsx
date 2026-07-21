import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { BookOpen, FileText, TrendingUp, Award, Settings, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useProfile } from '../contexts/ProfileContext';
import { getDashboardSummary, type DashboardSummary } from '../lib/dataSource';
import { DIFFICULTY_ICON, DIFFICULTY_COLOR } from '../lib/constants';

// 언어별 이론 학습 주제 콘텐츠 — 백엔드 API 명세서에 해당 데이터가 없어서
// 요청대로 일단 그대로 프론트에 하드코딩된 상태로 남겨둠 (추후 백엔드 콘텐츠 API 생기면 교체)
const languageTopics: Record<string, Array<{ title: string; baseProgress: number; type: string }>> = {
  'C': [
    { title: 'C 기초 문법', baseProgress: 0, type: 'theory' },
    { title: '포인터와 메모리 관리', baseProgress: 0, type: 'theory' },
    { title: '구조체와 파일 입출력', baseProgress: 0, type: 'theory' },
  ],
  'C++': [
    { title: 'C++ 객체지향 프로그래밍', baseProgress: 0, type: 'theory' },
    { title: 'STL 라이브러리 활용', baseProgress: 0, type: 'theory' },
    { title: '템플릿과 제네릭 프로그래밍', baseProgress: 0, type: 'theory' },
  ],
  'Python': [
    { title: 'Python 기초 문법', baseProgress: 0, type: 'theory' },
    { title: '데이터 구조와 알고리즘', baseProgress: 0, type: 'theory' },
    { title: '파이썬 클래스와 모듈', baseProgress: 0, type: 'theory' },
  ],
  'Java': [
    { title: 'Java 기본 문법', baseProgress: 0, type: 'theory' },
    { title: 'Java 객체지향 설계', baseProgress: 0, type: 'theory' },
    { title: '컬렉션 프레임워크', baseProgress: 0, type: 'theory' },
  ],
  'HTML': [
    { title: 'HTML5 시맨틱 태그', baseProgress: 0, type: 'theory' },
    { title: 'HTML 폼과 유효성 검사', baseProgress: 0, type: 'theory' },
    { title: '멀티미디어와 그래픽', baseProgress: 0, type: 'theory' },
  ],
  'CSS': [
    { title: 'CSS 선택자와 속성', baseProgress: 0, type: 'theory' },
    { title: 'Flexbox와 Grid 레이아웃', baseProgress: 0, type: 'theory' },
    { title: 'CSS 애니메이션과 트랜지션', baseProgress: 0, type: 'theory' },
  ],
  'JavaScript': [
    { title: 'JavaScript ES6+ 문법', baseProgress: 0, type: 'theory' },
    { title: '비동기 프로그래밍', baseProgress: 0, type: 'theory' },
    { title: 'DOM 조작과 이벤트 처리', baseProgress: 0, type: 'theory' },
  ],
  'React': [
    { title: 'React Hooks 마스터', baseProgress: 0, type: 'theory' },
    { title: 'React 컴포넌트 설계 패턴', baseProgress: 0, type: 'theory' },
    { title: 'React 상태 관리', baseProgress: 0, type: 'theory' },
  ],
  'TypeScript': [
    { title: 'TypeScript 타입 시스템', baseProgress: 0, type: 'theory' },
    { title: '인터페이스와 제네릭', baseProgress: 0, type: 'theory' },
    { title: 'TypeScript 고급 패턴', baseProgress: 0, type: 'theory' },
  ],
};

export default function Dashboard() {
  const { setting, settingLoading } = useProfile();
  const [showStats, setShowStats] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  // #08 DASHBOARD-SUMMARY - GET /api/dashboard/summary
  useEffect(() => {
    getDashboardSummary()
      .then(setSummary)
      .catch(() => setSummary(null));
  }, []);

  const topics = setting ? (languageTopics[setting.languageName] || []).map((topic, index) => ({
    id: index + 1,
    title: topic.title,
    progress: topic.baseProgress,
    type: topic.type,
  })) : [];

  // 백엔드가 실제로 값을 주는 항목만 채우고, 대응하는 API가 없는 항목은 '-'로 남겨둠
  const stats = [
    { label: '완료한 이론', value: '-', icon: BookOpen, color: 'text-blue-500' },
    { label: '해결한 문제', value: summary?.recent_sessions?.reduce((sum, s) => sum + s.total_count, 0) ?? '-', icon: FileText, color: 'text-green-500' },
    { label: '연속 학습일', value: summary?.score.streak_days ?? '-', icon: TrendingUp, color: 'text-orange-500' },
    { label: '획득한 배지', value: '-', icon: Award, color: 'text-purple-500' },
  ];

  return (
    <div className="relative">
      <div className="flex gap-6">
        <div className="flex-1 space-y-8">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 text-white shadow-lg">
            <h1 className="text-3xl font-bold mb-2">환영합니다! 🎉</h1>
            <p className="text-purple-100 mb-4">
              CoCoAI와 함께 AI 기반 맞춤형 학습을 시작해보세요
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              {!settingLoading && setting ? (
                <>
                  <span className="text-purple-100 text-sm self-center">학습 중:</span>
                  <Badge className="bg-white/20 text-white border-white/30">
                    {setting.languageName} {DIFFICULTY_ICON[setting.difficulty]} {setting.difficulty}
                  </Badge>
                </>
              ) : (
                !settingLoading && (
                  <div className="flex items-center gap-2">
                    <span className="text-purple-100 text-sm">프로필 설정이 필요합니다</span>
                    <Link to="/dashboard/learning-settings">
                      <Button size="sm" variant="secondary" className="bg-white text-purple-600 hover:bg-purple-50">
                        <Settings className="w-4 h-4 mr-1" />
                        설정하기
                      </Button>
                    </Link>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="bg-gradient-to-br from-purple-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>이론 학습</CardTitle>
                    <CardDescription>AI가 생성한 맞춤형 학습 자료</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-gray-600 mb-4">
                  개념을 체계적으로 이해하고 AI의 설명으로 학습하세요
                </p>
                <Link to="/dashboard/theory">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700">
                    학습 시작하기
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="bg-gradient-to-br from-indigo-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>문제 풀이</CardTitle>
                    <CardDescription>4지선다 방식의 실전 문제</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-gray-600 mb-4">
                  학습한 내용을 4지선다 문제로 확인하고 실력을 향상시키세요
                </p>
                <Link to="/dashboard/problems">
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                    문제 풀러가기
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Recent Topics */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>맞춤형 학습 추천</CardTitle>
                  <CardDescription>
                    {setting
                      ? `${setting.languageName} · ${setting.difficulty} 맞춤 학습 콘텐츠입니다`
                      : '프로필을 설정하여 맞춤형 학습을 시작하세요'
                    }
                  </CardDescription>
                </div>
                {setting && (
                  <Link to="/dashboard/learning-settings">
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4 mr-2" />
                      설정 변경
                    </Button>
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {topics.length > 0 && setting ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {topics.map((topic) => (
                    <div key={topic.id} className="border-2 rounded-lg p-4 hover:shadow-md transition-all hover:border-purple-300">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge className="bg-purple-600 text-white text-xs">
                              {setting.languageName}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={`text-xs border ${DIFFICULTY_COLOR[setting.difficulty]}`}
                            >
                              {DIFFICULTY_ICON[setting.difficulty]} {setting.difficulty}
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-sm leading-tight">{topic.title}</h3>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">진행률</span>
                          <span className="font-semibold text-purple-600">{topic.progress}%</span>
                        </div>
                        <Progress value={topic.progress} className="h-2" />
                        <Link to={`/dashboard/${topic.type}`}>
                          <Button variant="outline" size="sm" className="w-full hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300">
                            {topic.progress > 0 ? '계속 학습하기' : '학습 시작하기'}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    프로필 설정이 필요합니다
                  </h3>
                  <p className="text-gray-500 mb-6">
                    학습하고 싶은 언어와 난이도를 설정하면<br />
                    맞춤형 학습 콘텐츠를 추천해드립니다
                  </p>
                  <Link to="/dashboard/profile">
                    <Button className="bg-purple-500 hover:bg-purple-600">
                      <Settings className="w-4 h-4 mr-2" />
                      프로필 설정하기
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Co Logo Expandable Navigation */}
      <div className="fixed bottom-8 right-8 z-50">
        <div
          className={`absolute bottom-0 right-0 transition-all duration-500 ease-out ${
            showStats
              ? 'w-80 h-auto opacity-100 translate-y-0'
              : 'w-16 h-16 opacity-100 translate-y-0'
          }`}
        >
          <div
            className={`transition-all duration-500 ${
              showStats ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
            }`}
          >
            {showStats && (
              <Card className="shadow-2xl">
                <CardHeader className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold backdrop-blur-sm">
                        Co
                      </div>
                      <div>
                        <CardTitle className="text-lg text-white">학습 현황</CardTitle>
                        <CardDescription className="text-purple-100">나의 학습 통계</CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowStats(false)}
                      className="h-8 w-8 p-0 text-white hover:bg-white/20"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                  {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                      <div
                        key={stat.label}
                        className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 hover:from-purple-50 hover:to-indigo-50 transition-all duration-300 hover:shadow-md"
                        style={{
                          animation: showStats ? `slideIn 0.4s ease-out ${index * 0.1}s both` : 'none'
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white to-gray-50 flex items-center justify-center shadow-md">
                            <Icon className={`w-6 h-6 ${stat.color}`} />
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 font-medium">{stat.label}</p>
                            <p className="text-2xl font-bold mt-0.5">{stat.value}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>

          <button
            onClick={() => setShowStats(!showStats)}
            className={`absolute bottom-0 right-0 bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-full shadow-2xl flex items-center justify-center text-2xl font-bold transition-all duration-500 ${
              showStats
                ? 'w-0 h-0 opacity-0 scale-0'
                : 'w-16 h-16 opacity-100 scale-100 hover:scale-110'
            }`}
          >
            Co
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
