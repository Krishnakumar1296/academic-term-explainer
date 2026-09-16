import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

if (GEMINI_API_KEY) {
  console.log("✨ Google Gemini API is configured.");
} else {
  console.warn("⚠️ GEMINI_API_KEY is missing in .env.");
}

// Memory store for search history
const historyStore = [];

const router = express.Router();

// 🩺 Health Check
router.get("/health", (req, res) => {
  res.json({
    status: "online",
    auth: "firebase_auth_client",
    ai: GEMINI_API_KEY ? "gemini_api" : "unconfigured",
    timestamp: new Date().toISOString(),
  });
});

// 🧠 Live AI Explain Route (Powered by Gemini API)
router.post("/explain", async (req, res) => {
  const { term, grade, language, userId } = req.body;

  if (!term || !grade || !language) {
    return res.status(400).json({ error: "Please provide term, grade, and language" });
  }

  if (!GEMINI_API_KEY) {
    return res.status(503).json({
      error: "Gemini API key is not configured on the server. Please set GEMINI_API_KEY in server/.env.",
    });
  }

  const effectiveUserId = userId || "guest_user";
  const prompt = `You are an expert, encouraging academic educator.
Explain the academic concept "${term}" tailored specifically for a Grade ${grade} student.
Provide the entire explanation in ${language}.

Format your response clearly using these sections:
📌 **Simple Definition:** (2-3 clear, easily understandable sentences tailored for grade ${grade})
💡 **Everyday Analogy:** (A vivid, relatable comparison to daily life that a grade ${grade} student connects with)
🚀 **Real-World Application:** (An actual practical demonstration, experiment, or real-life example)
🎯 **Key Takeaways:** (2-3 crisp bullet points with the core facts to remember)

Keep the tone positive, academic, and engaging.`;

  // Try gemini-3.6-flash, fallback to gemini-flash-latest if needed
  const modelsToTry = [
    "gemini-3.6-flash",
    "gemini-flash-latest",
    "gemini-2.5-flash-lite",
  ];

  let explanationText = "";
  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          },
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 20000,
        }
      );

      const candidate = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (candidate) {
        explanationText = candidate;
        break;
      }
    } catch (err) {
      lastError = err;
      console.warn(`Model ${model} call failed:`, err.response?.data?.error?.message || err.message);
    }
  }

  if (!explanationText) {
    console.error("Gemini API error:", lastError?.response?.data || lastError?.message);
    const detail = lastError?.response?.data?.error?.message || "Unable to reach Gemini AI service.";
    return res.status(502).json({ error: detail });
  }

  // Persist to history store
  const historyItem = {
    _id: "hist_" + Math.random().toString(36).substring(2, 9),
    userId: effectiveUserId,
    term: term.trim(),
    grade: grade.toString().trim(),
    language: language.trim(),
    result: explanationText,
    createdAt: new Date().toISOString(),
  };
  historyStore.unshift(historyItem);

  res.json({
    result: explanationText,
    term: term.trim(),
    grade,
    language,
    id: historyItem._id,
  });
});

// 📚 History Routes
router.get("/history/:userId", (req, res) => {
  const { userId } = req.params;
  const { q } = req.query;

  let list = historyStore.filter((h) => h.userId === userId);

  if (q && typeof q === "string" && q.trim()) {
    const s = q.trim().toLowerCase();
    list = list.filter(
      (h) =>
        h.term.toLowerCase().includes(s) ||
        h.grade.toLowerCase().includes(s) ||
        h.language.toLowerCase().includes(s) ||
        h.result.toLowerCase().includes(s)
    );
  }

  res.json({ history: list });
});

router.delete("/history/:id", (req, res) => {
  const { id } = req.params;
  const idx = historyStore.findIndex((h) => h._id === id);
  if (idx !== -1) historyStore.splice(idx, 1);
  res.json({ message: "Item deleted successfully", id });
});

router.delete("/history/clear/:userId", (req, res) => {
  const { userId } = req.params;
  for (let i = historyStore.length - 1; i >= 0; i--) {
    if (historyStore[i].userId === userId) {
      historyStore.splice(i, 1);
    }
  }
  res.json({ message: "History cleared successfully" });
});

// Mount router on both /api and root /
app.use("/api", router);
app.use("/", router);

// 🏁 Start Server if not imported as module
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Academic Terms Explainer backend running at http://localhost:${PORT}`);
});

export default app;
