import type { ApiDifficulty } from './api';

// 화면에는 한글로 보여주되, API로 보낼 때는 백엔드 ENUM(EASY/NORMAL/HARD)으로 변환
export type UiDifficulty = '초급' | '중급' | '고급';

export const UI_TO_API_DIFFICULTY: Record<UiDifficulty, ApiDifficulty> = {
  '초급': 'EASY',
  '중급': 'NORMAL',
  '고급': 'HARD',
};

export const API_TO_UI_DIFFICULTY: Record<ApiDifficulty, UiDifficulty> = {
  EASY: '초급',
  NORMAL: '중급',
  HARD: '고급',
};

export const DIFFICULTY_ICON: Record<UiDifficulty, string> = {
  '초급': '🌱',
  '중급': '🌿',
  '고급': '🌳',
};

export const DIFFICULTY_COLOR: Record<UiDifficulty, string> = {
  '초급': 'bg-green-100 text-green-700 border-green-300',
  '중급': 'bg-orange-100 text-orange-700 border-orange-300',
  '고급': 'bg-red-100 text-red-700 border-red-300',
};

// API로 언어 목록을 받아오기 때문에 언어별 고정 색상 매핑이 불가능해짐
// 대신 순서대로 돌아가며 쓰는 색상 팔레트로 아이콘 배지 색을 정함
export const LANGUAGE_COLOR_PALETTE = [
  'bg-blue-500',
  'bg-yellow-500',
  'bg-red-500',
  'bg-orange-500',
  'bg-cyan-500',
  'bg-purple-500',
  'bg-green-500',
  'bg-pink-500',
  'bg-indigo-500',
];

// 티어 이름(B, KB, MB, GB, TB, PB)에 대한 프론트 전용 부가 정보
// 백엔드는 tier_name / min_score / max_score만 내려주므로, 아이콘/설명/팁은 프론트에서 매핑
export const TIER_META: Record<string, { fullName: string; icon: string; color: string; description: string; tips: string[] }> = {
  B: {
    fullName: 'Byte',
    icon: '📦',
    color: 'from-gray-400 to-gray-500',
    description: '프로그래밍 학습을 시작하는 단계',
    tips: ['매일 학습하여 연속 학습일을 쌓으세요', '기초 문제부터 차근차근 풀어보세요'],
  },
  KB: {
    fullName: 'Kilobyte',
    icon: '📁',
    color: 'from-green-400 to-green-500',
    description: '기초를 다지는 초보 학습자',
    tips: ['정답률을 높여 점수를 효율적으로 올리세요', '다양한 난이도의 문제를 풀어보세요'],
  },
  MB: {
    fullName: 'Megabyte',
    icon: '💾',
    color: 'from-blue-400 to-blue-500',
    description: '실력이 향상되는 중급 학습자',
    tips: ['보통 난이도 문제에 집중하세요', '연속 학습일이 점수에 큰 영향을 줍니다'],
  },
  GB: {
    fullName: 'Gigabyte',
    icon: '💿',
    color: 'from-purple-400 to-purple-500',
    description: '실력이 검증된 상급 학습자',
    tips: ['어려운 문제에 도전하세요', '높은 정답률 유지가 중요합니다'],
  },
  TB: {
    fullName: 'Terabyte',
    icon: '🗄️',
    color: 'from-orange-400 to-orange-500',
    description: '전문가 수준의 고급 학습자',
    tips: ['복잡한 문제 해결 능력을 키우세요', '장기간 연속 학습으로 보너스 점수를 받으세요'],
  },
  PB: {
    fullName: 'Petabyte',
    icon: '🏆',
    color: 'from-red-400 to-red-500',
    description: '최고 수준의 마스터 학습자',
    tips: ['완벽한 학습 습관을 유지하세요', '다른 학습자들에게 모범이 되는 수준입니다'],
  },
};

export function getTierMeta(tierName: string) {
  return TIER_META[tierName] ?? TIER_META['B'];
}

// 티어 순서 및 임계값 (API 명세서의 예시 값과 일치: B 0 / KB 1024 / MB 2048 / GB 4096 / TB 8192 / PB 16384)
// 백엔드가 "모든 티어 목록"을 내려주는 API는 없어서, 전체 티어 그리드 표시용으로만 사용
export const TIER_ORDER: Array<{ shortName: string; threshold: number }> = [
  { shortName: 'B', threshold: 0 },
  { shortName: 'KB', threshold: 1024 },
  { shortName: 'MB', threshold: 2048 },
  { shortName: 'GB', threshold: 4096 },
  { shortName: 'TB', threshold: 8192 },
  { shortName: 'PB', threshold: 16384 },
];
