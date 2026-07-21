// API 명세서(김민석) 기준 공통 API 클라이언트
// Base URL: http://localhost:5001

const BASE_URL = 'http://localhost:5001';

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
