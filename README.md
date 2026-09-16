# 🎓 Academic Terms Explainer

> A full-stack, adaptive educational web application designed to help students, educators, and lifelong learners master complex academic terminology, scientific theories, and formulas.

Powered by **Google Gemini AI** and configured for **Vercel** serverless deployment.

---

## ✨ Key Features

- **🎒 Adaptive Grade-Level Tailoring**: Calibrates explanations, vocabulary, and conceptual depth for 4 distinct academic levels:
  - Elementary (Grades 1–5)
  - Middle School (Grades 6–8)
  - High School (Grades 9–12)
  - Higher Education (College & Advanced)
- **🌍 Multi-Language Learning**: Explanations available in **English**, **Tamil (தமிழ்)**, **Spanish (Español)**, **Hindi (हिन्दी)**, **French (Français)**, **German (Deutsch)**, and **Japanese (日本語)**.
- **Structured 4-Pillar Pedagogical Breakdown**:
  1. 📌 **Simple Definition**: Clear, age-appropriate overview.
  2. 💡 **Everyday Analogy**: Relatable daily life comparisons.
  3. 🚀 **Real-World Application**: Practical demonstrations and real-world importance.
  4. 🎯 **Key Takeaways**: Crisp summary bullet points for fast recall.
- **🔊 Native Audio Narration**: Built-in multi-language Speech Synthesis to listen to explanations naturally.
- **📄 PDF Study Sheet Export**: Download formatted, print-ready study notes via `jspdf`.
- **🔐 Firebase Authentication**: Google One-Tap / Sign-In and Email/Password registration.
- **📚 Search History & Quick Modifiers**: Locally persisted and session-based history management.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vanilla CSS (Modern Light Academic Design System), jsPDF, Web Speech API
- **Authentication**: Firebase Authentication (Client-side)
- **Backend**: Node.js, Express.js
- **AI Engine**: Google Gemini API (`gemini-3.6-flash`)
- **Deployment**: Vercel (Unified Static Build + Serverless Function)

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18 or later)
- Google Gemini API Key ([Get one here](https://aistudio.google.com/))

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/Krishnakumar1296/academic-term-explainer.git
cd academic-term-explainer

# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

### 3. Environment Variables
Create a `.env` file in the `server/` directory:
```env
PORT=5000
GEMINI_API_KEY=your_google_gemini_api_key_here
```

### 4. Running Locally
In one terminal, start the backend server:
```bash
cd server
npm start
```

In a second terminal, start the React client:
```bash
cd client
npm start
```
The app will open automatically at [http://localhost:3000](http://localhost:3000).

---

## ☁️ Deployment on Vercel

This repository includes a pre-configured `vercel.json` and `api/index.js` for instant Vercel deployment:

1. Push your repository to GitHub.
2. Import the project into your [Vercel Dashboard](https://vercel.com).
3. Add the Environment Variable in Vercel:
   - `GEMINI_API_KEY`: *(Your Google Gemini API Key)*
4. Click **Deploy**. Vercel will build the frontend and deploy the serverless API automatically.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full deployment details.

---

## 📄 License
MIT License. Feel free to clone, star, and contribute!
