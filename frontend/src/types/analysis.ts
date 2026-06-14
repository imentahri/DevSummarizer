// types/analysis.ts — Types TypeScript pour la réponse de l'API
//
// Pourquoi TypeScript ?
// TypeScript = JavaScript + types. On définit ici la "forme" (shape) des données
// que le backend va renvoyer. Si on fait une faute de frappe (result.satck au lieu
// de result.stack), TypeScript nous signale l'erreur AVANT d'exécuter le code.
// C'est comme un filet de sécurité pendant le développement.

export interface Stack {
  languages: string[];
  frameworks: string[];
  databases: string[];
  devops: string[];
  testing: string[];
}

export interface Architecture {
  pattern: string;
  description: string;
  entryPoints: string[];
}

export interface Complexity {
  level: 'Débutant' | 'Intermédiaire' | 'Avancé' | 'Expert';
  score: number; // 1-10
  rationale: string;
}

export interface RepoInfo {
  name: string;
  description: string | null;
  stars: number;
  forks: number;
  language: string | null;
  topics: string[];
  defaultBranch: string;
  size: number;
}

export interface AnalyzedFile {
  path: string;
  role: 'documentation' | 'dependencies' | 'configuration' | 'core-code';
}

export interface AnalysisMeta {
  repoUrl: string;
  repoInfo: RepoInfo;
  filesAnalyzed: AnalyzedFile[];
  analyzedAt: string;
  processingTimeSeconds: number;
}

export interface AnalysisResult {
  projectName: string;
  oneLiner: string;
  stack: Stack;
  architecture: Architecture;
  complexity: Complexity;
  useCases: string[];
  strengths: string[];
  suggestions: string[];
  targetAudience: string;
  meta: AnalysisMeta;
}

// Réponse complète de l'API
export interface ApiResponse {
  success: boolean;
  data: AnalysisResult;
}

export interface ApiError {
  error: string;
  message: string;
}
