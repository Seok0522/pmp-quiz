# PMP 시험 학습 웹 애플리케이션 TRD (Technical Requirements Document)

## 1. 시스템 아키텍처

본 애플리케이션은 별도의 백엔드 서버 없이, 모든 로직이 클라이언트 측(브라우저)에서 실행되는 **정적 웹 페이지(Static Web Page)** 형태로 구축합니다.

- **데이터 소스:** `pmp_engko_final_0.2.csv` 파일을 초기 로드 시점에 파싱하여 JavaScript 객체 배열 형태로 메모리에 저장하고 사용합니다.
- **핵심 로직:** HTML, CSS, JavaScript를 사용하여 UI 렌더링, 문제풀이 로직, 정답 확인, 문제 이동 등 모든 기능을 구현합니다.
- **AI 연동:** '개념 학습하기' 기능은 Google AI JavaScript SDK를 사용하여 클라이언트에서 직접 Gemini 2.5 Pro API를 호출하는 방식으로 구현합니다.

## 2. 기술 스택

| 구분 | 기술 | 버전/사양 | 사유 |
| :--- | :--- | :--- | :--- |
| **언어** | HTML, CSS, JavaScript | 최신 표준 (HTML5, CSS3, ES6+) | 웹 표준 기술을 사용하여 별도의 프레임워크 없이 가볍고 빠르게 구현 |
| **라이브러리** | Papa Parse | 최신 버전 | CSV 파일을 효율적으로 파싱하기 위해 사용 |
| **AI** | Google AI JavaScript SDK | `@google/generative-ai` | Gemini API와 클라이언트 측에서 안전하고 편리하게 통신하기 위해 사용 |
| **스타일링** | CSS | - | 기본 CSS와 미디어 쿼리를 사용하여 반응형 디자인을 직접 구현 |
| **배포** | Firebase Hosting | - | (향후 배포 시 고려) 정적 웹사이트를 위한 빠르고 안정적인 호스팅 |

## 3. 주요 기능 구현 계획

### 3.1. CSV 데이터 처리
- **구현 방식:** 웹 페이지 로드 시 `fetch` API를 사용하여 `pmp_engko_final_0.2.csv` 파일을 비동기적으로 불러옵니다.
- **파싱:** Papa Parse 라이브러리의 `Papa.parse()` 함수를 사용하여 CSV 텍스트를 JSON 객체 배열로 변환합니다.
- **데이터 구조 예시:**
  ```javascript
  [
    {
      "문제 번호": "1",
      "영문 문제": "Which of the following...",
      "한국어 문제": "다음 중...",
      "문제의 답": "A",
      "문제의 해설": "해설 내용..."
    },
    // ...
  ]
  ```

### 3.2. UI 렌더링 및 상태 관리
- **상태:** 현재 문제 번호(`currentQuestionIndex`), 사용자가 선택한 답(`userSelection`), 채점 결과(`isCorrect`) 등의 상태를 JavaScript 변수로 관리합니다.
- **렌더링:** 상태가 변경될 때마다 특정 DOM 요소를 업데이트하는 함수(`renderQuestion()`)를 작성하여 UI를 동적으로 변경합니다. 별도의 가상 DOM 라이브러리 없이 직접 DOM을 조작합니다.

### 3.3. 문제풀이 로직
- **답안 제출:** 사용자가 답안을 선택하고 '제출' 버튼을 클릭하면, `userSelection`과 현재 문제의 정답(`questions[currentQuestionIndex]['문제의 답']`)을 비교하여 정답/오답 여부를 판단합니다.
- **결과 표시:**
  - 정답일 경우: "정답입니다!" 메시지와 함께 시각적 피드백(예: 녹색)을 표시합니다.
  - 오답일 경우: "오답입니다." 메시지와 함께 `questions[currentQuestionIndex]['문제의 해설']`을 화면에 표시합니다.

### 3.4. 문제 이동 기능
- **이전/다음:** `currentQuestionIndex` 변수의 값을 1씩 증가/감소시킨 후, `renderQuestion()` 함수를 호출하여 화면을 다시 그립니다. (배열의 경계를 벗어나지 않도록 예외 처리 포함)
- **직접 이동:** `<input type="number">` 필드에서 값을 받아 해당 인덱스로 `currentQuestionIndex`를 변경하고 `renderQuestion()`을 호출합니다.

### 3.5. Gemini API 연동
- **SDK 설정:** 제공된 API 키를 사용하여 Google AI SDK를 초기화합니다.
- **프롬프트 구성:** '개념 학습하기' 버튼 클릭 시, 현재 문제의 '한국어 문제' 또는 '영문 문제' 내용을 기반으로 아래와 같은 프롬프트 문자열을 동적으로 생성합니다.
  ```
  "You are a PMP expert based on the PMBOK 7th Edition. Please explain the key project management terms and concepts related to the following PMP exam question in Korean.

  Question: [현재 문제의 한국어 문제 텍스트 삽입]

  Explanation:"
  ```
- **API 호출:** 구성된 프롬프트를 `generativeModel.generateContent()` 함수의 인자로 전달하여 API를 호출하고, 응답으로 받은 텍스트를 화면의 모달 창이나 특정 영역에 표시합니다.
- **API 키 보안:** **주의!** 클라이언트 측 코드에 API 키를 직접 하드코딩하는 것은 보안상 매우 취약합니다. 이 프로젝트는 학습 및 프로토타이핑 목적으로 진행되지만, 실제 서비스에서는 환경 변수 또는 서버를 통해 안전하게 키를 관리해야 함을 명시합니다.

## 4. 파일 구조

```
/
├── PRD.md
├── TRD.md
├── pmp_engko_final_0.2.csv
├── index.html
├── css/
│   └── style.css
└── js/
    └── script.js
```
