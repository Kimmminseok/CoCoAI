import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { BookOpen, Sparkles, Loader2, Settings, BookmarkCheck } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { useProfile } from '../contexts/ProfileContext';
import { toast } from 'sonner';
import { Toaster } from '../components/ui/sonner';
import { generateTheory } from '../lib/dataSource';
import { UI_TO_API_DIFFICULTY } from '../lib/constants';

type ViewMode = 'setup' | 'learning';

export default function TheoryStudy() {
  const { languages, setting } = useProfile();
  const [viewMode, setViewMode] = useState<ViewMode>('setup');
  const [selectedLanguage, setSelectedLanguage] = useState(setting?.languageName ?? '');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (setting) {
      setSelectedLanguage(setting.languageName);
    }
  }, [setting]);

  const handleGenerate = async () => {
    if (!setting) {
      toast.error('먼저 학습 설정에서 학습할 언어와 난이도를 선택해주세요');
      return;
    }
    if (!selectedTopic) {
      toast.error('학습 주제를 입력해주세요');
      return;
    }

    setIsLoading(true);

    try {
      // #09 GENERATE-THEORY - AI 이론 생성 API (명세서에 없는 임시 API, dataSource.ts 경유 -> api.ts의 generateTheory 주석 참고)
      const data = await generateTheory({
        language_id: setting.languageId,
        difficulty: UI_TO_API_DIFFICULTY[setting.difficulty],
        topic: selectedTopic,
      });
      setGeneratedContent(data.content);
      setViewMode('learning');
      toast.success('학습 자료가 생성되었습니다!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '학습 자료 생성에 실패했습니다. 백엔드 연동을 확인해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToSetup = () => {
    setViewMode('setup');
  };

  const handleMarkComplete = () => {
    toast.success('학습을 완료했습니다! 🎉');
  };

  if (viewMode === 'setup') {
    return (
      <div className="space-y-6">
        <Toaster />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <BookOpen className="w-8 h-8 text-purple-600" />
              이론 학습 설정
            </h1>
            <p className="text-gray-600 mt-1">학습할 언어와 주제를 선택하세요</p>
          </div>
          <div className="flex items-center gap-2 bg-gradient-to-r from-purple-100 to-indigo-100 px-4 py-2 rounded-lg">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-semibold text-purple-700">AI 생성 콘텐츠</span>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-br from-purple-50 to-indigo-50">
              <CardTitle className="text-2xl">학습 자료 생성 설정</CardTitle>
              <CardDescription>AI가 맞춤형 학습 자료를 생성해드립니다</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div>
                <label className="text-sm font-semibold mb-2 block">프로그래밍 언어</label>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage} disabled={!setting}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="언어 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages
                      .filter((lang) => lang.language_id === setting?.languageId)
                      .map((lang) => (
                        <SelectItem key={lang.language_id} value={lang.language_name}>
                          {lang.language_name}
                          {setting?.languageId === lang.language_id ? ` (${setting.difficulty})` : ''}
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
                <label className="text-sm font-semibold mb-2 block">학습 주제</label>
                <Textarea
                  placeholder="예: 변수와 데이터 타입, 함수와 스코프, 비동기 프로그래밍..."
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>

              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-sm mb-2 text-purple-900">💡 AI 학습 도우미</h4>
                  <p className="text-xs text-purple-700 leading-relaxed">
                    생성형 AI가 선택한 언어와 주제에 맞는 맞춤형 학습 자료를 생성합니다.
                    설정한 난이도에 따라 설명의 깊이가 조정됩니다.
                  </p>
                </CardContent>
              </Card>

              <Button
                onClick={handleGenerate}
                disabled={isLoading || !selectedLanguage || !selectedTopic}
                className="w-full h-14 text-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    AI 콘텐츠 생성 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    학습 자료 생성하기
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toaster />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-purple-600" />
            이론 학습
          </h1>
          <p className="text-gray-600 mt-1">
            {selectedLanguage} · {selectedTopic}
          </p>
        </div>
        <Button
          onClick={handleBackToSetup}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Settings className="w-4 h-4" />
          학습 재설정
        </Button>
      </div>

      <div className="flex gap-6">
        <div className="flex-1">
          <Card className="shadow-lg min-h-[600px]">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>학습 콘텐츠</CardTitle>
                  <CardDescription className="mt-1">
                    <span className="flex items-center gap-2 mt-2">
                      <Badge className="bg-purple-600">{selectedLanguage}</Badge>
                      <span className="text-sm">{selectedTopic}</span>
                    </span>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-96 space-y-4">
                  <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
                  <p className="text-gray-600">AI가 학습 자료를 생성하고 있습니다...</p>
                  <p className="text-sm text-gray-500">잠시만 기다려주세요</p>
                </div>
              ) : generatedContent ? (
                <div className="prose prose-sm max-w-none">
                  {generatedContent.split('\n').map((line, index) => {
                    if (line.startsWith('# ')) {
                      return <h1 key={index} className="text-2xl font-bold mt-6 mb-4 text-purple-900">{line.slice(2)}</h1>;
                    } else if (line.startsWith('## ')) {
                      return <h2 key={index} className="text-xl font-bold mt-5 mb-3 text-purple-800">{line.slice(3)}</h2>;
                    } else if (line.startsWith('### ')) {
                      return <h3 key={index} className="text-lg font-semibold mt-4 mb-2 text-purple-700">{line.slice(4)}</h3>;
                    } else if (line.startsWith('```')) {
                      return (
                        <div key={index} className="bg-gray-900 rounded-lg p-4 my-4">
                          <code className="text-green-400 text-sm">{line.replace(/```/g, '')}</code>
                        </div>
                      );
                    } else if (line.startsWith('- ')) {
                      return <li key={index} className="ml-4 my-1 text-gray-700">{line.slice(2)}</li>;
                    } else if (line.trim() === '') {
                      return <br key={index} />;
                    } else {
                      return <p key={index} className="my-2 leading-relaxed text-gray-800">{line}</p>;
                    }
                  })}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="w-80 space-y-4">
          <Card className="shadow-lg sticky top-6">
            <CardHeader className="bg-gradient-to-br from-purple-50 to-indigo-50">
              <CardTitle className="text-lg">학습 메뉴</CardTitle>
              <CardDescription>학습 관리</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-sm mb-3 text-purple-900 flex items-center gap-2">
                    📚 학습 정보
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center p-2 bg-white rounded">
                      <span className="text-gray-600">언어</span>
                      <span className="font-bold text-purple-600">{selectedLanguage}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white rounded">
                      <span className="text-gray-600">주제</span>
                      <span className="font-bold text-purple-600 text-xs truncate max-w-[120px]" title={selectedTopic}>
                        {selectedTopic}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3">
                <Button
                  onClick={handleMarkComplete}
                  className="w-full h-12 text-base bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  <BookmarkCheck className="w-4 h-4 mr-2" />
                  학습 완료 표시
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
