import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  getToken,
  getLanguages,
  getMyLearningSetting,
  saveLearningSetting as apiSaveLearningSetting,
  type LanguageItem,
  type ApiDifficulty,
} from '../lib/dataSource';
import { UI_TO_API_DIFFICULTY, API_TO_UI_DIFFICULTY, type UiDifficulty } from '../lib/constants';

// 백엔드는 사용자당 학습 설정을 1개만 지원한다 (언어 1개 + 난이도 1개)
// 예전 버전의 languageConfigs(배열) 구조는 백엔드와 맞지 않아 단일 설정으로 변경함
export interface LearningSetting {
  languageId: number;
  languageName: string;
  fieldName: string;
  difficulty: UiDifficulty;
}

interface ProfileContextType {
  languages: LanguageItem[];
  languagesLoading: boolean;
  setting: LearningSetting | null;
  settingLoading: boolean;
  saveSetting: (languageId: number, difficulty: UiDifficulty) => Promise<void>;
  refreshSetting: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [languages, setLanguages] = useState<LanguageItem[]>([]);
  const [languagesLoading, setLanguagesLoading] = useState(true);
  const [setting, setSetting] = useState<LearningSetting | null>(null);
  const [settingLoading, setSettingLoading] = useState(true);

  // #04 LANGUAGES - 학습 가능한 언어 목록을 백엔드에서 불러옴 (GET /api/learning/languages)
  useEffect(() => {
    getLanguages()
      .then(setLanguages)
      .catch(() => setLanguages([]))
      .finally(() => setLanguagesLoading(false));
  }, []);

  const refreshSetting = async () => {
    if (!getToken()) {
      setSetting(null);
      setSettingLoading(false);
      return;
    }
    setSettingLoading(true);
    try {
      // #06 USER-SETTING LOAD - 로그인된 사용자의 학습 설정 불러오기 (GET /api/learning/settings/me)
      const data = await getMyLearningSetting();
      setSetting({
        languageId: data.language_id,
        languageName: data.language_name,
        fieldName: data.field_name,
        difficulty: API_TO_UI_DIFFICULTY[data.difficulty],
      });
    } catch {
      // 아직 학습 설정을 만든 적이 없는 사용자일 수 있음
      setSetting(null);
    } finally {
      setSettingLoading(false);
    }
  };

  useEffect(() => {
    refreshSetting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveSetting = async (languageId: number, difficulty: UiDifficulty) => {
    const apiDifficulty: ApiDifficulty = UI_TO_API_DIFFICULTY[difficulty];
    // #07 USER-SETTING SAVE - 학습 설정 변경 시 백엔드에 저장 (POST /api/learning/settings)
    await apiSaveLearningSetting({ language_id: languageId, difficulty: apiDifficulty });
    await refreshSetting();
  };

  return (
    <ProfileContext.Provider
      value={{
        languages,
        languagesLoading,
        setting,
        settingLoading,
        saveSetting,
        refreshSetting,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
