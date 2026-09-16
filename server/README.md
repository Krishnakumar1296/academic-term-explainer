
# Term Explainer Backend (Together.ai)

## How to Run

1. Install dependencies:
```bash
npm install
```

2. Set your Together API key in `.env` file:
```
TOGETHER_API_KEY=your_real_key_here
```

3. Start the server:
```bash
npm start
```

API will run at: http://localhost:5000/explain

## Request Format (POST)
```json
{
  "term": "Photosynthesis",
  "grade": "6",
  "language": "Tamil"
}
```
