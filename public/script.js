const ROWS = 6;
const COLS = 4;

let currentRow = 0;
let rowValues = Array.from({ length: ROWS }, () => "");

const board = document.getElementById("board");

// input 엘리먼트 생성 및 추가
const input = document.createElement("input");
input.type = "text";
input.maxLength = COLS;
input.autocomplete = "off";
input.autocapitalize = "off";
input.className = "hidden-input";
input.spellCheck = false;
board.appendChild(input);

// [새로 추가] 워들 판정 함수
function getCharStatuses(userAnswer, answer) {
    const result = [];
    const answerArr = answer.split('');
    const userArr = userAnswer.split('');
    const used = [false, false, false, false];
  
    // 정확히 맞는 곳 check
    for (let i = 0; i < 4; i++) {
      if (userArr[i] === answerArr[i]) {
        result[i] = { char: userArr[i], status: "correct" };
        used[i] = true;
      }
    }
    // 다른 위치에 포함
    for (let i = 0; i < 4; i++) {
      if (result[i]) continue;
      let found = false;
      for (let j = 0; j < 4; j++) {
        if (!used[j] && userArr[i] === answerArr[j]) {
          found = true;
          used[j] = true;
          break;
        }
      }
      result[i] = { char: userArr[i], status: found ? "present" : "absent" };
    }
    return result;
  }

// 포커스 관리: row 클릭 시 활성화
for (let i = 0; i < ROWS; i++) {
  const row = board.querySelector(`.wordle-row[data-row="${i}"]`);
  row.addEventListener("click", function () {
    if (i === currentRow && (typeof isQuizActive === "undefined" || isQuizActive)) input.focus();
  });
}

function updateRowDisplay(rowIdx) {
    const row = board.querySelector(`.wordle-row[data-row="${rowIdx}"]`);
    const boxes = row.querySelectorAll(".wordle-box");
    let val = rowValues[rowIdx] || "";
  
    // ⭐⭐⭐ 정답데이터 얻기(quiz.js에서 currentQuiz.word를 window.currentAnswer에 저장하는 게 BEST!)
    let answer = (window.currentAnswer || (window.currentQuiz && window.currentQuiz.word)) || "";
  
    // 색상 초기화
    for (let j = 0; j < COLS; j++) {
      boxes[j].classList.remove("correct", "present", "absent", "active", "filled");
    }
  
    // [줄 채점 및 색상] 이미 엔터로 확정된 줄(즉, currentRow 이전)이면 칠하기
    if (rowIdx < currentRow && val.length === COLS && answer.length === COLS) {
      const result = getCharStatuses(val, answer);
      for (let j = 0; j < COLS; j++) {
        boxes[j].textContent = val[j] ? val[j] : "";
        boxes[j].classList.add(result[j].status);
      }
    } else {
      // 아직 입력 중 or 입력 전: 기존 로직
      for (let j = 0; j < COLS; j++) {
        boxes[j].textContent = val[j] ? val[j] : "";
        if (j < val.length) boxes[j].classList.add("filled");
        if (rowIdx === currentRow && j === val.length && val.length < COLS) {
          boxes[j].classList.add("active");
        }
      }
      if (rowIdx === currentRow && val.length === COLS) {
        boxes.forEach((b) => b.classList.remove("active"));
      }
    }
  }
function updateBoard() {
  for (let i = 0; i < ROWS; i++) updateRowDisplay(i);
  updateActiveRow();
  input.value = rowValues[currentRow];
}
function updateActiveRow() {
  for (let i = 0; i < ROWS; i++) {
    const row = board.querySelector(`.wordle-row[data-row="${i}"]`);
    if (i === currentRow) {
      row.classList.add("active");
    } else {
      row.classList.remove("active");
    }
  }
}

// 입력(input) 동작
input.addEventListener("input", function () {
  let v = input.value;
  v = v.replace(/[^ㄱ-ㅎㅏ-ㅣ가-힣]/g, "");
  if (input.value !== v) input.value = v;
  rowValues[currentRow] = v;
  updateRowDisplay(currentRow);
});

input.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    if (!window.isQuizActive) return;
    rowValues[currentRow] = input.value;
    const answer = rowValues[currentRow];
    if (!answer || answer.length !== COLS) return;

    if (typeof checkQuizAnswer === "function") {
      const res = checkQuizAnswer(answer);

      if (res && res.done) {
        input.blur();
        input.value = "";
        return;
      } else {
        if (currentRow < ROWS - 1) {
          currentRow++;
          input.value = rowValues[currentRow] || "";
          updateBoard();
          setTimeout(() => input.focus(), 30);
        } else {
          if (typeof showQuizFail === "function") showQuizFail();
          input.blur();
        }
      }
    }
  }
  if (e.key === "Backspace") {
    rowValues[currentRow] = input.value;
    updateRowDisplay(currentRow);
  }
});

document.body.addEventListener("click", function (e) {
  const activeRow = board.querySelector(`.wordle-row[data-row="${currentRow}"]`);
  if (!activeRow.contains(e.target)) input.blur();
});

function resetBoard() {
  currentRow = 0;
  rowValues = Array.from({ length: ROWS }, () => "");
  input.value = "";
  updateBoard();
  setTimeout(() => input.focus(), 100);
}

updateBoard();
setTimeout(() => input.focus(), 100);

// --- [아래는 임시 정답판별 로직, 실제 구현 시 quiz.js 파일에서 import됨!] ---
window.isQuizActive = true;
window.checkQuizAnswer = async function(answer) {
  const response = await fetch("http://localhost:3000/check-answer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      answer,
      correctAnswer: window.currentAnswer
    })
  });

  const result = await response.json();

  let verdict = "";
  try {
    if(result && result.choices && result.choices[0] && result.choices[0].message) {
      verdict = result.choices[0].message.content.trim();
    }
  } catch(e) { verdict = ""; }

  if(verdict === "정답") {
    window.isQuizActive = false;
    document.getElementById("result-msg").textContent = "정답입니다!";
    applyWordleColors('🟩🟩🟩🟩', currentRow);
    return {correct:true, done:true};
  } else if(verdict === "입력이 올바르지 않습니다.") {
    document.getElementById("result-msg").textContent = verdict;
    return {correct:false, done:false};
  } else if(/^[🟩🟨⬜️]{4}$/.test(verdict)) {
    applyWordleColors(verdict, currentRow);
    document.getElementById("result-msg").textContent = "";
    return {correct:false, done:false};
  } else {
    document.getElementById("result-msg").textContent = "채점 중 오류가 발생했습니다!";
    return {correct:false, done:false};
  }
}

  
  // 한 줄(4자)에 wordle 색을 적용
  function applyWordleColors(verdict, rowIdx) {
    const row = board.querySelector(`.wordle-row[data-row="${rowIdx}"]`);
    const boxes = row.querySelectorAll(".wordle-box");
    for(let i=0;i<4;i++) {
      boxes[i].classList.remove("correct","present","absent");
      if(verdict[i] === '🟩') boxes[i].classList.add("correct");
      else if(verdict[i] === '🟨') boxes[i].classList.add("present");
      else boxes[i].classList.add("absent");
    }
  }

