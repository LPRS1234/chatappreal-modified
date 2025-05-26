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

let time = 5;


// 새 문제 출제
function newQuiz() {
  time = 5;
  isGameActive = true;
  resultElem.textContent = '';
  exampleElem.textContent = ''; 
  if (window.clearHint) clearHint();

  // 5문제 풀었으면 종료
  if (gameCount >= MAX_GAME_COUNT) {
    meaningElem.textContent = `게임 종료! ${MAX_GAME_COUNT}문제를 모두 풀었습니다 😊`;
    nextBtn.style.display = "none";
    isQuizActive = false;

    // "다시 시작"을 표시하고 싶은 경우 아래처럼...
    nextBtn.textContent = "다시 시작";
    nextBtn.style.display = "inline-block";
    isGameActive = false
    resultElem.innerHTML = `맞춘것: ${correct}개, 틀린것: ${wrong}개`

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
  // 문제 카운트 증가
  

  // 랜덤 문제 선택
  // 중복 방지: 사용하지 않은 인덱스만 추출
  const unusedIdxs = idioms.map((_, i) => i).filter(i => !usedIdxs.includes(i));
  if (unusedIdxs.length === 0) {
    // 모든 문제가 출제된 경우 임시 예외 처리 (이론상 5회 제한이므로 안전)
    meaningElem.textContent = "출제 가능한 문제가 더 이상 없습니다!";
    isQuizActive = false;
    nextBtn.style.display = "none";
    return;
  }
  const randIdx = unusedIdxs[Math.floor(Math.random() * unusedIdxs.length)];
  usedIdxs.push(randIdx);
  const random = idioms[randIdx];
  currentQuiz = random;

  // 문제(뜻) 표시
  meaningElem.textContent = `[${gameCount} / ${MAX_GAME_COUNT}] ${random.meaning}`;
  isQuizActive = true;
  nextBtn.style.display = "none";

  window.currentAnswer = random.word; // ⭐ 반드시 할당!
}

// 정답 판정(워들 입력에서 한 줄 입력 Enter때 호출)
function checkQuizAnswer(answer) {
  if (!isQuizActive) return { correct: false, done: true };

  // 4글자가 아니면 스킵
  if (!answer || answer.length !== 4) return { correct: false, done: false };

  if (answer === currentQuiz.word) {
    // 정답
    correct++
    resultElem.textContent = "정답입니다! 🎉";
    resultElem.style.color = "green";
    exampleElem.textContent = "예문: " + currentQuiz.example;
    isQuizActive = false;
    isGameActive = false;
    nextBtn.style.display = "inline-block";
    return { correct: true, done: true };
  } else {
    // 오답
    // (틀릴 땐 바로 메시지 안 띄우고 마지막시도일 때만 안내)
    return { correct: false, done: false };
  }
}

// 마지막 시도(6번)까지 실패시 호출
function showQuizFail() {
  if (currentQuiz) {
    if (!isQuizActive) return;  
    resultElem.textContent = "오답입니다. 정답: " + currentQuiz.word;
    resultElem.style.color = "red";
    exampleElem.textContent = "예문: " + currentQuiz.example;
    wrong++
    isQuizActive = false;
    isGameActive = false;
    nextBtn.style.display = "inline-block";
  }
}

const timer = document.querySelector('.timer');

function decTime() {
    if (time >= 0 && isGameActive == true) {
        timer.innerText = `${time}s`
        time--;
    } else if (time < 0 && isGameActive == true && isQuizActive == true) {
        resultElem.innerText = "시간 초과! 정답: " + currentQuiz.word;
        resultElem.style.color = "red";
        exampleElem.innerText = `예문: ${currentQuiz.example}`
        isQuizActive = false;
        isGameActive = false;
        nextBtn.style.display = "inline-block"
        wrong++ 
    }
}

if(isGameActive == true) {
  setInterval(decTime, 1000)
}

nextBtn.onclick = function(){
  // 5문제가 끝난 후라면? → 카운트 및 버튼 문구 리셋
  if (gameCount >= MAX_GAME_COUNT) {
    gameCount = 0;
    competition.innerText="";
    usedIdxs = []; // ← 여기에 꼭 초기화!
    nextBtn.textContent = "다음 문제";
  } else {
    gameCount++;
    isGameActive = false
  }
  // 새 문제 출제 + 워들 UI 리셋 (script.js에서 resetBoard 함수 제공)
  newQuiz();
  typeof resetBoard === "function" && resetBoard();
}

window.addEventListener('DOMContentLoaded', newQuiz);

// 힌트 버튼 및 영역 DOM
const hintBtn = document.getElementById('hint-btn');
const hintArea = document.getElementById('hint-area');

let hintTimeout = null;

hintBtn.addEventListener('click', function() {
  // 정답어를 반드시 currentAnswer에서 가져오세요
  const answer = (window.currentAnswer || (window.currentQuiz && window.currentQuiz.word)) || "";
  if (!answer || answer.length < 2) {
    hintArea.textContent = "힌트를 제공할 수 없습니다.";
    return;
  }
  hintBtn.disabled = true; // 버튼 중복 방지(선택)
  // 첫글자, 마지막글자
  const hintStr = answer[0] + "  _  _  " + answer[3];
  hintArea.textContent = `힌트 : ${hintStr}`;
  // 2초 후 힌트 숨기기
  hintTimeout && clearTimeout(hintTimeout);
  hintTimeout = setTimeout(() => {
    hintArea.textContent = "";
    hintBtn.disabled = false;
  }, 2000);
});

// (새 문제시 힌트 초기화)
function clearHint() {
  hintArea.textContent = "";
  hintBtn.disabled = false;
}
// newQuiz에서 호출(quiz.js에서!)
window.clearHint = clearHint;