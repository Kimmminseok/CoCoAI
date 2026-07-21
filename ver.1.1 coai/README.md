
  # CoCoAI 학습 사이트 구축

  This is a code bundle for CoCoAI 학습 사이트 구축. The original project is available at https://www.figma.com/design/n6sRa7oiBZiOto8lbLC9fO/CoCoAI-%ED%95%99%EC%8A%B5-%EC%82%AC%EC%9D%B4%ED%8A%B8-%EA%B5%AC%EC%B6%95.

  ## Running the code

  Open terminal in this folder (the one that contains package.json):
  - ver.1.1 coai/ver.1.1 coai

  PowerShell users can run npm.cmd directly:
  - npm.cmd i
  - npm.cmd run dev

  If you are currently one level above, move first:
  - cd .\ver.1.1 coai

  ## 백엔드 연동 안내 (백엔드 담당자용)

  지금은 백엔드 서버 없이도 프론트가 단독으로 동작하도록 **목업(mock) 데이터**로 구성되어 있습니다.

  ### 연동 방법
  1. `src/app/lib/dataSource.ts` 파일을 엽니다.
  2. `const USE_MOCK = true;` 를 `false`로 바꿉니다.
  3. `src/app/lib/api.ts`의 `BASE_URL`을 실제 서버 주소로 바꿉니다. (기본값 `http://localhost:5001`)
  4. 끝입니다. 페이지 컴포넌트들은 전부 `dataSource.ts`에서 함수를 가져다 쓰고 있어서, 이 두 곳만 바꾸면 실제 API 호출로 전환됩니다.

  ### 파일 구조
  - `src/app/lib/api.ts` — 실제 백엔드 API 명세서 기준으로 작성된 fetch 클라이언트 (요청/응답 타입 전부 정의되어 있음)
  - `src/app/lib/mock.ts` — `api.ts`와 동일한 함수 이름/타입을 가진 가짜 구현체 (localStorage에 데이터를 저장해서 새로고침해도 유지됨)
  - `src/app/lib/dataSource.ts` — 위 둘 중 무엇을 쓸지 정하는 스위치 파일
  - `src/app/lib/constants.ts` — 난이도(한글 ↔ ENUM), 티어 이름/색상/아이콘 매핑

  ### 각 페이지의 연동 지점
  코드 안에 `#01`~`#10` 형태로 번호가 달린 주석이 연동 지점입니다. 예: `Login.tsx`의 `// #01 LOGIN - POST /api/auth/login`

  | 번호 | 위치 | 필요한 API |
  |---|---|---|
  | #01 | `pages/Login.tsx` | `POST /api/auth/login` |
  | #02 | `pages/Login.tsx` | `POST /api/auth/signup` |
  | #03~05 | `pages/Login.tsx` | 네이버/카카오/구글 SNS 로그인 (명세서에 없음, 미구현 상태로 둠) |
  | #04 | `contexts/ProfileContext.tsx` | `GET /api/learning/languages` |
  | #06 | `contexts/ProfileContext.tsx` | `GET /api/learning/settings/me` |
  | #07 | `contexts/ProfileContext.tsx` | `POST /api/learning/settings` |
  | #08 | `pages/Dashboard.tsx` | `GET /api/dashboard/summary` |
  | #08 | `pages/Profile.tsx` | `GET /api/scores/me`, `GET /api/study-sessions/me` |
  | #09 | `pages/TheoryStudy.tsx` | AI 이론 생성 API (명세서에 없음, `api.ts`의 `generateTheory` 참고 - 엔드포인트/응답 형태 확정 필요) |
  | #10 | `pages/ProblemSolving.tsx` | `POST /api/ai/problems`, `POST /api/ai/problems/submit` |

  ### 목업 데이터 초기화
  브라우저 콘솔에서 `__resetMock()`을 실행하면 저장된 목업 학습설정/점수/기록이 전부 초기화됩니다.
  