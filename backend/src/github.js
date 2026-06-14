/**
 * github.js — Service d'accès à l'API GitHub
 */

const fetch = require('node-fetch');

const GITHUB_API = 'https://api.github.com';

// Erreur personnalisée avec un code métier, pour que index.js puisse
// retourner le bon status HTTP sans connaître les détails de GitHub.
class GitHubError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}



function parseGitHubUrl(url) {
  try {
    const { hostname, pathname } = new URL(url);
    if (hostname !== 'github.com') {
      throw new GitHubError('INVALID_URL', 'L\'URL doit pointer vers github.com.');
    }
    const parts = pathname
      .replace(/\.git$/, '')   // supprime le .git final
      .replace(/\/$/, '')       // supprime le slash final
      .split('/')
      .filter(Boolean);

    if (parts.length < 2) {
      throw new GitHubError('INVALID_URL', 'L\'URL doit avoir la forme github.com/owner/repo.');
    }
    return { owner: parts[0], repo: parts[1] };
  } catch (err) {
    if (err.code) throw err;
    throw new GitHubError('INVALID_URL', 'URL invalide. Exemple : https://github.com/facebook/react');
  }
}


function buildHeaders() {
  const headers = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'DevSummarizer/1.0',
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

async function githubFetch(path) {
  const res = await fetch(`${GITHUB_API}${path}`, { headers: buildHeaders() });

  if (res.status === 404) {
    throw new GitHubError('REPO_NOT_FOUND', 'Repo introuvable. Vérifie l\'URL ou que le repo est public.');
  }
  if (res.status === 403) {
    const remaining = res.headers.get('x-ratelimit-remaining');
    if (remaining === '0') {
      throw new GitHubError('GITHUB_RATE_LIMIT', 'Limite GitHub atteinte (60 req/h sans token). Réessaie dans une heure.');
    }
    throw new GitHubError('REPO_PRIVATE', 'Ce repo est privé ou l\'accès est refusé.');
  }
  if (!res.ok) {
    throw new GitHubError('GITHUB_ERROR', `Erreur GitHub : ${res.status} ${res.statusText}`);
  }

  return res.json();
}

async function getRepoInfo(owner, repo) {
  const data = await githubFetch(`/repos/${owner}/${repo}`);
  return {
    name: data.name,
    description: data.description,
    stars: data.stargazers_count,
    forks: data.forks_count,
    language: data.language,
    topics: data.topics ?? [],
    defaultBranch: data.default_branch,
    size: data.size, // en KB
  };
}


async function getFileContent(owner, repo, filePath, maxBytes = 8000) {
  try {
    const data = await githubFetch(`/repos/${owner}/${repo}/contents/${filePath}`);

    
    const content = Buffer.from(data.content, 'base64').toString('utf8');

    if (content.length <= maxBytes) return content;

    const truncated = content.substring(0, maxBytes);
    const lastNewline = truncated.lastIndexOf('\n');
    return (lastNewline > maxBytes * 0.8 ? truncated.substring(0, lastNewline) : truncated)
      + '\n\n... [fichier tronqué pour respecter la fenêtre de contexte LLM]';
  } catch (err) {
    if (err.code === 'REPO_NOT_FOUND') return null; 
    throw err;
  }
}

async function getRepoTree(owner, repo, branch) {
  try {
    const data = await githubFetch(
      `/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`
    );
    if (data.truncated) {
      console.warn('[GitHub] Arborescence tronquée par GitHub (repo très large).');
    }
    return data.tree
      .filter(item => item.type === 'blob')
      .map(item => item.path);
  } catch {
    return [];
  }
}

async function getMostChangedFiles(owner, repo, limit = 5) {
  try {
    const commits = await githubFetch(
      `/repos/${owner}/${repo}/commits?per_page=30`
    );

    const fileChangeCounts = {};

    
    const detailPromises = commits.slice(0, 10).map(c =>
      githubFetch(`/repos/${owner}/${repo}/commits/${c.sha}`)
        .then(detail => {
          (detail.files ?? []).forEach(f => {
            fileChangeCounts[f.filename] = (fileChangeCounts[f.filename] ?? 0) + 1;
          });
        })
        .catch(() => {}) 
    );

    await Promise.all(detailPromises);

    return Object.entries(fileChangeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([path]) => path);
  } catch {
    return [];
  }
}


async function smartFilePicker(owner, repo, branch, allFiles) {
  const collected = []; 
  const MAX_TOTAL_CHARS = 24000; 
  let usedChars = 0;

  const addFile = async (path, role, maxBytes = 6000) => {
    if (usedChars >= MAX_TOTAL_CHARS) return;
    const content = await getFileContent(owner, repo, path, maxBytes);
    if (!content) return;
    usedChars += content.length;
    collected.push({ path, content, role });
  };

  const readmePath = allFiles.find(f =>
    /^readme\.md$/i.test(f) || /^readme$/i.test(f)
  );
  if (readmePath) await addFile(readmePath, 'documentation', 8000);

  const depFiles = [
    'package.json', 'requirements.txt', 'pom.xml', 'build.gradle',
    'Cargo.toml', 'go.mod', 'Gemfile', 'composer.json', 'pyproject.toml',
  ];
  for (const dep of depFiles) {
    const found = allFiles.find(f => f === dep || f.endsWith(`/${dep}`));
    if (found) {
      await addFile(found, 'dependencies', 4000);
      break; 
    }
  }

  const configFiles = [
    'docker-compose.yml', 'Dockerfile', '.env.example',
    'nginx.conf', 'webpack.config.js', 'vite.config.ts', 'tsconfig.json',
  ];
  for (const cfg of configFiles) {
    const found = allFiles.find(f => f === cfg || f.endsWith(`/${cfg}`));
    if (found && usedChars < MAX_TOTAL_CHARS * 0.6) {
      await addFile(found, 'configuration', 2000);
    }
  }

  if (usedChars < MAX_TOTAL_CHARS * 0.8) {
    const hotFiles = await getMostChangedFiles(owner, repo, 5);
    const alreadyAdded = new Set(collected.map(f => f.path));
    const codeExtensions = /\.(js|ts|jsx|tsx|py|java|go|rb|php|rs|cs|cpp|c|vue|svelte)$/i;

    for (const filePath of hotFiles) {
      if (alreadyAdded.has(filePath)) continue;
      if (!codeExtensions.test(filePath)) continue;
      if (usedChars >= MAX_TOTAL_CHARS) break;
      await addFile(filePath, 'core-code', 4000);
    }
  }

  return collected;
}


async function fetchRepoData(repoUrl) {
  const { owner, repo } = parseGitHubUrl(repoUrl);
  const info = await getRepoInfo(owner, repo);

  if (info.size === 0) {
    throw new GitHubError('REPO_EMPTY', 'Ce repo est vide, rien à analyser.');
  }

  const allFiles = await getRepoTree(owner, repo, info.defaultBranch);

  if (allFiles.length === 0) {
    throw new GitHubError('REPO_EMPTY', 'Impossible de lire l\'arborescence du repo.');
  }

  const selectedFiles = await smartFilePicker(owner, repo, info.defaultBranch, allFiles);

  return { info, selectedFiles, totalFiles: allFiles.length };
}

module.exports = { fetchRepoData, parseGitHubUrl };
