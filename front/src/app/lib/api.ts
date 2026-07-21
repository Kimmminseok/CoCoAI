const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://13.125.217.236:5001';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

const TOKEN_KEY = 'cocoai_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean } = {}
): Promise<T> {
  const { method = 'GET', body, auth = true } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (auth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json: ApiResponse<T> = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.message || '요청에 실패했습니다');
  }

  return json.data;
}

// ---------- 2. 인증 API ----------

export interface SignupPayload {
  login_id: string;
  email: string;
  password: string;
  name: string;
  phone: string;
}

export interface SignupResult {
  user_id: number;
  login_id: string;
  email: string;
  name: string;
}

export function signup(payload: SignupPayload) {
  return request<SignupResult>('/api/auth/signup', { method: 'POST', body: payload, auth: false });
}

export interface LoginPayload {
  login_id: string;
  password: string;
}

export interface LoginResult {
  token: string;
  user: {
    user_id: number;
    login_id: string;
    email: string;
    name: string;
    role: string;
  };
}

export function login(payload: LoginPayload) {
  return request<LoginResult>('/api/auth/login', { method: 'POST', body: payload, auth: false });
}

// ---------- 3. 사용자 API ----------

export interface MeResult {
  user_id: number;
  login_id: string;
  email: string;
  name: string;
  phone: string;
  profile_image_url: string | null;
  role: string;
  status: string;
  created_at: string;
}

export function getMe() {
  return request<MeResult>('/api/users/me');
}

// ---------- 4. 학습 설정 API ----------

export interface FieldItem {
  field_id: number;
  field_name: string;
}

export function getFields() {
  return request<FieldItem[]>('/api/learning/fields', { auth: false });
}

export interface LanguageItem {
  language_id: number;
  language_name: string;
  field_id: number;
  field_name: string;
}

export function getLanguages() {
  return request<LanguageItem[]>('/api/learning/languages', { auth: false });
}

export type ApiDifficulty = 'EASY' | 'NORMAL' | 'HARD';

export interface SaveLearningSettingPayload {
  language_id: number;
  difficulty: ApiDifficulty;
}

export function saveLearningSetting(payload: SaveLearningSettingPayload) {
  return request<null>('/api/learning/settings', { method: 'POST', body: payload });
}

export interface LearningSettingResult {
  setting_id: number;
  language_id: number;
  language_name: string;
  field_name: string;
  difficulty: ApiDifficulty;
  created_at: string;
  updated_at: string;
}

export function getMyLearningSetting() {
  return request<LearningSettingResult>('/api/learning/settings/me');
}

// ---------- 5. AI 문제 API ----------

export interface GenerateProblemsPayload {
  language_id: number;
  difficulty: ApiDifficulty;
  count: number;
}

export interface GeneratedProblem {
  problem_id: number;
  topic: string;
  question: string;
  choices: string[];
}

export interface GenerateProblemsResult {
  problem_set_id: string;
  language_id: number;
  language_name: string;
  difficulty: ApiDifficulty;
  count: number;
  problems: GeneratedProblem[];
}

export function generateProblems(payload: GenerateProblemsPayload) {
  return request<GenerateProblemsResult>('/api/ai/problems', { method: 'POST', body: payload });
}

export interface SubmitAnswer {
  problem_id: number;
  selected_answer: 1 | 2 | 3 | 4;
}

export interface SubmitProblemsPayload {
  problem_set_id: string;
  answers: SubmitAnswer[];
}

export interface TierInfo {
  tier_name: string;
  detail_tier: string;
  min_score: number;
  max_score: number;
}

export interface SubmitProblemsResult {
  language_id: number;
  language_name: string;
  difficulty: ApiDifficulty;
  result: {
    total_count: number;
    correct_count: number;
    wrong_count: number;
    accuracy_rate: number;
    earned_score: number;
    problem_score: number;
    streak_bonus: number;
    total_score: number;
    streak_days: number;
    tier: TierInfo;
  };
  feedback: Array<{
    problem_id: number;
    topic: string;
    question: string;
    choices: string[];
    selected_answer: number;
    correct_answer: number;
    is_correct: boolean;
    explanation: string;
  }>;
}

export function submitProblems(payload: SubmitProblemsPayload) {
  return request<SubmitProblemsResult>('/api/ai/problems/submit', { method: 'POST', body: payload });
}

// ---------- 6. 점수 / 티어 API ----------

export interface ScoreResult {
  total_score: number;
  streak_days: number;
  last_study_date: string | null;
  tier: TierInfo & { progress_percent: number };
  next_tier: {
    tier_name: string;
    required_score: number;
    remaining_score: number;
  } | null;
}

export function getMyScore() {
  return request<ScoreResult>('/api/scores/me');
}

// ---------- 7. 학습 기록 API ----------

export interface StudySession {
  session_id: number;
  language_id: number;
  language_name: string;
  field_name: string;
  difficulty: ApiDifficulty;
  total_count: number;
  correct_count: number;
  wrong_count: number;
  accuracy_rate: number;
  studied_at: string;
}

export function getMyStudySessions() {
  return request<StudySession[]>('/api/study-sessions/me');
}

// ---------- 8. 대시보드 API ----------

export interface DashboardSummary {
  user: {
    user_id: number;
    login_id: string;
    email: string;
    name: string;
    profile_image_url: string | null;
  };
  score: {
    total_score: number;
    streak_days: number;
    last_study_date: string | null;
    tier_name: string;
    detail_tier: string;
    tier_min_score: number;
    tier_max_score: number;
  };
  learning_setting: {
    setting_id: number;
    language_id: number;
    language_name: string;
    field_name: string;
    difficulty: ApiDifficulty;
    updated_at: string;
  } | null;
  recent_sessions: StudySession[];
}

export function getDashboardSummary() {
  return request<DashboardSummary>('/api/dashboard/summary');
}


export interface GenerateTheoryPayload {
  language_id: number;
  difficulty: ApiDifficulty;
  topic: string;
}

export interface GenerateTheoryResult {
  content: string; // 마크다운 형식의 이론 학습 콘텐츠
}

export function generateTheory(payload: GenerateTheoryPayload) {
  return request<GenerateTheoryResult>('/api/ai/theory', { method: 'POST', body: payload });
}

// ---------- 10. 아이디 / 비밀번호 찾기 API ----------
//
// ⚠️ 백엔드 담당자에게: 이 API들은 API 명세서_김민석.md 에 정의되어 있지 않습니다.
// 아래 엔드포인트 경로와 요청/응답 타입은 FindId.tsx / FindPassword.tsx 화면을
// 프론트 단독으로 동작시키기 위해 프론트에서 "임시로 추측"해서 만든 것이며,
// 실제 백엔드 스펙과 다를 수 있습니다.
// TODO(백엔드): 실제 엔드포인트 및 검증 로직 확정 필요

// #14 FIND-ID - POST /api/auth/find-id (임시 경로) - FindId.tsx의 #14 주석과 짝
export interface FindIdPayload {
  name: string;
  phone: string;
}

export interface FindIdResult {
  login_id: string;
}

export function findId(payload: FindIdPayload) {
  return request<FindIdResult>('/api/auth/find-id', { method: 'POST', body: payload, auth: false });
}

// #15 PASSWORD-RESET-REQUEST - POST /api/auth/password-reset-request (임시 경로) - FindPassword.tsx의 #15 주석과 짝
export interface PasswordResetRequestPayload {
  login_id: string;
  email: string;
}

// 백엔드 담당자에게:
// 이 API가 성공하면 백엔드는 (1) 재설정 토큰을 생성/저장하고
// (2) 사용자 이메일로 /find-password?token=xxx 형태의 링크를 발송해야 합니다.
// 토큰의 만료 시간, 1회성 여부 등은 백엔드에서 결정 후 공유 부탁드립니다.
export interface PasswordResetRequestResult {
  success: boolean;
}

export function requestPasswordReset(payload: PasswordResetRequestPayload) {
  return request<PasswordResetRequestResult>('/api/auth/password-reset-request', {
    method: 'POST',
    body: payload,
    auth: false,
  });
}

// #16 PASSWORD-RESET - POST /api/auth/password-reset (임시 경로)
//
// 백엔드 담당자에게:
// 실제 서비스에서는 이메일 링크에 담긴 token으로 사용자를 식별해야 합니다.
// 아래 token 필드가 그 값입니다 (쿼리 파라미터 ?token=xxx 로 프론트에 전달받음).
// login_id 필드는 목업 호환을 위해 임시로 남겨둔 것이며,
// 실제 API 명세가 확정되면 제거하거나 token 검증 로직으로 완전히 대체해주세요.
//
// TODO(백엔드): 아래 요청/응답 형태, 특히 token 관련 필드명/검증 방식 확정 필요
export interface PasswordResetPayload {
  token: string; // TODO(백엔드): 이메일 링크의 재설정 토큰. 필드명 확정 필요 (reset_token 등일 수도 있음)
  login_id?: string; // TODO(백엔드): 목업 호환용 임시 필드. 실제 스펙 확정 시 제거 검토
  new_password: string;
}

export interface PasswordResetResult {
  success: boolean;
}

export function resetPassword(payload: PasswordResetPayload) {
  return request<PasswordResetResult>('/api/auth/password-reset', { method: 'POST', body: payload, auth: false });
}
