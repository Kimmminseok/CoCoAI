import { useNavigate, Link } from 'react-router';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { useProfile } from '../contexts/ProfileContext';
import { getMyScore, getMyStudySessions, type ScoreResult, type StudySession, clearToken } from '../lib/dataSource';
import { getTierMeta, TIER_ORDER } from '../lib/constants';
import {
  User,
  TrendingUp,
  Clock,
  Settings,
  Award,
  LogOut,
  ChevronRight,
  Target,
  Trophy,
  Star,
  Zap,
  Info,
  ChevronUp,
  Loader2,
} from 'lucide-react';

export default function Profile() {
  const { setting } = useProfile();
  const navigate = useNavigate();
  const [showTierInfo, setShowTierInfo] = useState(false);

  const [score, setScore] = useState<ScoreResult | null>(null);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // #08 USER-STATS - GET /api/scores/me, GET /api/study-sessions/me
  useEffect(() => {
    Promise.all([getMyScore(), getMyStudySessions()])
      .then(([scoreData, sessionData]) => {
        setScore(scoreData);
        setSessions(sessionData);
      })
      .catch(() => {
        setScore(null);
        setSessions([]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleLogout = () => {
    clearToken();
    navigate('/');
  };

  // 백엔드가 정답률/문제 수 집계 API를 별도로 주지 않아서, 학습 기록 목록으로부터 합산
  const totalProblems = sessions.reduce((sum, s) => sum + s.total_count, 0);
  const correctProblems = sessions.reduce((sum, s) => sum + s.correct_count, 0);
  const correctRate = totalProblems > 0 ? Math.round((correctProblems / totalProblems) * 100) : 0;

  const totalScore = score?.total_score ?? 0;
  const currentTierName = score?.tier.tier_name ?? 'B';
  const currentTierMeta = getTierMeta(currentTierName);
  const nextTierName = score?.next_tier?.tier_name ?? null;
  const progress = score?.tier.progress_percent ?? 0;
  const pointsToNext = score?.next_tier?.remaining_score ?? 0;

  const menuItems = [
    {
      title: '학습 설정',
      description: '언어 및 난이도 관리',
      icon: Settings,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      path: '/dashboard/learning-settings',
    },
    {
      title: '계정 관리',
      description: '프로필 및 개인정보 설정',
      icon: User,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      path: '/dashboard/account',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Profile Header */}
      <Card className="shadow-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-none">
        <CardContent className="p-8">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
              <User className="w-12 h-12 text-purple-500" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">학습자님</h1>
              <p className="text-purple-100 mb-4">CoCoAI와 함께 성장하는 개발자</p>
              <div className="flex flex-wrap gap-2">
                {setting && (
                  <Badge className="bg-white/20 text-white border-white/30">
                    {setting.languageName}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Stats */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Correct Rate */}
            <Card className="shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">정답률</CardTitle>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-green-600">{correctRate}%</span>
                  <span className="text-sm text-gray-500">
                    ({correctProblems}/{totalProblems})
                  </span>
                </div>
                <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{ width: `${correctRate}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">목표: 90% 이상</p>
              </CardContent>
            </Card>

            {/* Study Time - 백엔드에 학습 시간 집계 API가 없어 '-'로 유지 */}
            <Card className="shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">총 학습시간</CardTitle>
                  <Clock className="w-5 h-5 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-blue-600">-</span>
                </div>
                <p className="text-sm text-gray-600 mt-4">이번 주: -</p>
              </CardContent>
            </Card>
          </div>

          {/* CoCoAI Ranking Section */}
          <Card className="shadow-lg">
            <CardHeader className={`bg-gradient-to-r ${currentTierMeta.color} text-white`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center text-3xl">
                    {currentTierMeta.icon}
                  </div>
                  <div>
                    <CardTitle className="text-white text-2xl">CoCoAI 랭킹</CardTitle>
                    <CardDescription className="text-white/90 text-base">
                      {currentTierMeta.fullName} ({score?.tier.detail_tier ?? currentTierName})
                    </CardDescription>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">{totalScore.toLocaleString()}</div>
                  <div className="text-white/90 text-sm">점수</div>
                </div>
              </div>
              <Button
                onClick={() => setShowTierInfo(true)}
                variant="outline"
                className="w-full bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white"
              >
                <Info className="w-4 h-4 mr-2" />
                티어 산정 기준 및 상세 정보
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              {/* Progress to Next Tier */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-700 flex items-center gap-2">
                    {nextTierName ? (
                      <>
                        <ChevronUp className="w-5 h-5 text-green-600" />
                        다음 티어까지
                      </>
                    ) : (
                      <>
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        최고 티어 달성!
                      </>
                    )}
                  </span>
                  {nextTierName && (
                    <span className="text-sm font-semibold text-indigo-600">
                      {pointsToNext.toLocaleString()} 점 남음
                    </span>
                  )}
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${currentTierMeta.color} transition-all duration-500`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                {nextTierName && (
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <span>{currentTierName}</span>
                    <span>{nextTierName}</span>
                  </div>
                )}
              </div>

              {/* All Tiers Display (임계값은 명세서에 문서화된 값 기준) */}
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  모든 티어
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {TIER_ORDER.map((tier) => {
                    const meta = getTierMeta(tier.shortName);
                    const isUnlocked = totalScore >= tier.threshold;
                    const isCurrent = tier.shortName === currentTierName;

                    return (
                      <div
                        key={tier.shortName}
                        className={`rounded-lg p-4 transition-all ${
                          isCurrent
                            ? `bg-gradient-to-br ${meta.color} text-white shadow-lg scale-105 border-2 border-white`
                            : isUnlocked
                            ? `bg-gradient-to-br ${meta.color} text-white opacity-70 hover:opacity-90`
                            : 'bg-gray-100 opacity-50 grayscale'
                        }`}
                      >
                        <div className="text-3xl text-center mb-2">{meta.icon}</div>
                        <h4 className={`font-bold text-center text-sm ${isUnlocked ? 'text-white' : 'text-gray-600'}`}>
                          {meta.fullName}
                        </h4>
                        <p className={`text-xs text-center mt-1 ${isUnlocked ? 'text-white/80' : 'text-gray-500'}`}>
                          {tier.threshold.toLocaleString()} pts
                        </p>
                        {isCurrent && (
                          <div className="mt-2 text-center">
                            <Badge className="bg-white/30 text-white border-white/50 text-xs">
                              현재 티어
                            </Badge>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Score Breakdown - 난이도별 점수 상세 집계는 백엔드 API에 없어 총점만 표시 */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-purple-500" />
                  점수 구성
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-gray-700">연속 학습일</span>
                    <span className="font-bold text-blue-600">{score?.streak_days ?? 0}일</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-100 rounded-lg border-2 border-purple-300 mt-3">
                    <span className="font-bold text-gray-800">총 점수</span>
                    <span className="font-bold text-purple-600 text-lg">{totalScore.toLocaleString()} pts</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Menu Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Card
                  key={item.title}
                  className="shadow-md hover:shadow-lg transition-shadow cursor-pointer group"
                >
                  <Link to={item.path}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 ${item.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-7 h-7 ${item.color}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                          <p className="text-sm text-gray-600">{item.description}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              );
            })}
          </div>

          {/* Logout Button */}
          <Card className="shadow-md border-red-200">
            <CardContent className="p-6">
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <LogOut className="w-5 h-5 mr-2" />
                로그아웃
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Quick Stats */}
        <div className="lg:col-span-1">
          <Card className="shadow-lg sticky top-6">
            <CardHeader className="bg-gradient-to-br from-blue-50 to-purple-50">
              <CardTitle className="text-lg">학습 통계</CardTitle>
              <CardDescription>전체 활동 요약</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {/* Quick Stats */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-medium">완료한 이론</span>
                  </div>
                  <span className="font-bold text-blue-600">-</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium">해결한 문제</span>
                  </div>
                  <span className="font-bold text-green-600">{totalProblems || '-'}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-orange-500" />
                    <span className="text-sm font-medium">연속 학습일</span>
                  </div>
                  <span className="font-bold text-orange-600">{score?.streak_days ?? '-'}</span>
                </div>

                <div className={`flex items-center justify-between p-3 rounded-lg bg-gradient-to-r ${currentTierMeta.color}`}>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-white" />
                    <span className="text-sm font-medium text-white">현재 랭킹</span>
                  </div>
                  <span className="font-bold text-white">{score?.tier.detail_tier ?? currentTierName}</span>
                </div>
              </div>

              {/* Ranking Tips */}
              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-2 text-sm">💡 랭킹 상승 팁</h4>
                <ul className="text-xs text-gray-600 space-y-2">
                  {currentTierMeta.tips.map((tip) => (
                    <li key={tip} className="flex items-start gap-2">
                      <span className="text-purple-500 mt-0.5">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tier Information Dialog */}
      <Dialog open={showTierInfo} onOpenChange={setShowTierInfo}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Info className="w-6 h-6 text-indigo-600" />
              CoCoAI 랭킹 시스템 안내
            </DialogTitle>
            <DialogDescription>
              티어 산정 기준을 확인하세요 (정확한 점수 계산은 서버에서 처리됩니다)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            <div>
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-900">
                <Trophy className="w-5 h-5 text-yellow-500" />
                티어별 상세 정보
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {TIER_ORDER.map((tier) => {
                  const meta = getTierMeta(tier.shortName);
                  const isCurrentTier = tier.shortName === currentTierName;
                  const isUnlocked = totalScore >= tier.threshold;

                  return (
                    <div
                      key={tier.shortName}
                      className={`rounded-lg p-4 border-2 transition-all ${
                        isCurrentTier
                          ? `bg-gradient-to-br ${meta.color} text-white border-white shadow-lg`
                          : isUnlocked
                          ? 'bg-gray-50 border-gray-300'
                          : 'bg-gray-100 border-gray-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-4xl">{meta.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className={`font-bold text-lg ${isCurrentTier ? 'text-white' : 'text-gray-900'}`}>
                              {meta.fullName}
                            </h4>
                            {isCurrentTier && (
                              <Badge className="bg-white/30 text-white border-white/50 text-xs">
                                현재
                              </Badge>
                            )}
                          </div>
                          <p className={`text-sm mb-2 ${isCurrentTier ? 'text-white/90' : 'text-gray-700'}`}>
                            {meta.description}
                          </p>
                          <p className={`text-xs font-semibold mb-2 ${isCurrentTier ? 'text-white' : 'text-indigo-600'}`}>
                            필요 점수: {tier.threshold.toLocaleString()} 점
                          </p>
                          <div className={`text-xs ${isCurrentTier ? 'text-white/80' : 'text-gray-600'}`}>
                            <p className="font-semibold mb-1">💡 상승 팁:</p>
                            <ul className="space-y-0.5">
                              {meta.tips.map((tip) => (
                                <li key={tip}>• {tip}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              onClick={() => setShowTierInfo(false)}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            >
              확인
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
