// components/ErrorCard.tsx — Affichage des erreurs avec messages utiles

interface ErrorCardProps {
  code: string;
  message: string;
  onRetry: () => void;
}

const ERROR_HINTS: Record<string, string> = {
  INVALID_URL: 'Exemple valide : https://github.com/facebook/react',
  REPO_NOT_FOUND: 'Vérifie l\'orthographe de l\'URL. Le repo existe-t-il encore ?',
  REPO_PRIVATE: 'DevSummarizer ne peut analyser que les repos publics.',
  REPO_EMPTY: 'Ce repo ne contient pas encore de fichiers à analyser.',
  GITHUB_RATE_LIMIT: 'L\'API GitHub gratuite est limitée à 60 requêtes/heure. Réessaie plus tard.',
  LLM_ERROR: 'Problème de connexion au service d\'analyse. Réessaie dans quelques instants.',
  NETWORK_ERROR: 'Le serveur backend n\'est peut-être pas démarré. Vérifie que tu as lancé `npm run dev` dans /backend.',
};

export function ErrorCard({ code, message, onRetry }: ErrorCardProps) {
  const hint = ERROR_HINTS[code];

  return (
    <div className="error-card" role="alert">
      <div className="error-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <div className="error-content">
        <p className="error-message">{message}</p>
        {hint && <p className="error-hint">{hint}</p>}
        <code className="error-code">{code}</code>
      </div>
      <button className="retry-button" onClick={onRetry}>
        Réessayer
      </button>
    </div>
  );
}
