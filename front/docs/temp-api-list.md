명세서 제외 추가 필요 API

1. AI 이론 생성

Method / URL: POST /api/generate-theory
사용 위치: TheoryStudy.tsx (api.ts의 generateTheory 함수)
요청: language_id, difficulty, topic
응답: content (마크다운 형식의 이론 학습 콘텐츠)
비고: 실제 엔드포인트, 요청/응답 필드명 확정 후 교체 필요

2. 아이디 찾기

Method / URL: POST /api/auth/find-id
사용 위치: FindId.tsx
요청: name, phone
응답: login_id

3. 비밀번호 재설정 요청 (이메일 발송)

Method / URL: POST /api/auth/password-reset-request
사용 위치: FindPassword.tsx
요청: login_id, email
응답: success
비고: 백엔드는 성공 시 재설정 토큰을 생성/저장하고, 사용자 이메일로 /find-password?token=xxx 형태의 링크를 발송해야 함

4. 비밀번호 재설정 토큰 유효성 검증

Method / URL: GET /api/auth/password-reset/verify?token=xxx
사용 위치: FindPassword.tsx (URL의 token 파라미터로 진입 시)
응답: valid (true/false) 또는 에러
비고: 사용자가 새 비밀번호를 입력하기 전에, 이메일 링크의 토큰이 아직 유효한지(만료/이미 사용됨 여부) 먼저 확인하기 위해 필요. 토큰 기반 흐름으로 개선하면서 새로 필요해진 API

5. 비밀번호 재설정

Method / URL: POST /api/auth/password-reset
사용 위치: FindPassword.tsx
요청: token, new_password (login_id는 목업 호환용으로 임시 유지 중)
응답: success
비고: 이메일 링크의 토큰으로 사용자를 식별하는 방식으로 변경됨. token 필드명, 만료 시간, 1회성 여부는 백엔드에서 확정 필요

6. 현재 비밀번호 확인

Method / URL: POST /api/users/me/verify-password
사용 위치: AccountSettings.tsx (개인정보 수정/비밀번호 변경 전 잠금 해제)
요청: password
응답: success

7. 비밀번호 변경

Method / URL: PATCH /api/users/me/password
사용 위치: AccountSettings.tsx
요청: current_password, new_password
응답: success

8. 개인정보 수정

Method / URL: PATCH /api/users/me
사용 위치: AccountSettings.tsx
요청: email, phone 등 수정 가능한 필드
응답: 수정된 사용자 정보

9. SNS 로그인 - 네이버

Method / URL: POST /api/auth/social/naver
사용 위치: Login.tsx
요청: 인가 코드(code)
응답: token, user 정보
비고: 현재 버튼만 있고 연동 대기 상태

10. SNS 로그인 - 카카오

Method / URL: POST /api/auth/social/kakao
사용 위치: Login.tsx
요청: 인가 코드(code)
응답: token, user 정보
비고: 현재 버튼만 있고 연동 대기 상태

11. SNS 로그인 - 구글

Method / URL: POST /api/auth/social/google
사용 위치: Login.tsx
요청: 인가 코드(code)
응답: token, user 정보
비고: 현재 버튼만 있고 연동 대기 상태