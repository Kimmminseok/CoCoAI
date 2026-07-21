import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { DIFFICULTY_ICON, DIFFICULTY_COLOR } from '../lib/constants';
import { pickRandomTryProblems, type DifficultyTaggedProblem } from '../lib/sampleProblems';

const AUTO_ADVANCE_MS = 1500;

export default function TryProblemWidget() {
  const navigate = useNavigate();
  const [problems, setProblems] = useState<DifficultyTaggedProblem[]>(() => pickRandomTryProblems());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showSignupDialog, setShowSignupDialog] = useState(false);

  const currentProblem = problems[currentIndex];

  useEffect(() => {
    if (selectedIndex === null) return;

    const timer = setTimeout(() => {
      if (currentIndex < problems.length - 1) {
        setCurrentIndex((i) => i + 1);
        setSelectedIndex(null);
      } else {
        setShowSignupDialog(true);
      }
    }, AUTO_ADVANCE_MS);

    return () => clearTimeout(timer);
  }, [selectedIndex, currentIndex, problems.length]);

  const handleSelect = (optionIndex: number) => {
    if (selectedIndex !== null) return;
    setSelectedIndex(optionIndex);
  };

  const handleDecline = () => {
    setShowSignupDialog(false);
    setProblems(pickRandomTryProblems());
    setCurrentIndex(0);
    setSelectedIndex(null);
  };

  const handleApprove = () => {
    setShowSignupDialog(false);
    navigate('/login');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-xl border-purple-100">
        <CardHeader className="bg-gradient-to-br from-indigo-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">체험용 예시 문제</CardTitle>
              <Badge variant="outline" className={`text-xs border ${DIFFICULTY_COLOR[currentProblem.difficulty]}`}>
                {DIFFICULTY_ICON[currentProblem.difficulty]} {currentProblem.difficulty}
              </Badge>
            </div>
            <span className="text-sm font-semibold text-indigo-700">
              {currentIndex + 1}/{problems.length}
            </span>
          </div>
          <CardDescription>가입 없이 C 언어 문제를 바로 풀어보세요</CardDescription>
          <div className="flex items-center gap-2 pt-1">
            {problems.map((_, i) => (
              <span
                key={i}
                className={`h-2 rounded-full transition-all ${
                  i === currentIndex ? 'w-6 bg-indigo-600' : i < currentIndex ? 'w-2 bg-indigo-300' : 'w-2 bg-gray-300'
                }`}
              />
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-lg mb-6 leading-relaxed font-semibold whitespace-pre-line">
            {currentProblem.question}
          </p>

          <div className="space-y-3">
            {currentProblem.choices.map((option, optionIndex) => {
              const isAnswered = selectedIndex !== null;
              const isCorrectChoice = optionIndex === currentProblem.answerIndex;
              const isSelected = optionIndex === selectedIndex;

              let buttonStyle = 'w-full text-left p-4 border-2 rounded-lg transition-all ';
              if (isAnswered) {
                if (isCorrectChoice) {
                  buttonStyle += 'bg-green-50 border-green-500 text-green-900';
                } else if (isSelected) {
                  buttonStyle += 'bg-red-50 border-red-500 text-red-900';
                } else {
                  buttonStyle += 'bg-white border-gray-200 text-gray-400';
                }
                buttonStyle += ' cursor-not-allowed';
              } else {
                buttonStyle += 'bg-white border-gray-300 hover:border-indigo-300 hover:bg-indigo-50';
              }

              return (
                <button
                  key={optionIndex}
                  onClick={() => handleSelect(optionIndex)}
                  disabled={isAnswered}
                  className={buttonStyle}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold ${
                        isAnswered && isCorrectChoice
                          ? 'bg-green-600 text-white'
                          : isAnswered && isSelected
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {optionIndex + 1}
                    </div>
                    <span className="flex-1">{option}</span>
                    {isAnswered && isCorrectChoice && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                    {isAnswered && isSelected && !isCorrectChoice && <XCircle className="w-5 h-5 text-red-600" />}
                  </div>
                </button>
              );
            })}
          </div>

          {selectedIndex !== null && (
            <div className="bg-white/70 rounded-lg p-3 border border-indigo-200 mt-4">
              <p className="text-sm text-gray-700">
                <strong className="text-gray-900">📖 해설:</strong> {currentProblem.explanation}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showSignupDialog} onOpenChange={setShowSignupDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-600" />
              체험 완료!
            </DialogTitle>
            <DialogDescription>더 많은 문제를 풀고 싶다면 지금 바로 가입하세요</DialogDescription>
          </DialogHeader>

          <div className="flex gap-3 mt-4">
            <Button onClick={handleDecline} variant="outline" className="flex-1">
              거절하기
            </Button>
            <Button
              onClick={handleApprove}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              승인
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
