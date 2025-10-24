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
    let allQuestions = [];
    let incorrectNotes = [];
    let currentQuestionSet = []; // The active set of questions for the quiz
    let currentQuestionIndex = 0;
    let selectedAnswer = null;
    let isSubmitted = false;
    let incorrectNotesFileId = null;

    // --- Google API Integration ---
    const CLIENT_ID = 'YOUR_CLIENT_ID.apps.googleusercontent.com'; // Replace with your Client ID
    const SCOPES = 'https://www.googleapis.com/auth/drive.appdata';
    const NOTES_FILE_NAME = 'incorrect_notes.json';
    let tokenClient;
    
    // Authorization
    function handleAuthClick() {
        if (gapi.client.getToken() === null) {
            tokenClient.requestAccessToken({prompt: 'consent'});
        } else {
            gapi.client.getToken(); // Revoke token
            gapi.client.setToken('');
            updateSigninStatus(false);
        }
    }

    function updateSigninStatus(isSignedIn) {
        if (isSignedIn) {
            loginBtn.textContent = '로그아웃';
            notesBtn.style.display = 'block';
            notesBtn.textContent = '오답노트';
            notesBtn.onclick = showNotesView;
        } else {
            loginBtn.textContent = 'Google 계정으로 로그인';
            notesBtn.style.display = 'none';
            showQuizView();
        }
    }

    // Google Drive Functions
    async function getNotesFileId() {
        if (incorrectNotesFileId) return incorrectNotesFileId;
        try {
            const response = await gapi.client.drive.files.list({
                spaces: 'appDataFolder',
                fields: 'files(id, name)',
                q: `name='${NOTES_FILE_NAME}'`
            });
            if (response.result.files && response.result.files.length > 0) {
                incorrectNotesFileId = response.result.files[0].id;
                return incorrectNotesFileId;
            }
            return null;
        } catch (err) { console.error("Error getting file ID:", err); return null; }
    }

    async function updateNotesOnDrive(notes) {
        const fileId = await getNotesFileId();
        const boundary = '-------314159265358979323846';
        const delimiter = `\r\n--${boundary}\r\n`;
        const close_delim = `\r\n--${boundary}--`;
        const metadata = { name: NOTES_FILE_NAME, mimeType: 'application/json' };
        
        const multipartRequestBody =
            `${delimiter}Content-Type: application/json\r\n\r\n${JSON.stringify(metadata)}` +
            `${delimiter}Content-Type: application/json\r\n\r\n${JSON.stringify(notes)}${close_delim}`;

        const request = gapi.client.request({
            path: `/upload/drive/v3/files/${fileId || ''}`,
            method: fileId ? 'PATCH' : 'POST',
            params: { uploadType: 'multipart' },
            headers: { 'Content-Type': `multipart/related; boundary="${boundary}"` },
            body: multipartRequestBody
        });
        
        return new Promise((resolve, reject) => {
            request.execute(file => {
                if (file.id) {
                    incorrectNotesFileId = file.id;
                    resolve(file);
                } else {
                    reject('File update failed');
                }
            });
        });
    }

    async function saveIncorrectAnswer(question) {
        // Optimistic update
        if (!incorrectNotes.some(note => note.number === question.number)) {
            incorrectNotes.push(question);
            await updateNotesOnDrive(incorrectNotes);
            console.log('오답노트 저장 완료');
        }
    }
    
    async function deleteNote(questionNumber) {
        incorrectNotes = incorrectNotes.filter(note => note.number !== questionNumber);
        await updateNotesOnDrive(incorrectNotes);
        console.log(`문제 ${questionNumber} 삭제 완료`);
        showNotesView(); // Refresh the view
    }

    async function fetchNotes() {
        const fileId = await getNotesFileId();
        if (!fileId) {
            incorrectNotes = [];
            return [];
        }
        try {
            const response = await gapi.client.drive.files.get({ fileId, alt: 'media' });
            incorrectNotes = JSON.parse(response.body || '[]');
            return incorrectNotes;
        } catch (e) {
            console.error("Error fetching notes:", e);
            return [];
        }
    }

    async function showNotesView() {
        quizContainer.style.display = 'none';
        notesContainer.style.display = 'block';
        notesBtn.textContent = '퀴즈로 돌아가기';
        notesBtn.onclick = () => {
            currentQuestionSet = allQuestions;
            currentQuestionIndex = 0; // Or last viewed question index
            displayQuestion(currentQuestionIndex);
            showQuizView();
        };
        
        notesListEl.innerHTML = '<em>로딩 중...</em>';
        const notes = await fetchNotes();

        if (notes.length === 0) {
            notesListEl.innerHTML = '<p>저장된 오답노트가 없습니다.</p>';
            retakeBtn.style.display = 'none';
            return;
        }

        retakeBtn.style.display = 'block';
        notesListEl.innerHTML = '';
        notes.forEach(note => {
            const noteEl = document.createElement('div');
            noteEl.className = 'note-item';
            noteEl.innerHTML = `
                <div>
                    <strong>문제 ${note.number}:</strong> ${note.question_ko.substring(0, 50)}...
                </div>
                <button class="delete-btn" data-id="${note.number}">삭제</button>
            `;
            noteEl.querySelector('.delete-btn').addEventListener('click', (e) => {
                const idToDelete = e.target.getAttribute('data-id');
                if (confirm(`문제 ${idToDelete}를 정말로 삭제하시겠습니까?`)) {
                    deleteNote(idToDelete);
                }
            });
            notesListEl.appendChild(noteEl);
        });
    }

    function startRetakeQuiz() {
        if (incorrectNotes.length === 0) {
            alert('다시 풀 오답 문제가 없습니다.');
            return;
        }
        currentQuestionSet = incorrectNotes;
        currentQuestionIndex = 0;
        displayQuestion(currentQuestionIndex);
        showQuizView();
    }

    function showQuizView() {
        notesContainer.style.display = 'none';
        quizContainer.style.display = 'block';
        notesBtn.textContent = '오답노트';
        notesBtn.onclick = showNotesView;
    }

    // --- Quiz Logic ---
    async function loadQuestions() {
        try {
            const response = await fetch('pmp_engko_final_0.2.csv');
            const csvData = await response.text();
            Papa.parse(csvData, { header: true, skipEmptyLines: true, complete: (results) => {
                allQuestions = results.data.map(q => ({
                    number: q['문제번호'], question_en: q['영문 문제'], question_ko: q['한국어 문제'],
                    options: { A: q.A, B: q.B, C: q.C, D: q.D }, answer: q['문제의 답'].trim(), explanation: q['해설']
                }));
                currentQuestionSet = allQuestions; // Default to all questions
                if (currentQuestionSet.length > 0) displayQuestion(currentQuestionIndex);
                else quizContainer.innerHTML = "<p>문제를 불러오지 못했습니다.</p>";
            }});
        } catch (error) { quizContainer.innerHTML = "<p>문제 로딩 중 오류 발생.</p>"; }
    }

    function displayQuestion(index) {
        if (index >= currentQuestionSet.length) {
            quizContainer.innerHTML = `<h2>퀴즈가 종료되었습니다!</h2><p>${currentQuestionSet.length} 문제를 모두 푸셨습니다.</p>`;
            // Add a button to go back to the main menu/notes
            const backBtn = document.createElement('button');
            backBtn.textContent = '메인으로 돌아가기';
            backBtn.onclick = () => {
                currentQuestionSet = allQuestions;
                currentQuestionIndex = 0;
                displayQuestion(0);
            };
            quizContainer.appendChild(backBtn);
            return;
        }

        const question = currentQuestionSet[index];
        questionNumberEl.textContent = `문제 ${question.number}`;
        questionEnEl.textContent = question.question_en;
        questionKoEl.textContent = question.question_ko;
        optionsContainer.innerHTML = '';
        selectedAnswer = null;
        isSubmitted = false;

        for (const [key, value] of Object.entries(question.options)) {
            if (value) {
                const optionElement = document.createElement('div');
                optionElement.dataset.key = key;
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
        feedbackContainer.textContent = '';
        explanationContainer.style.display = 'none';
        submitBtn.textContent = '답안 제출';
    }

    submitBtn.addEventListener('click', () => {
        if (isSubmitted) {
            currentQuestionIndex++;
            displayQuestion(currentQuestionIndex);
            return;
        }
        if (selectedAnswer === null) { alert('답을 선택해주세요.'); return; }

        const question = currentQuestionSet[currentQuestionIndex];
        isSubmitted = true;

        if (selectedAnswer === question.answer) {
            feedbackContainer.textContent = '정답입니다!';
            feedbackContainer.style.color = 'green';
        } else {
            feedbackContainer.textContent = `오답입니다. (정답: ${question.answer})`;
            feedbackContainer.style.color = 'red';
            explanationContainer.innerHTML = `<strong>해설:</strong><br>${question.explanation}`;
            explanationContainer.style.display = 'block';
            if (gapi.client.getToken() !== null) {
                saveIncorrectAnswer(question);
            }
        }
        submitBtn.textContent = '다음 문제';
    });

    // --- Initial Load ---
    function initializeGapiClient() { gapi.client.init({ discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']}); }
    function gapiLoaded() { gapi.load('client', initializeGapiClient); }
    function initializeGisClient() { tokenClient = google.accounts.oauth2.initTokenClient({ client_id: CLIENT_ID, scope: SCOPES, callback: (tokenResponse) => { if (tokenResponse.access_token) { updateSigninStatus(true); fetchNotes(); } }, }); }
    function gisLoaded() { google.accounts.oauth2.gis.load('client', initializeGisClient); }
    
    loginBtn.addEventListener('click', handleAuthClick);
    retakeBtn.addEventListener('click', startRetakeQuiz);
    
    const gapiScript = document.createElement('script');
    gapiScript.src = 'https://apis.google.com/js/api.js';
    gapiScript.onload = gapiLoaded;
    document.body.appendChild(gapiScript);

    const gisScript = document.createElement('script');
    gisScript.src = 'https://accounts.google.com/gsi/client';
    gisScript.onload = gisLoaded;
    document.body.appendChild(gisScript);

    loadQuestions();
});
