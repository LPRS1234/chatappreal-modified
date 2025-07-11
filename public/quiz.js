// 문제 카운트 최대 5문제
const MAX_GAME_COUNT = 5;
let gameCount = 0;

let usedIdxs = [];

let correct = 0;
let wrong = 0;

let currentQuiz = null;
let isQuizActive = true;
let isGameActive = true;

const meaningElem = document.getElementById('quiz-meaning');
const resultElem = document.getElementById('result-msg');
const exampleElem = document.getElementById('example-msg');
const nextBtn = document.getElementById('next-btn');
const competition = document.getElementById('vsai');
const corrects = document.querySelector(".correct");
const wrongs = document.querySelector('.wrong');
const timer = document.querySelector('.timer');

let time = 30;
let timerInterval = null;

// 새 문제 출제
function newQuiz() {
  // 기존 타이머 중지
  if (timerInterval) {
    clearInterval(timerInterval);
  }

  time = 30;
  timer.innerText = `${time}s`;
  isGameActive = true;
  resultElem.textContent = '';
  exampleElem.textContent = '';
  if (window.clearHint) clearHint();

  if (gameCount < MAX_GAME_COUNT) {
    document.getElementById("result").style.display = "none";
  }

  if (gameCount >= MAX_GAME_COUNT) {
    meaningElem.textContent = `게임 종료! ${MAX_GAME_COUNT}문제를 모두 풀었습니다 😊`;
    nextBtn.style.display = "none";
    isQuizActive = false;

    nextBtn.textContent = "다시 시작";
    nextBtn.style.display = "inline-block";
    isGameActive = false;
    resultElem.innerHTML = `맞춘것: ${correct}개, 틀린것: ${wrong}개`;

    if (correct >= 3) {
      competition.innerText = "축하합니다! AI와의 대결에서 승리하였습니다!";
      competition.style.color = "green";
    } else {
      competition.innerText = "AI와의 대결에서 패배하였습니다...";
      competition.style.color = "red";
    }

    correct = 0;
    wrong = 0;
    return;
  }

  const unusedIdxs = idioms.map((_, i) => i).filter(i => !usedIdxs.includes(i));
  if (unusedIdxs.length === 0) {
    meaningElem.textContent = "출제 가능한 문제가 더 이상 없습니다!";
    isQuizActive = false;
    nextBtn.style.display = "none";
    return;
  }

  const randIdx = unusedIdxs[Math.floor(Math.random() * unusedIdxs.length)];
  usedIdxs.push(randIdx);
  const random = idioms[randIdx];
  currentQuiz = random;

  meaningElem.textContent = `문항 수 : [${gameCount} / ${MAX_GAME_COUNT}] ${random.meaning}`;
  isQuizActive = true;
  nextBtn.style.display = "none";

  window.currentAnswer = random.word;

  // 타이머 시작
  timerInterval = setInterval(decTime, 1000);
}

// 정답 판정
function checkQuizAnswer(answer) {
  if (!isQuizActive) return { correct: false, done: true };
  if (!answer || answer.length !== 4) return { correct: false, done: false };

  if (answer === currentQuiz.word) {
    correct++;
    corrects.innerText = `맞춘것: ${correct}개`;
    resultElem.textContent = "정답입니다! 🎉";
    resultElem.style.color = "green";
    exampleElem.textContent = "예문: " + currentQuiz.example;
    isQuizActive = false;
    isGameActive = false;
    nextBtn.style.display = "inline-block";
    document.getElementById("result").style.display = "block";

    clearInterval(timerInterval);
    return { correct: true, done: true };
  } else {
    return { correct: false, done: false };
  }
}

// 실패 시 호출
function showQuizFail() {
  if (!currentQuiz || !isQuizActive) return;

  resultElem.textContent = "오답입니다. 정답: " + currentQuiz.word;
  resultElem.style.color = "red";
  exampleElem.textContent = "예문: " + currentQuiz.example;
  document.getElementById("result").style.display = "block";
  wrong++;
  isQuizActive = false;
  isGameActive = false;
  nextBtn.style.display = "inline-block";
  wrongs.innerText = `틀린것: ${wrong}개`;

  clearInterval(timerInterval);
}

// 타이머 감소
function decTime() {
  if (time >= 0 && isGameActive) {
    timer.innerText = `${time}s`;
    time--;
  } else if (time < 0 && isGameActive && isQuizActive) {
    resultElem.innerText = "시간 초과! 정답: " + currentQuiz.word;
    resultElem.style.color = "red";
    exampleElem.innerText = `예문: ${currentQuiz.example}`;
    isQuizActive = false;
    isGameActive = false;
    nextBtn.style.display = "inline-block";
    wrong++;
    wrongs.innerText = `틀린것: ${wrong}개`;
    document.getElementById("result").style.display = "block";

    clearInterval(timerInterval);
  }
}

// 다음 버튼 클릭
nextBtn.onclick = function () {
  if (gameCount >= MAX_GAME_COUNT) {
    gameCount = 0;
    competition.innerText = "";
    usedIdxs = [];
    nextBtn.textContent = "다음 문제";
  } else {
    gameCount++;
    isGameActive = false;
  }
  newQuiz();
  typeof resetBoard === "function" && resetBoard();
};

window.addEventListener('DOMContentLoaded', newQuiz);

// 힌트 버튼
const hintBtn = document.getElementById('hint-btn');
const hintArea = document.getElementById('hint-area');

let hintTimeout = null;

hintBtn.addEventListener('click', function () {
  const answer = (window.currentAnswer || (window.currentQuiz && window.currentQuiz.word)) || "";
  if (!answer || answer.length < 2) {
    hintArea.textContent = "힌트를 제공할 수 없습니다.";
    return;
  }

  hintBtn.disabled = true;
  const hintStr = answer[0] + "  _  _  " + answer[3];
  hintArea.textContent = `힌트 : ${hintStr}`;

  hintTimeout && clearTimeout(hintTimeout);
  hintTimeout = setTimeout(() => {
    hintArea.textContent = "";
    hintBtn.disabled = false;
  }, 2000);
});

function clearHint() {
  hintArea.textContent = "";
  hintBtn.disabled = false;
}
window.clearHint = clearHint;
