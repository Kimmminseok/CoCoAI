import { useState } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { FileText, Sparkles, Check, Loader2, RotateCcw, Settings, Send, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '../components/ui/sonner';
import { useProfile } from '../contexts/ProfileContext';
import {
  generateProblems,
  submitProblems,
  type GeneratedProblem,
  type SubmitProblemsResult,
} from '../lib/dataSource';
import { DIFFICULTY_ICON, UI_TO_API_DIFFICULTY, type UiDifficulty } from '../lib/constants';

type ViewMode = 'setup' | 'solving';

const difficulties: UiDifficulty[] = ['초급', '중급', '고급'];

export default function ProblemSolving() {
  const { languages, setting } = useProfile();
  const [viewMode, setViewMode] = useState<ViewMode>('setup');
  const [selectedLanguageId, setSelectedLanguageId] = useState<number | null>(setting?.languageId ?? null);
  const [difficulty, setDifficulty] = useState<UiDifficulty | ''>('');
  const [problemCount, setProblemCount] = useState('5');

  const [problemSetId, setProblemSetId] = useState<string | null>(null);
  const [problems, setProblems] = useState<GeneratedProblem[]>([]);
  // problem_id -> 선택한 보기 인덱스(0-based, 화면 표시용)
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<SubmitProblemsResult | null>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);

  const selectedLanguageName = languages.find((l) => l.language_id === selectedLanguageId)?.language_name;

  const handleGenerate = async () => {
    if (!selectedLanguageId || !difficulty) {
      toast.error('언어와 난이도를 선택해주세요');
      return;
    }

    setIsGenerating(true);
    setSubmitResult(null);
    setUserAnswers({});

    try {
      // #10 GENERATE-PROBLEMS - POST /api/ai/problems (정답은 이 시점에 내려오지 않음)
      const data = await generateProblems({
        language_id: selectedLanguageId,
        difficulty: UI_TO_API_DIFFICULTY[difficulty],
        count: parseInt(problemCount),
      });
      setProblemSetId(data.problem_set_id);
      setProblems(data.problems);
      setViewMode('solving');
      toast.success('문제가 생성되었습니다!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '문제 생성에 실패했습니다. 백엔드 연동을 확인해주세요.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectAnswer = (problemId: number, optionIndex: number) => {
    if (submitResult) return; // 채점 완료 후에는 답 변경 불가
    setUserAnswers((prev) => ({ ...prev, [problemId]: optionIndex }));
  };

  const handleReset = () => {
    setViewMode('setup');
    setProblemSetId(null);
    setProblems([]);
    setUserAnswers({});
    setSubmitResult(null);
    setShowResultDialog(false);
  };

  const handleBackToSetup = () => {
    handleReset();
  };

  const handleSubmitAll = async () => {
    if (!problemSetId) return;

    const unanswered = problems.filter((p) => userAnswers[p.problem_id] === undefined);
    if (unanswered.length > 0) {
      toast.error(`${unanswered.length}개의 문제가 아직 선택되지 않았습니다.`);
      return;
    }

    setIsSubmitting(true);
    try {
      // #10-submit - POST /api/ai/problems/submit (서버가 채점하고 점수/티어까지 계산해서 돌려줌)
      const result = await submitProblems({
        problem_set_id: problemSetId,
        answers: problems.map((p) => ({
          problem_id: p.problem_id,
          selected_answer: (userAnswers[p.problem_id] + 1) as 1 | 2 | 3 | 4,
        })),
      });
      setSubmitResult(result);
      setShowResultDialog(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '제출에 실패했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (viewMode === 'setup') {
    return (
      <div className="space-y-6">
        <Toaster />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileText className="w-8 h-8 text-indigo-600" />
              문제 설정
            </h1>
            <p className="text-gray-600 mt-1">AI가 4지선다 문제를 생성합니다</p>
          </div>
          <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-100 to-purple-100 px-4 py-2 rounded-lg">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <span className="text-sm font-semibold text-indigo-700">4지선다 문제</span>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-br from-indigo-50 to-purple-50">
              <CardTitle className="text-2xl">문제 생성 설정</CardTitle>
              <CardDescription>AI가 4지선다 문제를 생성해드립니다</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div>
                <label className="text-sm font-semibold mb-2 block">프로그래밍 언어</label>
                <Select
                  value={selectedLanguageId ? String(selectedLanguageId) : ''}
                  onValueChange={(v) => setSelectedLanguageId(Number(v))}
                  disabled={!setting}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="언어 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages
                      .filter((lang) => lang.language_id === setting?.languageId)
                      .map((lang) => (
                        <SelectItem key={lang.language_id} value={String(lang.language_id)}>
                          {lang.language_name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {!setting && (
                  <p className="text-xs text-red-500 mt-1">
                    먼저{' '}
                    <Link to="/dashboard/learning-settings" className="underline font-semibold">
                      학습 설정
                    </Link>
                    에서 학습할 언어를 선택해주세요
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">난이도</label>
                <Select value={difficulty} onValueChange={(v) => setDifficulty(v as UiDifficulty)}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="난이도 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {difficulties.map((d) => (
                      <SelectItem key={d} value={d}>
                        {DIFFICULTY_ICON[d]} {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">문제 개수</label>
                <Select value={problemCount} onValueChange={setProblemCount}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5개</SelectItem>
                    <SelectItem value="10">10개</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !selectedLanguageId || !difficulty}
                className="w-full h-14 text-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    문제 생성 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    문제 생성하기
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(userAnswers).length;

  return (
    <div className="space-y-6">
      <Toaster />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="w-8 h-8 text-indigo-600" />
            문제 풀이
          </h1>
          <p className="text-gray-600 mt-1">
            {selectedLanguageName} · {difficulty} · {problems.length}개 문제
          </p>
        </div>
        <Button onClick={handleBackToSetup} variant="outline" className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          문제 재설정
        </Button>
      </div>

      <div className="flex gap-6">
        <div className="flex-1 space-y-4">
          {problems.map((problem) => {
            const userAnswer = userAnswers[problem.problem_id];
            const isAnswered = userAnswer !== undefined;

            return (
              <Card key={problem.problem_id} className="shadow-lg transition-all">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-indigo-600">문제 {problem.problem_id}</Badge>
                      {isAnswered && (
                        <Badge className="bg-gray-500 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          답안 선택됨
                        </Badge>
                      )}
                    </div>
                    <Badge variant="outline">{selectedLanguageName}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-lg mb-6 leading-relaxed font-semibold">{problem.question}</p>

                  <div className="space-y-3 mb-4">
                    {problem.choices.map((option, optionIndex) => {
                      const isSelected = userAnswer === optionIndex;
                      const disabled = !!submitResult;

                      let buttonStyle = 'w-full text-left p-4 border-2 rounded-lg transition-all ';
                      if (isSelected) {
                        buttonStyle += 'bg-indigo-50 border-indigo-500 text-indigo-900';
                      } else {
                        buttonStyle += 'bg-white border-gray-300 hover:border-indigo-300 hover:bg-indigo-50';
                      }
                      if (disabled) buttonStyle += ' cursor-not-allowed';

                      return (
                        <button
                          key={optionIndex}
                          onClick={() => handleSelectAnswer(problem.problem_id, optionIndex)}
                          disabled={disabled}
                          className={buttonStyle}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'
                              }`}
                            >
                              {optionIndex + 1}
                            </div>
                            <span className="flex-1">{option}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="w-80 space-y-4">
          <Card className="shadow-lg sticky top-6">
            <CardHeader className="bg-gradient-to-br from-indigo-50 to-purple-50">
              <CardTitle className="text-lg">작업 메뉴</CardTitle>
              <CardDescription>문제 풀이 관리</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <Card className="bg-indigo-50 border-indigo-200">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-sm mb-3 text-indigo-900 flex items-center gap-2">
                    📊 진행 상황
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center p-2 bg-white rounded">
                      <span className="text-gray-600">답안 선택</span>
                      <span className="font-bold text-indigo-600 text-lg">{answeredCount}/{problems.length}</span>
                    </div>
                    {submitResult && (
                      <>
                        <div className="flex justify-between items-center p-2 bg-white rounded">
                          <span className="text-gray-600">정답</span>
                          <span className="font-bold text-green-600 text-lg">{submitResult.result.correct_count}개</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-white rounded border-t-2 border-indigo-200">
                          <span className="text-gray-600">정답률</span>
                          <span className="font-bold text-purple-600 text-lg">{submitResult.result.accuracy_rate}%</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-white rounded">
                          <span className="text-gray-600">획득 점수</span>
                          <span className="font-bold text-orange-600 text-lg">+{submitResult.result.earned_score}pt</span>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="w-full h-12 text-base border-2 hover:bg-gray-50"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  새 문제 풀기
                </Button>

                {!submitResult && (
                  <Button
                    onClick={handleSubmitAll}
                    disabled={isSubmitting}
                    className="w-full h-12 text-base bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    전체 답안 제출
                  </Button>
                )}

                {submitResult && (
                  <Button
                    onClick={() => setShowResultDialog(true)}
                    className="w-full h-12 text-base bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  >
                    결과 다시 보기
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Results Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-indigo-600" />
              문제 풀이 결과
            </DialogTitle>
            {submitResult && (
              <DialogDescription>
                총 {submitResult.result.total_count}문제 중 {submitResult.result.correct_count}문제 정답 · 정답률{' '}
                {submitResult.result.accuracy_rate}% · 획득 점수 {submitResult.result.earned_score}pt · 현재 티어{' '}
                {submitResult.result.tier.detail_tier}
              </DialogDescription>
            )}
          </DialogHeader>

          {submitResult && (
            <div className="space-y-4 mt-4">
              {submitResult.feedback.some((f) => !f.is_correct) && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-red-700 font-semibold">
                    <AlertCircle className="w-5 h-5" />
                    <h3>오답 문제</h3>
                  </div>
                  {submitResult.feedback.filter((f) => !f.is_correct).map((f) => (
                    <div key={f.problem_id} className="bg-red-50 border-l-4 border-red-500 rounded-lg p-5">
                      <div className="flex items-start gap-3">
                        <Badge className="bg-red-600 mt-1">문제 {f.problem_id}</Badge>
                        <div className="flex-1 space-y-3">
                          <p className="font-semibold text-gray-900 text-base">{f.question}</p>
                          <div className="space-y-2">
                            <div className="text-sm text-red-700">
                              <strong>선택한 답:</strong> {f.selected_answer}번 - {f.choices[f.selected_answer - 1]}
                            </div>
                            <div className="text-sm text-green-700">
                              <strong>정답:</strong> {f.correct_answer}번 - {f.choices[f.correct_answer - 1]}
                            </div>
                          </div>
                          <div className="bg-white/70 rounded-lg p-3 border border-red-200">
                            <p className="text-sm text-gray-700">
                              <strong className="text-gray-900">📖 해설:</strong> {f.explanation}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {submitResult.feedback.some((f) => f.is_correct) && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-700 font-semibold">
                    <CheckCircle className="w-5 h-5" />
                    <h3>정답 문제</h3>
                  </div>
                  {submitResult.feedback.filter((f) => f.is_correct).map((f) => (
                    <div key={f.problem_id} className="bg-green-50 border-l-4 border-green-500 rounded-lg p-5">
                      <div className="flex items-start gap-3">
                        <Badge className="bg-green-600 mt-1">문제 {f.problem_id}</Badge>
                        <div className="flex-1 space-y-3">
                          <p className="font-semibold text-gray-900 text-base">{f.question}</p>
                          <div className="text-sm text-green-700">
                            <strong>정답:</strong> {f.correct_answer}번 - {f.choices[f.correct_answer - 1]}
                          </div>
                          <div className="bg-white/70 rounded-lg p-3 border border-green-200">
                            <p className="text-sm text-gray-700">
                              <strong className="text-gray-900">📖 해설:</strong> {f.explanation}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <Button onClick={() => setShowResultDialog(false)} variant="outline" className="flex-1">
              닫기
            </Button>
            <Button onClick={handleReset} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
              <RotateCcw className="w-4 h-4 mr-2" />
              다시 풀기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
