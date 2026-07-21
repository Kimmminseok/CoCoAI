// ============================================================
// 백엔드 담당자에게: 이 파일 하나로 목업 ↔ 실제 API를 전환합니다.
// 백엔드 서버 준비되면 아래 USE_MOCK 값만 false로 바꾸세요.
// 각 페이지 컴포넌트는 이 파일에서 함수를 가져다 쓰므로 다른 코드는
// 건드릴 필요가 없습니다.
// ============================================================

import * as mockApi from './mock';
import * as realApi from './api';

const USE_MOCK = false; // ← 백엔드 연동 준비되면 false로 변경

const source = USE_MOCK ? mockApi : realApi;

// 인증
export const login = source.login;
export const signup = source.signup;
export const getMe = source.getMe;

// 아이디 / 비밀번호 찾기 (#14~#16 - 명세서에 없는 임시 API, api.ts 상단 주석 참고)
export const findId = source.findId;
export const requestPasswordReset = source.requestPasswordReset;
export const resetPassword = source.resetPassword;

// 목업 전용: 현재 저장된 비밀번호 조회/갱신. find-password 재설정 흐름과
// AccountSettings.tsx(개인정보 수정 잠금 해제, 비밀번호 변경)가 동일한 값을
// 기준으로 검증하도록 mock.ts의 구현을 그대로 재노출함 (실제 API 전환 시에는
// 백엔드의 verify-password / PATCH 비밀번호 엔드포인트가 이 역할을 대신함).
export const getMockPassword = mockApi.getMockPassword;
export const setMockPassword = mockApi.setMockPassword;

// 학습 설정
export const getFields = source.getFields;
export const getLanguages = source.getLanguages;
export const saveLearningSetting = source.saveLearningSetting;
export const getMyLearningSetting = source.getMyLearningSetting;

// AI 문제
export const generateProblems = source.generateProblems;
export const submitProblems = source.submitProblems;

// AI 이론 생성 (#09 GENERATE-THEORY - 명세서에 없는 임시 API, api.ts의 generateTheory 주석 참고)
export const generateTheory = source.generateTheory;

// 점수/티어
export const getMyScore = source.getMyScore;

// 학습 기록
export const getMyStudySessions = source.getMyStudySessions;

// 대시보드
export const getDashboardSummary = source.getDashboardSummary;

// 토큰 관리는 네트워크 호출이 아니라서 목업/실제 구분 없이 항상 동일한 걸 씀
export { getToken, setToken, clearToken } from './api';

// 타입들도 여기서 한 번에 재수출 (페이지에서 import 경로를 하나로 통일하기 위함)
export type {
  ApiResponse,
  SignupPayload,
  SignupResult,
  LoginPayload,
  LoginResult,
  MeResult,
  FieldItem,
  LanguageItem,
  ApiDifficulty,
  SaveLearningSettingPayload,
  LearningSettingResult,
  GenerateProblemsPayload,
  GeneratedProblem,
  GenerateProblemsResult,
  SubmitAnswer,
  SubmitProblemsPayload,
  TierInfo,
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
