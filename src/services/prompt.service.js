const QUESTION_FORMAT = {
  type: "multiple_choice",
  choiceCount: 4,
  answerCount: 1,
  includeExplanation: true,
  language: "ko",

  rules: [
    "반드시 4지선다 문제로 작성한다.",
    "정답은 반드시 1개만 존재해야 한다.",
    "오답 선택지도 그럴듯하게 작성한다.",
    "문제는 선택한 언어와 난이도 범위 안에서만 출제한다.",
    "코드를 직접 작성하게 하는 주관식 문제는 만들지 않는다.",
    "정답과 해설을 반드시 포함한다.",
    "해설은 초보자가 이해할 수 있게 작성한다.",
    "문제와 보기는 한국어로 작성한다.",
    "이전 문제와 최대한 다른 주제로 출제한다."
  ]
};

const QUESTION_SCOPE = {
  C: {
    EASY: [
      "printf",
      "scanf 기본",
      "변수",
      "자료형",
      "산술 연산자",
      "비교 연산자",
      "if문 기본"
    ],
    NORMAL: [
      "if-else",
      "switch",
      "for문",
      "while문",
      "배열 기본",
      "함수 기본"
    ],
    HARD: [
      "배열과 반복문 조합",
      "함수 호출 흐름",
      "문자열 char 배열",
      "지역변수와 전역변수",
      "포인터 기본 개념"
    ]
  },

  Java: {
    EASY: [
      "System.out.println",
      "변수",
      "자료형",
      "산술 연산자",
      "비교 연산자",
      "논리 연산자",
      "if문 기본"
    ],
    NORMAL: [
      "if-else",
      "switch",
      "for문",
      "while문",
      "배열",
      "메서드 기본",
      "String 기본"
    ],
    HARD: [
      "클래스와 객체",
      "생성자",
      "접근제어자 public/private",
      "static 기본",
      "상속 기본",
      "try-catch 기본"
    ]
  },

  Python: {
    EASY: [
      "print",
      "변수",
      "자료형 int, float, str, bool",
      "input 기본",
      "산술 연산자",
      "비교 연산자",
      "if문 기본"
    ],
    NORMAL: [
      "if-elif-else",
      "for문",
      "while문",
      "리스트",
      "문자열 인덱싱",
      "함수 정의 def"
    ],
    HARD: [
      "리스트와 반복문 조합",
      "딕셔너리 기본",
      "슬라이싱",
      "함수 반환값",
      "지역변수와 전역변수",
      "try-except 기본"
    ]
  },

  HTML: {
    EASY: [
      "html",
      "head",
      "body",
      "title",
      "h1~h6",
      "p",
      "a",
      "img"
    ],
    NORMAL: [
      "ul",
      "ol",
      "li",
      "table",
      "tr",
      "th",
      "td",
      "form",
      "input",
      "button",
      "div",
      "span"
    ],
    HARD: [
      "header",
      "nav",
      "main",
      "section",
      "article",
      "footer",
      "label과 input 연결",
      "alt 속성",
      "form action/method",
      "올바른 태그 중첩"
    ]
  },

  CSS: {
    EASY: [
      "기본 선택자",
      "color",
      "background-color",
      "font-size",
      "text-align",
      "CSS 작성 형식"
    ],
    NORMAL: [
      "class 선택자",
      "id 선택자",
      "margin",
      "padding",
      "border",
      "width",
      "height",
      "display"
    ],
    HARD: [
      "flex 기본",
      "justify-content",
      "align-items",
      "position",
      "z-index 기본",
      "선택자 우선순위",
      "media query 기본"
    ]
  },

  JavaScript: {
    EASY: [
      "console.log",
      "변수 let, const",
      "자료형",
      "산술 연산자",
      "비교 연산자",
      "if문 기본",
      "함수 기본"
    ],
    NORMAL: [
      "if-else",
      "for문",
      "while문",
      "배열",
      "객체",
      "함수 선언식",
      "함수 표현식"
    ],
    HARD: [
      "배열 메서드 기본",
      "객체와 배열 조합",
      "DOM 선택자",
      "이벤트 처리 기본",
      "스코프 기본",
      "호이스팅 기본"
    ]
  }
};

function buildProblemPrompt(language, difficulty, count) {
  const scope = QUESTION_SCOPE[language]?.[difficulty];

  if (!scope) {
    throw new Error("지원하지 않는 언어 또는 난이도입니다.");
  }

  return `
너는 코딩 학습 웹사이트 CoCoAI의 문제 생성 AI이다.

아래 학습 설정에 맞는 코딩 학습용 4지선다 문제를 생성해라.

[학습 설정]
- 언어: ${language}
- 난이도: ${difficulty}
- 문제 수: ${count}개

[출제 범위]
${scope.map((item) => `- ${item}`).join("\n")}

[문제 양식]
- 문제 유형: ${QUESTION_FORMAT.type}
- 보기 개수: ${QUESTION_FORMAT.choiceCount}개
- 정답 개수: ${QUESTION_FORMAT.answerCount}개
- 해설 포함 여부: ${QUESTION_FORMAT.includeExplanation ? "포함" : "미포함"}
- 출력 언어: 한국어

[문제 생성 규칙]
${QUESTION_FORMAT.rules.map((rule) => `- ${rule}`).join("\n")}

[추가 규칙]
- 총 ${count}개의 문제를 생성한다.
- 각 문제의 주제는 최대한 겹치지 않게 한다.
- 문제는 선택한 난이도와 출제 범위에서 벗어나면 안 된다.
- 너무 긴 코드는 사용하지 않는다.
- 정답은 1, 2, 3, 4 중 하나여야 한다.
- answer에는 정답 번호만 숫자로 작성한다.
- explanation에는 정답에 대한 해설만 작성한다.
- JSON 밖에는 어떤 문장도 출력하지 않는다.
- 마크다운 코드블록을 사용하지 않는다.

[출력 형식]
반드시 아래 JSON 형식으로만 작성해라.

{
  "problems": [
    {
      "topic": "문제 주제",
      "question": "문제 내용",
      "choices": [
        "보기 1",
        "보기 2",
        "보기 3",
        "보기 4"
      ],
      "answer": 1,
      "explanation": "정답 해설"
    }
  ]
}
`;
}

module.exports = {
  buildProblemPrompt,
};