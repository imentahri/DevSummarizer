const fetch = require('node-fetch');

class LLMError extends Error {
  constructor(message) {
    super(message);
    this.code = 'LLM_ERROR';
  }
}

function buildPrompt(repoData) {
  const { info, selectedFiles, totalFiles } = repoData;

  const systemPrompt = `Tu es un expert en ingénierie logicielle chargé d'analyser des projets GitHub.
Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ni après, sans balises markdown.

Structure JSON attendue :
{
  "projectName": "nom du projet",
  "oneLiner": "description en une phrase (max 120 caractères)",
  "stack": {
    "languages": [],
    "frameworks": [],
    "databases": [],
    "devops": [],
    "testing": []
  },
  "architecture": {
    "pattern": "ex: REST API, SPA, CLI Tool...",
    "description": "2-3 phrases",
    "entryPoints": []
  },
  "complexity": {
    "level": "Débutant | Intermédiaire | Avancé | Expert",
    "score": 5,
    "rationale": "justification courte"
  },
  "useCases": [],
  "strengths": [],
  "suggestions": [],
  "targetAudience": "Pour qui ?"
}`;

  const filesSection = selectedFiles
    .map(f => `=== ${f.path} (${f.role}) ===\n${f.content}`)
    .join('\n\n');

  const userPrompt = `Analyse ce projet GitHub :

Nom: ${info.name}
Description: ${info.description ?? 'Non renseignée'}
Langage principal: ${info.language ?? 'Inconnu'}
Topics: ${info.topics.join(', ') || 'Aucun'}
Stars: ${info.stars} | Forks: ${info.forks}
Fichiers totaux: ${totalFiles} | Fichiers analysés: ${selectedFiles.length}

${filesSection}

Génère le JSON d'analyse.`;

  return { systemPrompt, userPrompt };
}

async function callLLM(repoData) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new LLMError('Clé GROQ_API_KEY manquante dans .env');

  const { systemPrompt, userPrompt } = buildPrompt(repoData);

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama3-8b-8192',
      max_tokens: 1500,
      temperature: 0.3,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
    }),
  });

  if (res.status === 401) throw new LLMError('Clé Groq invalide.');
  if (res.status === 429) throw new LLMError('Limite Groq atteinte. Réessaie dans quelques instants.');
  if (!res.ok) throw new LLMError(`Erreur Groq : ${res.status}`);

  const json = await res.json();
  const rawText = json.choices?.[0]?.message?.content ?? '';

  const cleaned = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (parsed.complexity?.score) {
      parsed.complexity.score = Math.min(10, Math.max(1, Number(parsed.complexity.score)));
    }
    return parsed;
  } catch {
    throw new LLMError('Le LLM a renvoyé une réponse non-JSON. Réessaie.');
  }
}

module.exports = { callLLM };