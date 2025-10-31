# PMP 시험 학습 웹 애플리케이션 TRD (Technical Requirements Document) - 최종

## 1. 시스템 아키텍처

본 애플리케이션은 별도의 백엔드 서버 없이, 모든 로직이 클라이언트 측(브라우저)에서 실행되는 **정적 웹 페이지(Static Web Page)** 형태로 구축합니다.

- **데이터 소스:** `pmp_engko_final_0.2.csv` 파일을 초기 로드 시점에 파싱하여 JavaScript 객체 배열 형태로 메모리에 저장하고 사용합니다.
- **핵심 로직:** HTML, CSS, JavaScript를 사용하여 UI 렌더링, 문제풀이 로직, 화면 전환 등 모든 기능을 구현합니다.
- **상태 관리:** API 키, 오답 문제 목록 등 사용자 개인화 데이터는 **브라우저의 `localStorage`** 를 사용하여 영속적으로 관리합니다.
- **AI 연동:** '개념 학습하기' 기능은 Google AI JavaScript SDK를 사용하여 클라이언트에서 직접 Gemini API를 호출하는 방식으로 구현합니다. **(개선)** 단일 응답 방식에서 `generateContentStream`을 사용한 스트리밍 방식으로 변경하여 UX를 개선합니다.

## 2. 기술 스택

| 구분 | 기술 | 사양 | 사유 |
| :--- | :--- | :--- | :--- |
| **언어** | HTML, CSS, JavaScript | HTML5, CSS3 (Media Query), ES6+ | 웹 표준 기술을 사용하여 별도의 프레임워크 없이 가볍고 빠르게 구현하며, 미디어 쿼리로 반응형 UI를 지원. |
| **라이브러리** | Papa Parse | 최신 버전 | CSV 파일을 효율적이고 안정적으로 파싱. |
| **AI** | Google AI JavaScript SDK | `@google/generative-ai` | Gemini API와 클라이언트 측에서 안전하고 편리하게 통신. |
| **배포** | GitHub Pages | - | 정적 웹사이트를 위한 무료의 안정적인 호스팅. |

## 3. 주요 기능 구현 계획

### 3.1. CSV 데이터 처리
- **인코딩 처리:** `fetch`와 `TextDecoder`를 사용하여 `EUC-KR`과 `UTF-8` 인코딩을 순차적으로 시도하여 한글 깨짐 문제를 방지합니다.
- **문제/보기 파싱:** 정규표현식을 활용한 `parseQuestionAndChoices` 함수를 통해 문제 본문과 보기("A.", "B." 등)를 안정적으로 분리하여 별도의 데이터 객체로 가공합니다.

### 3.2. UI 렌더링 및 상태 관리
- **화면 전환:** '문제 풀이'와 '오답노트' 영역을 별도의 `div`로 구분하고, `hidden` 클래스를 제어하여 SPA(Single Page Application)와 유사한 화면 전환을 구현합니다.
- **반응형 UI:** CSS 미디어 쿼리(`@media (max-width: 768px)`)를 사용하여 모바일 화면에서는 여백, 폰트 크기, 버튼 레이아웃 등을 최적화합니다.

### 3.3. 오답노트 기능
- **데이터 저장:** 사용자가 문제를 틀릴 경우, 해당 문제의 고유 번호(`number`)를 `incorrectAnswers` 배열에 추가하고, `JSON.stringify`를 통해 문자열로 변환한 뒤 `localStorage`에 저장합니다.
- **데이터 관리:**
    - 정답 시: `removeIncorrectAnswer` 함수를 호출하여 `localStorage`에서 해당 문제 번호를 제거합니다.
    - 수동 삭제: 오답노트 화면의 '삭제' 버튼 클릭 시에도 동일한 함수를 호출합니다.

### 3.4. Gemini API 연동 및 보안
- **API 키 관리:**
    - **저장:** API 키는 `localStorage.setItem('geminiApiKey', key)`를 통해 사용자의 브라우저에만 안전하게 저장됩니다. 소스 코드에는 키가 포함되지 않습니다.
    - **호출 시점:** 페이지 로드 시 `localStorage`에 키가 있는지 확인하여 `apiKeyIsSet` 상태만 업데이트하고, 실제 키 입력 요청(`prompt`)은 '개념 학습하기' 기능을 처음 사용하려고 할 때만 트리거됩니다.
- **스트리밍 응답:**
    - `model.generateContentStream(prompt)`를 사용하여 API 응답을 스트림 형태로 받습니다.
    - `for await...of` 루프를 통해 각 텍스트 조각(chunk)을 실시간으로 `gemini-response` DOM 요소에 추가하여 타이핑 효과를 구현합니다.
    - 스트림이 진행되는 동안 `setInterval`을 이용해 프로그레스 바의 너비를 점진적으로 증가시켜 진행 상태를 시각화합니다.

## 4. 최종 파일 구조

```
/
├── PRD.md
├── TRD.md
├── decision.md  <-- 신규
├── pmp_engko_final_0.2.csv
├── index.html
├── css/
│   └── style.css
└── js/
    └── script.js
```
