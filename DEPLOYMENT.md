# Deploying Academic Terms Explainer to Vercel

This application is fully configured for deployment on [Vercel](https://vercel.com) as a unified full-stack application (React Frontend + Serverless Node.js API).

---

## Method 1: Deploy via GitHub (Recommended)

### Step 1: Push Code to GitHub
If you haven't already pushed your code to GitHub:
```bash
git add .
git commit -m "Configure full-stack Vercel deployment"
git push origin main
```

### Step 2: Import into Vercel
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** → **Project**.
3. Select and import your GitHub repository (`Demo1` or your repo name).

### Step 3: Configure Project Settings
- **Framework Preset**: Other / Create React App (detected automatically)
- **Root Directory**: `./` (leave as default root)
- **Build Command**: Automatically handled by `vercel.json` and root `package.json`

### Step 4: Add Environment Variables
In the **Environment Variables** section, add your Gemini API key:
| Key | Value |
| --- | --- |
| `GEMINI_API_KEY` | *(Paste your Google Gemini API key from `server/.env`)* |

*(Firebase Authentication is already configured in the client and works automatically in production without additional server variables).*

### Step 5: Click Deploy
Click **Deploy**. Vercel will build the React application and deploy the serverless API. Once finished, your application will be live at `https://your-project.vercel.app`!

---

## Method 2: Deploy via Vercel CLI

1. **Install Vercel CLI globally**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from project root**:
   ```bash
   vercel
   ```
   Follow the CLI prompts (accept defaults).

4. **Add your Gemini API Key**:
   ```bash
   vercel env add GEMINI_API_KEY
   ```
   Select `Production`, `Preview`, and `Development`, and paste your key.

5. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

---

## How It Works Under the Hood
- **Frontend**: The React client is built into static assets via `@vercel/static-build` and served globally through Vercel's CDN.
- **Backend API**: The Express server is packaged into a high-performance Serverless Function at `api/index.js`.
- **Seamless Routing**: All `/api/*` requests route directly to the serverless function, while page loads and refreshes serve the single-page application smoothly with zero CORS complications.
