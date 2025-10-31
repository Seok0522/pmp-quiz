import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

let genAI;
let apiKeyIsSet = false;

// DOM Elements
const changeApiKeyBtn = document.getElementById('change-api-key-btn');
const viewIncorrectBtn = document.getElementById('view-incorrect-btn');
const quizView = document.getElementById('quiz-view');
const incorrectNoteView = document.getElementById('incorrect-note-view');
const incorrectListEl = document.getElementById('incorrect-list');
const backToQuizBtn = document.getElementById('back-to-quiz-btn');

const questionNumberEl = document.getElementById('question-number');
const questionKoreanEl = document.getElementById('question-korean');
const englishContentEl = document.getElementById('english-content');
const questionEnglishEl = document.getElementById('question-english');
const toggleEnglishBtn = document.getElementById('toggle-english-btn');
const answersEl = document.getElementById('answers');
const submitBtn = document.getElementById('submit-btn');
const resultContainerEl = document.getElementById('result-container');
const resultMessageEl = document.getElementById('result-message');
const explanationContainerEl = document.getElementById('explanation-container');
const explanationEl = document.getElementById('explanation');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const questionJumpInput = document.getElementById('question-jump-input');
const jumpBtn = document.getElementById('jump-btn');
const conceptBtn = document.getElementById('concept-btn');
const geminiContainer = document.getElementById('gemini-container');
const geminiResponseEl = document.getElementById('gemini-response');
const progressBarContainer = document.querySelector('.progress-bar-container');
const progressBar = document.querySelector('.progress-bar');

// State
let questions = [];
let incorrectAnswers = [];
let currentQuestionIndex = 0;
let isGenerating = false;

function showView(viewId) {
    quizView.classList.add('hidden');
    incorrectNoteView.classList.add('hidden');
    document.getElementById(viewId).classList.remove('hidden');
}

function setApiKey(forcePrompt = false) {
    let apiKey = localStorage.getItem('geminiApiKey');
    if (forcePrompt || !apiKey) {
        apiKey = prompt("새로운 Gemini API 키를 입력해주세요.", apiKey || "");
        if (apiKey) {
            localStorage.setItem('geminiApiKey', apiKey);
            alert("API 키가 저장되었습니다.");
        } else {
            localStorage.removeItem('geminiApiKey');
            alert("API 키가 제거되었습니다.");
            return;
        }
    }
    if (apiKey) { genAI = new GoogleGenerativeAI(apiKey); apiKeyIsSet = true; } 
    else { apiKeyIsSet = false; }
}

function loadIncorrectAnswers() {
    incorrectAnswers = JSON.parse(localStorage.getItem('incorrectAnswers')) || [];
}

function saveIncorrectAnswers() {
    localStorage.setItem('incorrectAnswers', JSON.stringify(incorrectAnswers));
}

function addIncorrectAnswer(questionNumber) {
    if (!incorrectAnswers.includes(questionNumber)) {
        incorrectAnswers.push(questionNumber);
        saveIncorrectAnswers();
    }
}

function removeIncorrectAnswer(questionNumber) {
    const index = incorrectAnswers.indexOf(questionNumber);
    if (index > -1) {
        incorrectAnswers.splice(index, 1);
        saveIncorrectAnswers();
    }
}

function parseQuestionAndChoices(rawText) {
    if (!rawText) return { question: "", choices: {} };
    const processedText = rawText.replace(/\\n/g, '\n');
    const choiceMarkers = ['A.', 'B.', 'C.', 'D.'];
    let firstChoiceIndex = -1;
    for (const marker of choiceMarkers) {
        const index = processedText.indexOf(marker);
        if (index !== -1 && (firstChoiceIndex === -1 || index < firstChoiceIndex)) {
            firstChoiceIndex = index;
        }
    }
    let question = processedText, choicesText = '';
    if (firstChoiceIndex !== -1) {
        question = processedText.substring(0, firstChoiceIndex).trim();
        choicesText = processedText.substring(firstChoiceIndex).trim();
    }
    const choices = {};
    choicesText.split(/(?=[B-D]\.)/).forEach(s => {
        const key = s.substring(0, 1), value = s.substring(2).trim();
        if (['A', 'B', 'C', 'D'].includes(key)) choices[key] = value;
    });
    return { question: question.replace(/\n/g, '<br>'), choices };
}

async function loadQuestions() {
    const response = await fetch('./pmp_engko_final_0.2.csv');
    const buffer = await response.arrayBuffer();
    let csvData;
    try { csvData = new TextDecoder('euc-kr').decode(buffer); } 
    catch (e) { csvData = new TextDecoder('utf-8').decode(buffer); }
    Papa.parse(csvData, {
        header: true, skipEmptyLines: true,
        complete: (results) => {
            questions = results.data.map(q => ({
                number: q[results.meta.fields[0]], rawEnglish: q[results.meta.fields[1]],
                rawKorean: q[results.meta.fields[2]], answer: q[results.meta.fields[3]],
                explanation: q[results.meta.fields[4]]
            })).filter(q => q.number && q.number.trim() !== "");
            if (questions.length > 0) renderQuestion();
        }
    });
}

function renderQuestion() {
    const q = questions[currentQuestionIndex];
    const korean = parseQuestionAndChoices(q.rawKorean);
    const english = parseQuestionAndChoices(q.rawEnglish);
    questionNumberEl.textContent = `문제 ${q.number}`;
    questionKoreanEl.innerHTML = korean.question;
    answersEl.innerHTML = '';
    ['A', 'B', 'C', 'D'].forEach(key => {
        if (korean.choices[key]) {
            answersEl.innerHTML += `<div class="answer-choice"><input type="radio" id="choice-${key}" name="answer" value="${key}"><label for="choice-${key}"><span class="choice-key">${key}</span><span class="choice-text">${korean.choices[key].replace(/\n/g, '<br>')}</span></label></div>`;
        }
    });
    questionEnglishEl.innerHTML = `<p>${english.question}</p><ul>${['A', 'B', 'C', 'D'].map(k => english.choices[k] ? `<li><strong>${k}.</strong> ${english.choices[k].replace(/\n/g, '<br>')}</li>` : '').join('')}</ul>`;
    resetUI();
    prevBtn.disabled = currentQuestionIndex === 0;
    nextBtn.disabled = currentQuestionIndex === questions.length - 1;
}

function resetUI() {
    submitBtn.disabled = true;
    resultContainerEl.classList.add('hidden');
    explanationContainerEl.classList.add('hidden');
    geminiContainer.classList.add('hidden');
    englishContentEl.classList.add('hidden');
    toggleEnglishBtn.textContent = '영문 보기';
}

answersEl.addEventListener('change', e => {
    if (e.target.name === 'answer') {
        submitBtn.disabled = false;
        document.querySelectorAll('.answer-choice').forEach(d => d.classList.remove('selected', 'incorrect-choice'));
        e.target.closest('.answer-choice').classList.add('selected');
    }
});

submitBtn.addEventListener('click', () => {
    const selectedRadio = answersEl.querySelector('input[name="answer"]:checked');
    if (!selectedRadio) return;

    const userAnswer = selectedRadio.value;
    const q = questions[currentQuestionIndex];

    if (userAnswer === q.answer.trim()) {
        resultMessageEl.textContent = '정답입니다!';
        resultContainerEl.className = 'result-container correct';
        removeIncorrectAnswer(q.number);
    } else {
        resultMessageEl.textContent = `오답입니다. (정답: ${q.answer.trim()})`;
        resultContainerEl.className = 'result-container incorrect';
        explanationEl.innerHTML = q.explanation.replace(/\\n/g, '<br>');
        explanationContainerEl.classList.remove('hidden');
        addIncorrectAnswer(q.number);
        selectedRadio.closest('.answer-choice').classList.add('incorrect-choice');
    }
    answersEl.querySelectorAll('input[name="answer"]').forEach(i => i.disabled = true);
});

changeApiKeyBtn.addEventListener('click', () => setApiKey(true));
toggleEnglishBtn.addEventListener('click', () => {
    englishContentEl.classList.toggle('hidden');
    toggleEnglishBtn.textContent = englishContentEl.classList.contains('hidden') ? '영문 보기' : '영문 숨기기';
});
prevBtn.addEventListener('click', () => { if (currentQuestionIndex > 0) { currentQuestionIndex--; renderQuestion(); } });
nextBtn.addEventListener('click', () => { if (currentQuestionIndex < questions.length - 1) { currentQuestionIndex++; renderQuestion(); } });
jumpBtn.addEventListener('click', () => {
    const idx = questions.findIndex(q => q.number == questionJumpInput.value);
    if (idx !== -1) { currentQuestionIndex = idx; renderQuestion(); questionJumpInput.value = ''; }
});

viewIncorrectBtn.addEventListener('click', () => {
    incorrectListEl.innerHTML = incorrectAnswers.length ? '' : '<li>오답이 없습니다.</li>';
    incorrectAnswers.sort((a,b) => a - b).forEach(qNum => {
        const questionData = questions.find(q => q.number == qNum);
        if (!questionData) return;
        
        const koreanParsed = parseQuestionAndChoices(questionData.rawKorean);
        const snippet = koreanParsed.question.replace(/<br>/g, ' ').substring(0, 50) + '...';
        
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="incorrect-q-info">
                <span class="incorrect-q-number">문제 ${qNum}</span>
                <p class="incorrect-q-snippet">${snippet}</p>
            </div>
            <div class="actions">
                <button class="retry-btn" data-qnum="${qNum}">풀기</button>
                <button class="delete-btn" data-qnum="${qNum}">삭제</button>
            </div>`;
        incorrectListEl.appendChild(li);
    });
    showView('incorrect-note-view');
});

incorrectListEl.addEventListener('click', e => {
    const qNum = e.target.dataset.qnum;
    if (e.target.classList.contains('retry-btn')) {
        const idx = questions.findIndex(q => q.number == qNum);
        if (idx !== -1) { currentQuestionIndex = idx; renderQuestion(); showView('quiz-view'); }
    } else if (e.target.classList.contains('delete-btn')) {
        removeIncorrectAnswer(qNum);
        e.target.closest('li').remove();
         if (incorrectAnswers.length === 0) {
            incorrectListEl.innerHTML = '<li>오답이 없습니다.</li>';
        }
    }
});

backToQuizBtn.addEventListener('click', () => showView('quiz-view'));

conceptBtn.addEventListener('click', async () => {
    if (!apiKeyIsSet) { setApiKey(); return; }
    if (isGenerating) return;
    isGenerating = true;
    geminiContainer.classList.remove('hidden');
    geminiResponseEl.innerHTML = '';
    progressBar.style.width = '0%';
    progressBarContainer.style.display = 'block';
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
        const prompt = `You are a PMP expert. Explain the key concepts for the following question in Korean using markdown.\n\n---\n**Question:** ${questions[currentQuestionIndex].rawKorean}\n---\n**Concepts:**`;
        const result = await model.generateContentStream(prompt);
        let aggregatedText = "", progress = 0;
        const progressInterval = setInterval(() => { if (progress < 95) progressBar.style.width = `${progress += 5}%`; }, 200);
        for await (const chunk of result.stream) {
            aggregatedText += chunk.text();
            geminiResponseEl.innerHTML = aggregatedText
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Corrected bold parsing
                .replace(/\*(.*?)\*/g, '<em>$1</em>')     // Corrected italic parsing
                .replace(/(\r\n|\n|\r)/g, '<br>');
        }
        clearInterval(progressInterval);
        progressBar.style.width = '100%';
        setTimeout(() => { progressBarContainer.style.display = 'none'; }, 500);
    } catch (e) {
        geminiResponseEl.textContent = `AI 응답 생성 실패. API 키, 네트워크, 모델 ID를 확인하세요.`;
        progressBarContainer.style.display = 'none';
    } finally {
        isGenerating = false;
    }
});

document.addEventListener('DOMContentLoaded', () => {
    loadQuestions();
    loadIncorrectAnswers();
    setApiKey();
});
