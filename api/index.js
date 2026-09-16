import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const DEFAULT_GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

// In-memory store for search history
const historyStore = [];

const router = express.Router();

// 🩺 Health Check
router.get("/health", (req, res) => {
  res.json({
    status: "online",
    auth: "firebase_auth_client",
    ai: DEFAULT_GEMINI_API_KEY ? "gemini_api" : "unconfigured",
    timestamp: new Date().toISOString(),
  });
});

// Helper for delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 🧠 Live AI Explain Route (Powered by Gemini API with multi-model fallback)
router.post("/explain", async (req, res) => {
  const { term, grade, language, userId, apiKey } = req.body;

  if (!term || !grade || !language) {
    return res.status(400).json({ error: "Please provide term, grade, and language" });
  }

  const effectiveKey = (apiKey && typeof apiKey === "string" && apiKey.trim())
    ? apiKey.trim()
    : DEFAULT_GEMINI_API_KEY;

  if (!effectiveKey) {
    return res.status(503).json({
      error: "No Gemini API key configured. Please set GEMINI_API_KEY in Vercel Environment Variables or enter your key in settings.",
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

  // Active verified high-speed models with independent quotas
  const modelsToTry = [
    "gemini-3.6-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
  ];

  let explanationText = "";
  let lastError = null;
  let hitRateLimit = false;

  for (const model of modelsToTry) {
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${effectiveKey}`,
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
      const statusCode = err.response?.status;
      const errMsg = err.response?.data?.error?.message || err.message;
      console.warn(`Model ${model} failed (HTTP ${statusCode}):`, errMsg);

      if (statusCode === 429) {
        hitRateLimit = true;
        // Brief pause before trying fallback model to give quota bucket time to drain
        await delay(1000);
      }
    }
  }

  if (!explanationText) {
    console.error("Gemini API error after trying all models:", lastError?.response?.data || lastError?.message);

    if (hitRateLimit) {
      return res.status(429).json({
        error: "Google Gemini model rate limit reached (HTTP 429). Please wait a moment for the free quota to refresh, or enter your personal Gemini API key in Settings.",
      });
    }

    const detail = lastError?.response?.data?.error?.message || "Unable to reach Gemini AI service. Please try again.";
    return res.status(502).json({ error: detail });
  }

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

export default app;
