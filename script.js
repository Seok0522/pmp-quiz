// --- DEBUG ---
console.log("script.js: 파일 실행 시작");

// DOM Elements
const quizContainer = document.getElementById('quiz-container');
const notesContainer = document.getElementById('notes-container');
// ... (rest of the DOM elements)
const loginBtn = document.getElementById('login-btn');
const notesBtn = document.getElementById('notes-btn');
// ...

// State
let allQuestions = [];
// ... (rest of the state variables)

// Google API Integration
const CLIENT_ID = '708764095382-ni69bvdt5tjcabl3homj4m0ubl5lgn6q.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata';
let tokenClient;
let gapiInited = false;
let gisInited = false;

// --- DEBUG ---
console.log("script.js: gapiLoaded 함수 정의 시도");
function gapiLoaded() {
    // --- DEBUG ---
    console.log("gapiLoaded: 함수 호출됨!");
    gapi.load('client', initializeGapiClient);
}
console.log("script.js: gapiLoaded 함수 정의 완료");

// --- DEBUG ---
console.log("script.js: gisLoaded 함수 정의 시도");
function gisLoaded() {
    // --- DEBUG ---
    console.log("gisLoaded: 함수 호출됨!");
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (tokenResponse) => {
            if (tokenResponse.access_token) {
                updateSigninStatus(true);
                fetchNotes();
            }
        },
    });
    gisInited = true;
    maybeEnableButtons();
}
console.log("script.js: gisLoaded 함수 정의 완료");


function initializeGapiClient() {
    gapi.client.init({
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
    }).then(() => {
        gapiInited = true;
        maybeEnableButtons();
    });
}

function maybeEnableButtons() {
    if (gapiInited && gisInited) {
        loginBtn.disabled = false;
    }
}

// ... (rest of the functions: handleAuthClick, updateSigninStatus, etc.)

async function loadQuestions() {
    // --- DEBUG ---
    console.log("loadQuestions: 함수 호출됨. CSV 파일 로딩 시작.");
    try {
        const response = await fetch('./pmp_engko_final_0.2.csv');
        if (!response.ok) {
            // --- DEBUG ---
            console.error('CSV 파일 fetch 실패:', response.status, response.statusText);
            quizContainer.innerHTML = `<p>오류: 문제 데이터 파일(CSV)을 불러오는 데 실패했습니다. (HTTP ${response.status})</p>`;
            return;
        }
        const csvData = await response.text();
        // --- DEBUG ---
        console.log("loadQuestions: CSV 파일 로딩 성공. 파싱 시작.");
        Papa.parse(csvData, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                // --- DEBUG ---
                console.log("loadQuestions: CSV 파싱 완료.", results.data.length, "개의 문제 발견.");
                allQuestions = results.data.map(q => ({
                    number: q['문제번호'],
                    question_en: q['영문 문제'],
                    question_ko: q['한국어 문제'],
                    options: { A: q.A, B: q.B, C: q.C, D: q.D },
                    answer: q['문제의 답'] ? q['문제의 답'].trim() : '',
                    explanation: q['해설']
                }));
                currentQuestionSet = allQuestions;
                if (currentQuestionSet.length > 0) {
                    displayQuestion(0);
                } else {
                    quizContainer.innerHTML = "<p>문제 파싱에 실패했거나 데이터가 없습니다.</p>";
                }
            }
        });
    } catch (error) {
        // --- DEBUG ---
        console.error("loadQuestions: 함수 실행 중 치명적인 오류 발생:", error);
        quizContainer.innerHTML = "<p>문제 로딩 중 예기치 않은 오류가 발생했습니다. 콘솔을 확인해주세요.</p>";
    }
}


// --- All other functions like displayQuestion, handleAuthClick etc. would go here ---
// (omitting for brevity, they remain unchanged)

// Initial Load Logic
document.addEventListener('DOMContentLoaded', () => {
    // --- DEBUG ---
    console.log("DOMContentLoaded: 이벤트 발생. 초기화 로직 시작.");
    
    loginBtn.disabled = true;
    loginBtn.addEventListener('click', handleAuthClick);
    notesBtn.addEventListener('click', showNotesView);
    retakeBtn.addEventListener('click', startRetakeQuiz);
    
    loadQuestions();
});
// (The full code for other functions should be included in the actual file)
// Helper functions (handleAuthClick, updateSigninStatus, getNotesFileId, updateNotesOnDrive, saveIncorrectAnswer, deleteNote, fetchNotes, showNotesView, startRetakeQuiz, showQuizView, displayQuestion, submitBtn listener) are assumed to be here.
