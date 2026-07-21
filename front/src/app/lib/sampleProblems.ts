import type { UiDifficulty } from './constants';

// 랜딩 페이지 체험용 예시 문제 - 백엔드 연동 없이 프론트에만 존재하는 하드코딩 데이터
export interface SampleProblem {
  question: string;
  choices: [string, string, string, string];
  answerIndex: number; // 0-based
  explanation: string;
}

// 난이도별 5문제씩 총 15문제 (C 언어 고정)
export const SAMPLE_PROBLEM_POOL: Record<UiDifficulty, SampleProblem[]> = {
  // 쉬움: 변수 선언/기본 자료형, 사칙연산, printf/scanf 기본 사용법
  초급: [
    {
      question: 'C 언어에서 정수형 변수를 선언하는 올바른 코드는 무엇인가요?',
      choices: ['int num;', 'integer num;', 'num int;', 'var num;'],
      answerIndex: 0,
      explanation: 'C 언어에서 정수형 변수는 int 키워드로 선언합니다.',
    },
    {
      question: '다음 코드의 실행 결과는?\n\nint a = 7, b = 2;\nprintf("%d", a / b);',
      choices: ['3', '3.5', '1', '0'],
      answerIndex: 0,
      explanation: '정수형 나눗셈에서는 소수점 이하가 버려지므로 7 / 2 는 3입니다.',
    },
    {
      question: '정수형 변수 num에 값을 입력받는 scanf 사용법으로 올바른 것은?',
      choices: ['scanf("%d", &num);', 'scanf("%d", num);', 'scanf(num, "%d");', 'scanf("%d" num);'],
      answerIndex: 0,
      explanation: 'scanf는 값을 저장할 변수의 주소를 전달해야 하므로 & 연산자를 사용합니다.',
    },
    {
      question: 'int a = 5, b = 3; 일 때 a % b 의 값은?',
      choices: ['2', '1', '0', '5'],
      answerIndex: 0,
      explanation: '% 연산자는 나머지를 구합니다. 5를 3으로 나눈 나머지는 2입니다.',
    },
    {
      question: '다음 중 실수(부동소수점)를 담을 수 없는 자료형은?',
      choices: ['float', 'double', 'int', 'long double'],
      answerIndex: 2,
      explanation: 'int는 정수형 자료형이고, float/double/long double은 실수형 자료형입니다.',
    },
  ],
  // 중간: 조건문/반복문, 1차원 배열, 함수 정의와 호출, 문자열 기초
  중급: [
    {
      question: '1부터 5까지 정수를 순서대로 출력하는 반복문으로 올바른 것은?',
      choices: [
        'for (int i = 1; i <= 5; i++) printf("%d", i);',
        'for (int i = 1; i < 5; i++) printf("%d", i);',
        'for (int i = 0; i < 5; i++) printf("%d", i);',
        'for (int i = 1; i <= 5; i--) printf("%d", i);',
      ],
      answerIndex: 0,
      explanation: '1부터 5까지 출력하려면 i를 1부터 시작해 5 이하일 때까지 1씩 증가시켜야 합니다.',
    },
    {
      question: 'int arr[5] = {1, 2, 3, 4, 5}; 일 때 arr[2]의 값은?',
      choices: ['1', '2', '3', '4'],
      answerIndex: 2,
      explanation: '배열의 인덱스는 0부터 시작하므로 arr[2]는 세 번째 원소인 3입니다.',
    },
    {
      question: '다음 함수 정의에서 빈칸에 들어갈 반환 자료형으로 알맞은 것은?\n\n___ add(int a, int b) {\n    return a + b;\n}',
      choices: ['int', 'void', 'return', 'func'],
      answerIndex: 0,
      explanation: '두 정수의 합을 반환하는 함수이므로 반환형은 int여야 합니다.',
    },
    {
      question: '문자열 "Hello"를 저장하기 위한 선언으로 알맞은 것은?',
      choices: ['char str[] = "Hello";', 'char str = "Hello";', 'int str[] = "Hello";', 'string str = "Hello";'],
      answerIndex: 0,
      explanation: 'C에는 별도의 string 타입이 없어 문자열은 char 배열로 표현하고 큰따옴표로 초기화할 수 있습니다.',
    },
    {
      question: 'if (x % 2 == 0) 조건이 참이 되는 경우는?',
      choices: ['x가 짝수일 때', 'x가 홀수일 때', 'x가 0일 때만', 'x가 음수일 때'],
      answerIndex: 0,
      explanation: 'x % 2 == 0 은 x를 2로 나눈 나머지가 0, 즉 x가 짝수임을 의미합니다.',
    },
  ],
  // 어려움: 포인터, 구조체, 동적 메모리 할당(malloc/free), 재귀 함수
  고급: [
    {
      question: '정수형 포인터 변수를 선언하는 올바른 방법은?',
      choices: ['int *p;', 'int p*;', 'pointer int p;', 'int p&;'],
      answerIndex: 0,
      explanation: '포인터 변수는 자료형 뒤에 * 를 붙여 선언합니다.',
    },
    {
      question: 'int a = 10; int *p = &a; 일 때 *p의 값은?',
      choices: ['10', 'a의 주소값', '알 수 없음', '0'],
      answerIndex: 0,
      explanation: '*p는 포인터 p가 가리키는 변수 a의 값, 즉 10을 의미합니다(역참조).',
    },
    {
      question: 'C 언어에서 구조체를 정의할 때 사용하는 키워드는?',
      choices: ['struct', 'class', 'typedef', 'enum'],
      answerIndex: 0,
      explanation: 'C 언어의 구조체는 struct 키워드로 정의합니다.',
    },
    {
      question: 'malloc()으로 동적 할당한 메모리를 해제할 때 사용하는 함수는?',
      choices: ['free()', 'delete()', 'release()', 'clear()'],
      answerIndex: 0,
      explanation: 'malloc으로 할당한 메모리는 free() 함수로 해제해야 메모리 누수를 방지할 수 있습니다.',
    },
    {
      question: '다음 재귀 함수 factorial(3)의 반환값은?\n\nint factorial(int n) {\n    if (n <= 1) return 1;\n    return n * factorial(n - 1);\n}',
      choices: ['6', '3', '9', '1'],
      answerIndex: 0,
      explanation: 'factorial(3) = 3 * factorial(2) = 3 * 2 * factorial(1) = 3 * 2 * 1 = 6 입니다.',
    },
  ],
};

export interface DifficultyTaggedProblem extends SampleProblem {
  difficulty: UiDifficulty;
}

export const TRY_WIDGET_DIFFICULTY_ORDER: UiDifficulty[] = ['초급', '중급', '고급'];

// 마운트 시마다 난이도별 문제 풀에서 1개씩 랜덤으로 뽑아 쉬움→중간→어려움 순서로 반환
export function pickRandomTryProblems(): DifficultyTaggedProblem[] {
  return TRY_WIDGET_DIFFICULTY_ORDER.map((difficulty) => {
    const pool = SAMPLE_PROBLEM_POOL[difficulty];
    const problem = pool[Math.floor(Math.random() * pool.length)];
    return { ...problem, difficulty };
  });
}
