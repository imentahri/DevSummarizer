require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { analyzeRepo } = require('./analyzer');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── CORS ────────────────────────────────────────────────────────────────────
// En dev : on accepte localhost:5173 (Vite). En prod : on lit FRONTEND_URL.
const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origine (Postman, tests curl...)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS bloqué pour l'origine : ${origin}`));
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── ROUTE PRINCIPALE ─────────────────────────────────────────────────────────
// POST /api/analyze
// Body: { repoUrl: "https://github.com/owner/repo" }
app.post('/api/analyze', async (req, res) => {
  const { repoUrl } = req.body;

  if (!repoUrl || typeof repoUrl !== 'string') {
    return res.status(400).json({
      error: 'INVALID_INPUT',
      message: 'Fournis une URL GitHub valide dans le champ "repoUrl".',
    });
  }

  try {
    const result = await analyzeRepo(repoUrl.trim());
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[/api/analyze] Erreur :', err.message);

    // On mappe les erreurs métier vers des codes HTTP lisibles
    const errorMap = {
      INVALID_URL:       400,
      REPO_NOT_FOUND:    404,
      REPO_PRIVATE:      403,
      REPO_EMPTY:        422,
      GITHUB_RATE_LIMIT: 429,
      LLM_ERROR:         502,
    };

    const status = errorMap[err.code] ?? 500;
    res.status(status).json({
      error: err.code ?? 'INTERNAL_ERROR',
      message: err.message ?? 'Une erreur inconnue est survenue.',
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ DevSummarizer backend démarré sur http://localhost:${PORT}`);
});
