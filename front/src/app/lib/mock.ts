// ⚠️ 이 파일은 백엔드 없이 프론트를 개발/데모하기 위한 "가짜 API"입니다.
// api.ts와 함수 이름·타입이 완전히 동일하므로, 실제 백엔드가 준비되면
// dataSource.ts의 USE_MOCK 값을 false로 바꾸기만 하면 바로 실제 API로 전환됩니다.
//
// 백엔드 담당자에게: 아래 각 함수의 입력/출력 형태가 곧 API 명세서의 요청/응답 형태입니다.
// (API 명세서_김민석.md 기준으로 맞춰뒀습니다)

import type {
  SignupPayload,
  SignupResult,
  LoginPayload,
  LoginResult,
  MeResult,
  FieldItem,
  LanguageItem,
  SaveLearningSettingPayload,
  LearningSettingResult,
  GenerateProblemsPayload,
  GenerateProblemsResult,
  GeneratedProblem,
  SubmitProblemsPayload,
  SubmitProblemsResult,
  ScoreResult,
  StudySession,
  DashboardSummary,
  GenerateTheoryPayload,
  GenerateTheoryResult,
  FindIdPayload,
  FindIdResult,
  PasswordResetRequestPayload,
  PasswordResetRequestResult,
  PasswordResetPayload,
  PasswordResetResult,
} from './api';
import { API_TO_UI_DIFFICULTY } from './constants';

// 네트워크 호출처럼 살짝 지연시켜서 로딩 상태(스피너 등)를 테스트해볼 수 있게 함
const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

const LS_SETTING = 'mock_learning_setting';
const LS_SESSIONS = 'mock_study_sessions';
const LS_SCORE = 'mock_score';
const LS_PROBLEM_SETS = 'mock_problem_sets'; // problem_set_id -> 정답 맵 (임시 메모리 저장, 새로고침하면 초기화)
const LS_PASSWORD = 'mock_password'; // 아이디/비밀번호 찾기 목업용 - 변경된 비밀번호를 저장해서 다음 로그인 검증에 반영

// 아이디/비밀번호 찾기(#14~#16) 목업이 기준으로 삼는 대표 데모 계정.
// getMe(), getDashboardSummary()에서 이미 쓰던 값(login_id: 'test01' 등)과 동일하게 맞춤.
// 데모 계정: test01 / password123 (비밀번호 찾기나 계정 관리에서 바꾸지 않았다면 이 값으로 로그인하세요)
const MOCK_USER = {
  login_id: 'test01',
  name: '테스트 사용자',
  email: 'test01@test.com',
  phone: '010-1234-5678',
};
const DEFAULT_MOCK_PASSWORD = 'password123';

// 현재 비밀번호 조회/갱신. find-password(#14~#16)의 resetPassword와 AccountSettings.tsx의
// 비밀번호 확인/변경이 동일한 저장소(mock_password)를 기준으로 삼도록 이 두 함수로 로직을 일원화함.
// dataSource.ts를 통해 두 화면 모두에서 재사용됨.
export function getMockPassword() {
  return localStorage.getItem(LS_PASSWORD) ?? DEFAULT_MOCK_PASSWORD;
}

export function setMockPassword(newPassword: string) {
  localStorage.setItem(LS_PASSWORD, newPassword);
}

// ---------- 목업용 고정 데이터 ----------

const MOCK_FIELDS: FieldItem[] = [
  { field_id: 1, field_name: '백엔드' },
  { field_id: 2, field_name: '프론트엔드' },
];

const MOCK_LANGUAGES: LanguageItem[] = [
  { language_id: 1, language_name: 'C', field_id: 1, field_name: '백엔드' },
  { language_id: 2, language_name: 'Java', field_id: 1, field_name: '백엔드' },
  { language_id: 3, language_name: 'Python', field_id: 1, field_name: '백엔드' },
  { language_id: 4, language_name: 'C++', field_id: 1, field_name: '백엔드' },
  { language_id: 5, language_name: 'HTML', field_id: 2, field_name: '프론트엔드' },
  { language_id: 6, language_name: 'CSS', field_id: 2, field_name: '프론트엔드' },
  { language_id: 7, language_name: 'JavaScript', field_id: 2, field_name: '프론트엔드' },
  { language_id: 8, language_name: 'React', field_id: 2, field_name: '프론트엔드' },
  { language_id: 9, language_name: 'TypeScript', field_id: 2, field_name: '프론트엔드' },
];

// ---------- 2. 인증 API (mock) ----------

// TODO(백엔드): 실제로는 POST /api/auth/signup 으로 대체
export async function signup(payload: SignupPayload): Promise<SignupResult> {
  await delay();
  return {
    user_id: 1,
    login_id: payload.login_id,
    email: payload.email,
    name: payload.name,
  };
}

// TODO(백엔드): 실제로는 POST /api/auth/login 으로 대체
export async function login(payload: LoginPayload): Promise<LoginResult> {
  await delay();
  // 목업 모드에서는 대표 데모 계정(test01)만 비밀번호를 실제로 검증함
  // (비밀번호 찾기 #16 재설정 흐름을 의미 있게 테스트할 수 있도록).
  // 그 외 아이디(예: 방금 회원가입한 계정)는 데모 편의를 위해 항상 로그인 성공 처리함
  const isMockUser = payload.login_id === MOCK_USER.login_id;
  if (isMockUser && payload.password !== getMockPassword()) {
    throw new Error('아이디 또는 비밀번호가 일치하지 않습니다');
  }
  return {
    token: 'mock-token-' + Date.now(),
    user: {
      user_id: 1,
      login_id: payload.login_id,
      email: isMockUser ? MOCK_USER.email : `${payload.login_id}@example.com`,
      name: isMockUser ? MOCK_USER.name : '테스트 사용자',
      role: 'USER',
    },
  };
}

// TODO(백엔드): 실제로는 GET /api/users/me 으로 대체
export async function getMe(): Promise<MeResult> {
  await delay();
  return {
    user_id: 1,
    login_id: 'test01',
    email: 'test01@test.com',
    name: '테스트 사용자',
    phone: '010-1234-5678',
    profile_image_url: null,
    role: 'USER',
    status: 'ACTIVE',
    created_at: new Date().toISOString(),
  };
}

// ---------- 4. 학습 설정 API (mock) ----------

// TODO(백엔드): 실제로는 GET /api/learning/fields 으로 대체
export async function getFields(): Promise<FieldItem[]> {
  await delay();
  return MOCK_FIELDS;
}

// TODO(백엔드): 실제로는 GET /api/learning/languages 으로 대체
export async function getLanguages(): Promise<LanguageItem[]> {
  await delay();
  return MOCK_LANGUAGES;
}

// TODO(백엔드): 실제로는 POST /api/learning/settings 으로 대체
export async function saveLearningSetting(payload: SaveLearningSettingPayload): Promise<null> {
  await delay();
  const lang = MOCK_LANGUAGES.find((l) => l.language_id === payload.language_id);
  const result: LearningSettingResult = {
    setting_id: 1,
    language_id: payload.language_id,
    language_name: lang?.language_name ?? '알 수 없음',
    field_name: lang?.field_name ?? '',
    difficulty: payload.difficulty,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  localStorage.setItem(LS_SETTING, JSON.stringify(result));
  return null;
}

// TODO(백엔드): 실제로는 GET /api/learning/settings/me 으로 대체
export async function getMyLearningSetting(): Promise<LearningSettingResult> {
  await delay();
  const saved = localStorage.getItem(LS_SETTING);
  if (!saved) {
    // 실제 API도 설정이 없으면 실패 응답을 준다고 가정하고 동일하게 에러를 던짐
    throw new Error('아직 학습 설정이 없습니다');
  }
  return JSON.parse(saved);
}

// ---------- 5. AI 문제 API (mock) ----------

interface MockProblemAnswerKey {
  problem_id: number;
  correct_answer: number; // 1~4
  explanation: string;
}

function getProblemSets(): Record<string, MockProblemAnswerKey[]> {
  const saved = sessionStorage.getItem(LS_PROBLEM_SETS);
  return saved ? JSON.parse(saved) : {};
}

function saveProblemSets(sets: Record<string, MockProblemAnswerKey[]>) {
  sessionStorage.setItem(LS_PROBLEM_SETS, JSON.stringify(sets));
}

// TODO(백엔드): 실제로는 POST /api/ai/problems 으로 대체 (AI가 문제를 생성하고, 정답은 서버 메모리에만 보관)
export async function generateProblems(payload: GenerateProblemsPayload): Promise<GenerateProblemsResult> {
  await delay(500);
  const lang = MOCK_LANGUAGES.find((l) => l.language_id === payload.language_id);
  const problemSetId = 'mock-set-' + Date.now();

  const problems: GeneratedProblem[] = [];
  const answerKey: MockProblemAnswerKey[] = [];

  for (let i = 1; i <= payload.count; i++) {
    problems.push({
      problem_id: i,
      topic: `${lang?.language_name ?? '언어'} 예제 주제 ${i}`,
      question: `[목업 문제 ${i}] ${lang?.language_name ?? ''} (${payload.difficulty}) 관련 4지선다 문제입니다. 실제 AI 문제로 교체될 자리입니다.`,
      choices: ['보기 1', '보기 2', '보기 3', '보기 4'],
    });
    answerKey.push({
      problem_id: i,
      correct_answer: 1, // 목업이므로 항상 1번이 정답
      explanation: '목업 데이터의 해설입니다. 실제 AI 해설로 교체될 자리입니다.',
    });
  }

  const sets = getProblemSets();
  sets[problemSetId] = answerKey;
  saveProblemSets(sets);

  return {
    problem_set_id: problemSetId,
    language_id: payload.language_id,
    language_name: lang?.language_name ?? '',
    difficulty: payload.difficulty,
    count: payload.count,
    problems,
  };
}

function calcTier(totalScore: number): { tier_name: string; detail_tier: string; min_score: number; max_score: number } {
  const tiers = [
    { name: 'B', min: 0, max: 1024 },
    { name: 'KB', min: 1024, max: 2048 },
    { name: 'MB', min: 2048, max: 4096 },
    { name: 'GB', min: 4096, max: 8192 },
    { name: 'TB', min: 8192, max: 16384 },
    { name: 'PB', min: 16384, max: 16384 * 2 },
  ];
  const current = [...tiers].reverse().find((t) => totalScore >= t.min) ?? tiers[0];
  return {
    tier_name: current.name,
    detail_tier: `1${current.name}`,
    min_score: current.min,
    max_score: current.max,
  };
}

// TODO(백엔드): 실제로는 POST /api/ai/problems/submit 으로 대체 (서버가 채점 + 점수/티어 계산)
export async function submitProblems(payload: SubmitProblemsPayload): Promise<SubmitProblemsResult> {
  await delay(400);
  const sets = getProblemSets();
  const answerKey = sets[payload.problem_set_id] ?? [];

  const setting = localStorage.getItem(LS_SETTING);
  const parsedSetting: LearningSettingResult | null = setting ? JSON.parse(setting) : null;

  let correctCount = 0;
  const feedback = payload.answers.map((a) => {
    const key = answerKey.find((k) => k.problem_id === a.problem_id);
    const isCorrect = key ? key.correct_answer === a.selected_answer : false;
    if (isCorrect) correctCount += 1;
    return {
      problem_id: a.problem_id,
      topic: `예제 주제 ${a.problem_id}`,
      question: `[목업 문제 ${a.problem_id}]`,
      choices: ['보기 1', '보기 2', '보기 3', '보기 4'],
      selected_answer: a.selected_answer,
      correct_answer: key?.correct_answer ?? 1,
      is_correct: isCorrect,
      explanation: key?.explanation ?? '',
    };
  });

  const totalCount = payload.answers.length;
  const wrongCount = totalCount - correctCount;
  const accuracyRate = totalCount > 0 ? Math.round((correctCount / totalCount) * 10000) / 100 : 0;

  // 점수 계산은 Profile 티어 산정 기준과 동일한 공식을 단순화해서 흉내만 냄
  const difficultyPoint = { EASY: 32, NORMAL: 64, HARD: 128 }[payload.answers.length > 0 ? (parsedSetting?.difficulty ?? 'EASY') : 'EASY'];
  const accuracyMultiplier = 0.5 + accuracyRate / 100;
  const problemScore = Math.floor(difficultyPoint * accuracyMultiplier * correctCount);
  const streakBonus = 64;
  const earnedScore = problemScore + streakBonus;

  const prevScore = Number(localStorage.getItem(LS_SCORE) ?? '0');
  const totalScore = prevScore + earnedScore;
  localStorage.setItem(LS_SCORE, String(totalScore));

  // 학습 기록 누적
  const sessions: StudySession[] = JSON.parse(localStorage.getItem(LS_SESSIONS) ?? '[]');
  sessions.unshift({
    session_id: sessions.length + 1,
    language_id: parsedSetting?.language_id ?? 0,
    language_name: parsedSetting?.language_name ?? '',
    field_name: parsedSetting?.field_name ?? '',
    difficulty: parsedSetting?.difficulty ?? 'EASY',
    total_count: totalCount,
    correct_count: correctCount,
    wrong_count: wrongCount,
    accuracy_rate: accuracyRate,
    studied_at: new Date().toISOString(),
  });
  localStorage.setItem(LS_SESSIONS, JSON.stringify(sessions));

  return {
    language_id: parsedSetting?.language_id ?? 0,
    language_name: parsedSetting?.language_name ?? '',
    difficulty: parsedSetting?.difficulty ?? 'EASY',
    result: {
      total_count: totalCount,
      correct_count: correctCount,
      wrong_count: wrongCount,
      accuracy_rate: accuracyRate,
      earned_score: earnedScore,
      problem_score: problemScore,
      streak_bonus: streakBonus,
      total_score: totalScore,
      streak_days: 1,
      tier: calcTier(totalScore),
    },
    feedback,
  };
}

// ---------- 6. 점수 / 티어 API (mock) ----------

// TODO(백엔드): 실제로는 GET /api/scores/me 으로 대체
export async function getMyScore(): Promise<ScoreResult> {
  await delay();
  const totalScore = Number(localStorage.getItem(LS_SCORE) ?? '0');
  const tier = calcTier(totalScore);
  const tierOrder = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const nextIndex = tierOrder.indexOf(tier.tier_name) + 1;
  const nextTierName = tierOrder[nextIndex] ?? null;

  return {
    total_score: totalScore,
    streak_days: 1,
    last_study_date: new Date().toISOString().slice(0, 10),
    tier: {
      ...tier,
      progress_percent: Math.min(
        Math.round(((totalScore - tier.min_score) / (tier.max_score - tier.min_score)) * 100),
        100
      ),
    },
    next_tier: nextTierName
      ? {
          tier_name: nextTierName,
          required_score: tier.max_score,
          remaining_score: Math.max(tier.max_score - totalScore, 0),
        }
      : null,
  };
}

// ---------- 7. 학습 기록 API (mock) ----------

// TODO(백엔드): 실제로는 GET /api/study-sessions/me 으로 대체
export async function getMyStudySessions(): Promise<StudySession[]> {
  await delay();
  return JSON.parse(localStorage.getItem(LS_SESSIONS) ?? '[]');
}

// ---------- 8. 대시보드 API (mock) ----------

// TODO(백엔드): 실제로는 GET /api/dashboard/summary 으로 대체
export async function getDashboardSummary(): Promise<DashboardSummary> {
  await delay();
  const totalScore = Number(localStorage.getItem(LS_SCORE) ?? '0');
  const tier = calcTier(totalScore);
  const setting = localStorage.getItem(LS_SETTING);
  const parsedSetting: LearningSettingResult | null = setting ? JSON.parse(setting) : null;
  const sessions: StudySession[] = JSON.parse(localStorage.getItem(LS_SESSIONS) ?? '[]');

  return {
    user: {
      user_id: 1,
      login_id: 'test01',
      email: 'test01@test.com',
      name: '테스트 사용자',
      profile_image_url: null,
    },
    score: {
      total_score: totalScore,
      streak_days: 1,
      last_study_date: new Date().toISOString().slice(0, 10),
      tier_name: tier.tier_name,
      detail_tier: `1${tier.tier_name}`,
      tier_min_score: tier.min_score,
      tier_max_score: tier.max_score,
    },
    learning_setting: parsedSetting
      ? {
          setting_id: parsedSetting.setting_id,
          language_id: parsedSetting.language_id,
          language_name: parsedSetting.language_name,
          field_name: parsedSetting.field_name,
          difficulty: parsedSetting.difficulty,
          updated_at: parsedSetting.updated_at,
        }
      : null,
    recent_sessions: sessions.slice(0, 5),
  };
}

// ---------- 9. AI 이론 생성 API (mock) ----------
//
// 백엔드 담당자에게: 실제 백엔드가 준비되면 dataSource.ts의 USE_MOCK을 false로 바꾸세요.
// 그러면 화면(TheoryStudy.tsx)은 코드 수정 없이 이 함수 대신 api.ts의 generateTheory
// (실제 POST /api/generate-theory 호출, api.ts 상단 주석에 임시 스펙이라는 점이 적혀 있음)를
// 사용하게 됩니다. 이 함수는 그때까지 화면이 동작하도록 그럴싸한 마크다운 텍스트만 만들어 돌려줍니다.
// TODO(백엔드): 실제로는 POST /api/generate-theory (경로/응답 형태 미확정) 으로 대체
export async function generateTheory(payload: GenerateTheoryPayload): Promise<GenerateTheoryResult> {
  await delay(600);
  const lang = MOCK_LANGUAGES.find((l) => l.language_id === payload.language_id);
  const languageName = lang?.language_name ?? '프로그래밍 언어';
  const difficultyLabel = API_TO_UI_DIFFICULTY[payload.difficulty];

  const content = `# ${payload.topic}

## 개요
${languageName}의 "${payload.topic}" 주제를 ${difficultyLabel} 난이도에 맞춰 학습합니다. 이 자료는 목업 데이터이며, 실제 서비스에서는 AI가 생성한 맞춤형 설명으로 교체됩니다.

## 핵심 개념
- ${languageName}에서 ${payload.topic}이(가) 사용되는 대표적인 상황
- ${difficultyLabel} 난이도 학습자가 꼭 알아야 할 핵심 포인트
- 실무나 문제 풀이에서 자주 발생하는 실수와 주의사항

## 예제 코드
\`\`\`
// ${languageName} - ${payload.topic} 예제 (목업 데이터)
// 실제 AI가 생성하면 이 자리에 언어에 맞는 예제 코드가 채워집니다.
\`\`\`

## 정리
${languageName}의 ${payload.topic}에 대해 살펴보았습니다. 다음 단계로 관련 문제를 풀어보며 개념을 확인해보세요.
`;

  return { content };
}

// ---------- 10. 아이디 / 비밀번호 찾기 API (mock) ----------

// TODO(백엔드): 실제로는 POST /api/auth/find-id 으로 대체
// TODO(백엔드): 보안상 계정 존재 여부가 유추되지 않도록,
// 실패 시에도 "이메일로 안내를 보냈습니다" 등 동일한 성공 메시지를 반환하는 방식을
// 검토해주세요 (계정 유무와 무관하게 항상 200 응답하는 패턴).
export async function findId(payload: FindIdPayload): Promise<FindIdResult> {
  await delay();
  if (payload.name !== MOCK_USER.name || payload.phone !== MOCK_USER.phone) {
    throw new Error('입력하신 정보와 일치하는 계정을 찾을 수 없습니다');
  }
  return { login_id: MOCK_USER.login_id };
}

// TODO(백엔드): 실제로는 POST /api/auth/password-reset-request 으로 대체
// TODO(백엔드): 보안상 계정 존재 여부가 유추되지 않도록,
// 실패 시에도 "이메일로 안내를 보냈습니다" 등 동일한 성공 메시지를 반환하는 방식을
// 검토해주세요 (계정 유무와 무관하게 항상 200 응답하는 패턴).
export async function requestPasswordReset(
  payload: PasswordResetRequestPayload
): Promise<PasswordResetRequestResult> {
  await delay();
  if (payload.login_id !== MOCK_USER.login_id || payload.email !== MOCK_USER.email) {
    throw new Error('입력하신 정보와 일치하는 계정을 찾을 수 없습니다');
  }
  // 실제로는 이메일로 발송되지만, 목업 환경에서는 콘솔에 링크를 출력해서
  // 개발자가 직접 눌러볼 수 있도록 함
  console.log('[MOCK] 비밀번호 재설정 링크:', `/find-password?token=mock-reset-token-${Date.now()}`);
  return { success: true };
}

// TODO(백엔드): 실제로는 POST /api/auth/password-reset 으로 대체
// 실제 서비스에서는 이메일 링크의 token으로 사용자를 식별해야 하지만,
// 목업에서는 token이 'mock-reset-token-'으로 시작하기만 하면 통과시키는 정도로 단순 검증함.
// 실제 토큰 검증(만료, 1회성 등)은 백엔드 담당.
// login_id 기반 검증은 (notice 단계의 임시 우회 버튼 등) 하위 호환을 위해 함께 남겨둠.
export async function resetPassword(payload: PasswordResetPayload): Promise<PasswordResetResult> {
  await delay();
  const hasValidToken = payload.token?.startsWith('mock-reset-token-') ?? false;
  const hasValidLoginId = payload.login_id === MOCK_USER.login_id;
  if (!hasValidToken && !hasValidLoginId) {
    throw new Error('요청 정보가 올바르지 않습니다');
  }
  setMockPassword(payload.new_password);
  return { success: true };
}

// 목업 데이터를 전부 초기화하고 싶을 때 브라우저 콘솔에서 window.__resetMock() 호출
if (typeof window !== 'undefined') {
  (window as any).__resetMock = () => {
    localStorage.removeItem(LS_SETTING);
    localStorage.removeItem(LS_SESSIONS);
    localStorage.removeItem(LS_SCORE);
    localStorage.removeItem(LS_PASSWORD);
    sessionStorage.removeItem(LS_PROBLEM_SETS);
    console.log('목업 데이터를 초기화했습니다. 새로고침 해주세요.');
  };
}
