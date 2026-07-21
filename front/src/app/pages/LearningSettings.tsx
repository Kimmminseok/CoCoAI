import { useState, useEffect } from 'react';
import { useProfile } from '../contexts/ProfileContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Languages, TrendingUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '../components/ui/sonner';
import { DIFFICULTY_ICON, LANGUAGE_COLOR_PALETTE, type UiDifficulty } from '../lib/constants';

const difficulties: UiDifficulty[] = ['초급', '중급', '고급'];

export default function LearningSettings() {
  const { languages, languagesLoading, setting, settingLoading, saveSetting } = useProfile();

  const [selectedLanguageId, setSelectedLanguageId] = useState<number | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<UiDifficulty>('초급');
  const [isSaving, setIsSaving] = useState(false);

  // 실제 저장된 현재 설정 표시용
  const [currentSetting, setCurrentSetting] = useState<any>(null);
  const [isLoadingSetting, setIsLoadingSetting] = useState(true);

  useEffect(() => {
    if (settingLoading) {
      setIsLoadingSetting(true);
      return;
    }

    if (setting) {
      setCurrentSetting(setting);
      setSelectedLanguageId(setting.languageId);
      setSelectedDifficulty(setting.difficulty);
    } else {
      setCurrentSetting(null);
      setSelectedLanguageId(null);
      setSelectedDifficulty('초급');
    }

    setIsLoadingSetting(false);
  }, [setting, settingLoading]);

  const handleSave = async () => {
    if (!selectedLanguageId) {
      toast.error('학습할 언어를 선택해주세요');
      return;
    }

    setIsSaving(true);

    try {
      await saveSetting(selectedLanguageId, selectedDifficulty);

      const selectedLanguage = languages.find(
        (lang) => lang.language_id === selectedLanguageId
      );

      setCurrentSetting({
        languageId: selectedLanguageId,
        languageName: selectedLanguage?.language_name ?? '선택한 언어',
        difficulty: selectedDifficulty,
      });

      toast.success('학습 설정이 저장되었습니다!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '설정 저장에 실패했습니다');
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = languagesLoading || settingLoading;

  return (
    <div className="space-y-6">
      <Toaster />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Languages className="w-8 h-8 text-purple-500" />
            학습 설정
          </h1>
          <p className="text-gray-600 mt-1">학습할 언어와 난이도를 선택하세요</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Languages className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle>학습 언어 및 난이도</CardTitle>
                  <CardDescription>현재는 한 번에 하나의 언어만 설정할 수 있어요</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                </div>
              ) : (
                <>
                  {/* Language Selection */}
                  <div>
                    <h4 className="font-semibold mb-3">언어 선택</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {languages.map((lang, index) => (
                        <button
                          key={lang.language_id}
                          onClick={() => setSelectedLanguageId(lang.language_id)}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            selectedLanguageId === lang.language_id
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-purple-200'
                          }`}
                        >
                          <div
                            className={`w-10 h-10 ${
                              LANGUAGE_COLOR_PALETTE[index % LANGUAGE_COLOR_PALETTE.length]
                            } rounded-lg flex items-center justify-center mx-auto mb-2`}
                          >
                            <span className="text-white font-bold text-xs">
                              {lang.language_name.length > 2
                                ? lang.language_name.slice(0, 2)
                                : lang.language_name.charAt(0)}
                            </span>
                          </div>
                          <p className="text-center font-semibold text-sm">{lang.language_name}</p>
                          <p className="text-center text-xs text-gray-500">{lang.field_name}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Difficulty Selection */}
                  <div>
                    <h4 className="font-semibold mb-3">난이도 선택</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {difficulties.map((difficulty) => (
                        <button
                          key={difficulty}
                          onClick={() => setSelectedDifficulty(difficulty)}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            selectedDifficulty === difficulty
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="text-center">
                            <div className="text-2xl mb-1">{DIFFICULTY_ICON[difficulty]}</div>
                            <p className="font-bold">{difficulty}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handleSave}
                    disabled={isSaving || !selectedLanguageId}
                    className="w-full h-12 bg-purple-500 hover:bg-purple-600"
                  >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : '저장하기'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                난이도별 특징
              </h3>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🌱</span>
                  <div>
                    <p className="font-semibold text-green-700">초급</p>
                    <p className="text-sm text-gray-700">기초 문법과 개념부터 차근차근 학습합니다</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-2xl">🌿</span>
                  <div>
                    <p className="font-semibold text-orange-700">중급</p>
                    <p className="text-sm text-gray-700">실전 활용과 응용 문제를 중심으로 학습합니다</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-2xl">🌳</span>
                  <div>
                    <p className="font-semibold text-red-700">고급</p>
                    <p className="text-sm text-gray-700">고급 패턴과 최적화 기법을 다룹니다</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-1">
          <Card className="shadow-lg sticky top-6">
            <CardHeader className="bg-gradient-to-br from-purple-50 to-pink-50">
              <CardTitle className="text-lg">현재 설정</CardTitle>
              <CardDescription>지금 학습 중인 언어</CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              {isLoadingSetting ? (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">설정을 불러오는 중...</p>
                </div>
              ) : currentSetting ? (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-semibold">{currentSetting.languageName}</p>
                  <p className="text-sm text-gray-600">
                    {DIFFICULTY_ICON[currentSetting.difficulty]} {currentSetting.difficulty}
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-semibold text-gray-700">아직 설정된 언어가 없습니다</p>
                  <p className="text-sm text-gray-500 mt-1">
                    언어와 난이도를 선택한 뒤 저장해주세요.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}