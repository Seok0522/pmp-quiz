// DOM Elements
const quizContainer = document.getElementById('quiz-container');
const notesContainer = document.getElementById('notes-container');
const questionNumberEl = document.getElementById('question-number');
const questionEnEl = document.getElementById('question-en');
const questionKoEl = document.getElementById('question-ko');
const optionsContainer = document.getElementById('options-container');
const submitBtn = document.getElementById('submit-btn');
const feedbackContainer = document.getElementById('feedback-container');
const explanationContainer = document.getElementById('explanation-container');
const loginBtn = document.getElementById('login-btn');
const notesBtn = document.getElementById('notes-btn');
const notesListEl = document.getElementById('notes-list');
const retakeBtn = document.getElementById('retake-btn');

// State
let allQuestions = [];
let incorrectNotes = [];
let currentQuestionSet = [];
let currentQuestionIndex = 0;
let selectedAnswer = null;
let isSubmitted = false;
let incorrectNotesFileId = null;

// Google API Integration
const CLIENT_ID = '708764095382-ni69bvdt5tjcabl3homj4m0ubl5lgn6q.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata';
const NOTES_FILE_NAME = 'incorrect_notes.json';
let tokenClient;
let gapiInited = false;
let gisInited = false;

function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
}

function gisLoaded() {
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

function handleAuthClick() {
    if (gapi.client.getToken() === null) {
        if (tokenClient) {
            tokenClient.requestAccessToken({ prompt: 'consent' });
        }
    } else {
        gapi.client.setToken('');
        updateSigninStatus(false);
    }
}

function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        loginBtn.textContent = '로그아웃';
        notesBtn.style.display = 'block';
    } else {
        loginBtn.textContent = 'Google 계정으로 로그인';
        notesBtn.style.display = 'none';
        showQuizView();
    }
}

async function getNotesFileId() {
    // ... (Implementation unchanged)
}

async function updateNotesOnDrive(notes) {
    // ... (Implementation unchanged)
}

async function saveIncorrectAnswer(question) {
    // ... (Implementation unchanged)
}

async function deleteNote(questionNumber) {
    // ... (Implementation unchanged)
}

async function fetchNotes() {
    // ... (Implementation unchanged)
}

async function showNotesView() {
    // ... (Implementation unchanged)
}

function startRetakeQuiz() {
    // ... (Implementation unchanged)
}

function showQuizView() {
    // ... (Implementation unchanged)
}

async function loadQuestions() {
    try {
        const response = await fetch('./pmp_engko_final_0.2.csv');
        const csvData = await response.text();
        Papa.parse(csvData, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
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
                    displayQuestion(currentQuestionIndex);
                } else {
                    quizContainer.innerHTML = "<p>문제를 불러오지 못했습니다. CSV 파일 형식을 확인해주세요.</p>";
                }
            }
        });
    } catch (error) {
        console.error("CSV 파일 로딩 또는 파싱 에러:", error);
        quizContainer.innerHTML = "<p>문제 로딩 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.</p>";
    }
}

function displayQuestion(index) {
    // ... (Implementation unchanged)
}

submitBtn.addEventListener('click', () => {
    // ... (Implementation unchanged)
});

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
    loginBtn.disabled = true;
    loginBtn.addEventListener('click', handleAuthClick);
    notesBtn.addEventListener('click', showNotesView);
    retakeBtn.addEventListener('click', startRetakeQuiz);
    loadQuestions();
});
