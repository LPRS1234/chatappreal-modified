// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// 📁 public 폴더에서 정적 파일 서빙 (index.html, script.js, style.css 등)
app.use(express.static(path.join(__dirname, "public")));

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ASSISTANT_ID = process.env.ASSISTANT_ID;

app.post("/check-answer", async (req, res) => {
  const { answer, correctAnswer } = req.body;

  try {
    const response = await fetch(`https://api.openai.com/v1/assistants/${ASSISTANT_ID}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: JSON.stringify({
              정답: correctAnswer,
              학생답: answer,
            }),
          },
        ],
      }),
    });

    const result = await response.json();
    res.json(result);
  } catch (err) {
    console.error("API 호출 실패:", err);
    res.status(500).json({ error: "API 호출 실패" });
  }
});

// 🔽 모든 기타 요청은 index.html로 fallback (SPA 대응용)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ 서버 실행 중: http://localhost:${PORT}`);
});
