// Global functions for Google API callbacks must be outside DOMContentLoaded
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


document.addEventListener('DOMContentLoaded', () => {
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
    let allQuestions = [], incorrectNotes = [], currentQuestionSet = [];
    let currentQuestionIndex = 0, selectedAnswer = null, isSubmitted = false, incorrectNotesFileId = null;

    // Google API Integration
    const CLIENT_ID = '708764095382-ni69bvdt5tjcabl3homj4m0ubl5lgn6q.apps.googleusercontent.com';
    const SCOPES = 'https://www.googleapis.com/auth/drive.appdata';
    const NOTES_FILE_NAME = 'incorrect_notes.json';
    let tokenClient;
    let gapiInited = false;
    let gisInited = false;

    // All functions are defined inside DOMContentLoaded to ensure they have access to all variables
    
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
            if (tokenClient) tokenClient.requestAccessToken({ prompt: 'consent' });
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
        if (incorrectNotesFileId) return incorrectNotesFileId;
        const response = await gapi.client.drive.files.list({
            spaces: 'appDataFolder', fields: 'files(id, name)', q: `name='${NOTES_FILE_NAME}'`
        });
        if (response.result.files.length > 0) return incorrectNotesFileId = response.result.files[0].id;
        return null;
    }

    async function updateNotesOnDrive(notes) {
        const fileId = await getNotesFileId();
        const boundary = '-------314159265358979323846', delimiter = `\r\n--${boundary}\r\n`, close_delim = `\r\n--${boundary}--`;
        const metadata = { name: NOTES_FILE_NAME, mimeType: 'application/json' };
        const multipartRequestBody = `${delimiter}Content-Type: application/json\r\n\r\n${JSON.stringify(metadata)}${delimiter}Content-Type: application/json\r\n\r\n${JSON.stringify(notes)}${close_delim}`;
        const request = gapi.client.request({
            path: `/upload/drive/v3/files/${fileId || ''}`, method: fileId ? 'PATCH' : 'POST',
            params: { uploadType: 'multipart' }, headers: { 'Content-Type': `multipart/related; boundary="${boundary}"` },
            body: multipartRequestBody
        });
        return new Promise(resolve => request.execute(file => resolve(incorrectNotesFileId = file.id)));
    }

    async function saveIncorrectAnswer(question) {
        if (!incorrectNotes.some(note => note.number === question.number)) {
            incorrectNotes.push(question);
            await updateNotesOnDrive(incorrectNotes);
        }
    }

    async function deleteNote(questionNumber) {
        incorrectNotes = incorrectNotes.filter(note => note.number !== questionNumber);
        await updateNotesOnDrive(incorrectNotes);
        showNotesView();
    }

    async function fetchNotes() {
        const fileId = await getNotesFileId();
        if (!fileId) return incorrectNotes = [];
        const response = await gapi.client.drive.files.get({ fileId, alt: 'media' });
        return incorrectNotes = JSON.parse(response.body || '[]');
    }

    async function showNotesView() {
        quizContainer.style.display = 'none'; notesContainer.style.display = 'block';
        notesBtn.textContent = '퀴즈로 돌아가기'; notesBtn.onclick = () => { currentQuestionSet = allQuestions; currentQuestionIndex = 0; displayQuestion(currentQuestionIndex); showQuizView(); };
        notesListEl.innerHTML = '<em>로딩 중...</em>';
        const notes = await fetchNotes();
        if (notes.length === 0) { notesListEl.innerHTML = '<p>저장된 오답노트가 없습니다.</p>'; retakeBtn.style.display = 'none'; return; }
        retakeBtn.style.display = 'block'; notesListEl.innerHTML = '';
        notes.forEach(note => {
            const noteEl = document.createElement('div'); noteEl.className = 'note-item';
            noteEl.innerHTML = `<div><strong>문제 ${note.number}:</strong> ${note.question_ko.substring(0, 50)}...</div><button class="delete-btn" data-id="${note.number}">삭제</button>`;
            noteEl.querySelector('.delete-btn').addEventListener('click', e => {
                const id = e.target.getAttribute('data-id');
                if (confirm(`문제 ${id}를 정말로 삭제하시겠습니까?`)) deleteNote(id);
            });
            notesListEl.appendChild(noteEl);
        });
    }

    function startRetakeQuiz() {
        if (incorrectNotes.length === 0) return alert('다시 풀 오답 문제가 없습니다.');
        currentQuestionSet = incorrectNotes; currentQuestionIndex = 0;
        displayQuestion(currentQuestionIndex); showQuizView();
    }

    function showQuizView() {
        notesContainer.style.display = 'none'; quizContainer.style.display = 'block';
        notesBtn.textContent = '오답노트'; notesBtn.onclick = showNotesView;
    }

    async function loadQuestions() {
        try {
            const response = await fetch('./pmp_engko_final_0.2.csv');
            const csvData = await response.text();
            Papa.parse(csvData, { header: true, skipEmptyLines: true, complete: (results) => {
                allQuestions = results.data.map(q => ({
                    number: q['문제번호'], question_en: q['영문 문제'], question_ko: q['한국어 문제'],
                    options: { A: q.A, B: q.B, C: q.C, D: q.D }, answer: q['문제의 답'] ? q['문제의 답'].trim() : '', explanation: q['해설']
                }));
                currentQuestionSet = allQuestions;
                if (currentQuestionSet.length > 0) displayQuestion(currentQuestionIndex);
                else quizContainer.innerHTML = "<p>문제를 불러오지 못했습니다.</p>";
            }});
        } catch (error) { quizContainer.innerHTML = "<p>문제 로딩 중 오류가 발생했습니다.</p>"; }
    }

    function displayQuestion(index) {
        if (index >= currentQuestionSet.length) { quizContainer.innerHTML = `<h2>퀴즈가 종료되었습니다!</h2>`; return; }
        const question = currentQuestionSet[index];
        questionNumberEl.textContent = `문제 ${question.number}`; questionEnEl.textContent = question.question_en; questionKoEl.textContent = question.question_ko;
        optionsContainer.innerHTML = ''; selectedAnswer = null; isSubmitted = false;
        for (const [key, value] of Object.entries(question.options)) {
            if (value) {
                const optionElement = document.createElement('div'); optionElement.dataset.key = key;
                optionElement.textContent = `${key}: ${value}`;
                optionElement.addEventListener('click', () => {
                    if (isSubmitted) return;
                    selectedAnswer = key;
                    document.querySelectorAll('#options-container div').forEach(el => el.classList.remove('selected'));
                    optionElement.classList.add('selected');
                });
                optionsContainer.appendChild(optionElement);
            }
        }
        feedbackContainer.textContent = ''; explanationContainer.style.display = 'none';
        submitBtn.textContent = '답안 제출';
    }

    // Defensive event listeners
    if(submitBtn) {
        submitBtn.addEventListener('click', () => {
            if (isSubmitted) { currentQuestionIndex++; displayQuestion(currentQuestionIndex); return; }
            if (selectedAnswer === null) return alert('답을 선택해주세요.');
            const question = currentQuestionSet[currentQuestionIndex];
            isSubmitted = true;
            if (selectedAnswer === question.answer) {
                feedbackContainer.textContent = '정답입니다!'; feedbackContainer.style.color = 'green';
            } else {
                feedbackContainer.textContent = `오답입니다. (정답: ${question.answer})`; feedbackContainer.style.color = 'red';
                explanationContainer.innerHTML = `<strong>해설:</strong><br>${question.explanation}`; explanationContainer.style.display = 'block';
                if (gapi.client.getToken() !== null) saveIncorrectAnswer(question);
            }
            submitBtn.textContent = '다음 문제';
        });
    }

    if(loginBtn) {
        loginBtn.disabled = true;
        loginBtn.addEventListener('click', handleAuthClick);
    }
    
    if(notesBtn) {
        notesBtn.addEventListener('click', showNotesView);
    }

    if(retakeBtn) {
        retakeBtn.addEventListener('click', startRetakeQuiz);
    }
    
    loadQuestions();
});
