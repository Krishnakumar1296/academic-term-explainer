import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ API Route (no MongoDB)
app.post("/explain", async (req, res) => {
  const { term, grade, language } = req.body;

  if (!term || !grade || !language) {
    return res.status(400).json({ error: "Please provide term, grade, and language" });
  }

  // Prompt for Together.ai
const prompt = `Explain the academic term "${term}" in simple ${language || 'Tamil'} with a definition and one real-world example for a grade ${grade || '6'} student.`;

  try {
    const response = await axios.post(
      "https://api.together.xyz/v1/chat/completions",
      {
        model: "mistralai/Mistral-7B-Instruct-v0.1",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const aiText = response.data.choices[0].message.content;
    res.json({ result: aiText });

  } catch (error) {
    console.error("❌ Together.ai Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to get explanation from Together.ai" });
  }
});

app.listen(5000, () => {
  console.log("✅ Backend server running at http://localhost:5000");
});
