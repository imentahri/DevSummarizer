

const { fetchRepoData } = require('./github');
const { callLLM } = require('./llm');

async function analyzeRepo(repoUrl) {
  console.log(`[Analyzer] Démarrage analyse : ${repoUrl}`);
  const start = Date.now();

  console.log('[Analyzer] Étape 1/2 : Récupération GitHub...');
  const repoData = await fetchRepoData(repoUrl);
  console.log(
    `[Analyzer] ${repoData.selectedFiles.length} fichiers sélectionnés sur ${repoData.totalFiles} total`
  );

  console.log('[Analyzer] Étape 2/2 : Analyse LLM...');
  const analysis = await callLLM(repoData);

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`[Analyzer] ✅ Analyse terminée en ${elapsed}s`);

  return {
    ...analysis,
    meta: {
      repoUrl,
      repoInfo: repoData.info,
      filesAnalyzed: repoData.selectedFiles.map(f => ({
        path: f.path,
        role: f.role,
      })),
      analyzedAt: new Date().toISOString(),
      processingTimeSeconds: parseFloat(elapsed),
    },
  };
}

module.exports = { analyzeRepo };
