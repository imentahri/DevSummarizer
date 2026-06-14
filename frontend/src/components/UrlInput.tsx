// components/UrlInput.tsx — Composant de saisie de l'URL GitHub

import { useState, type FormEvent } from 'react';

interface UrlInputProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

// Validation basique côté frontend pour un retour immédiat à l'utilisateur
// (le backend fait une validation plus complète)
function isValidGitHubUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname === 'github.com';
  } catch {
    return false;
  }
}

// Exemples de repos intéressants à tester — utile pour les recruteurs
const EXAMPLE_REPOS = [
  { label: 'React', url: 'https://github.com/facebook/react' },
  { label: 'FastAPI', url: 'https://github.com/tiangolo/fastapi' },
  { label: 'Next.js', url: 'https://github.com/vercel/next.js' },
];

export function UrlInput({ onSubmit, isLoading }: UrlInputProps) {
  const [url, setUrl] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();

    if (!trimmed) {
      setValidationError('Colle une URL GitHub ici.');
      return;
    }
    if (!isValidGitHubUrl(trimmed)) {
      setValidationError('L\'URL doit commencer par https://github.com/...');
      return;
    }

    setValidationError('');
    onSubmit(trimmed);
  };

  const fillExample = (exampleUrl: string) => {
    setUrl(exampleUrl);
    setValidationError('');
  };

  return (
    <div className="input-section">
      <form onSubmit={handleSubmit} className="url-form">
        <div className="input-wrapper">
          <span className="input-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
            </svg>
          </span>
          <input
            type="url"
            className={`url-input ${validationError ? 'url-input--error' : ''}`}
            placeholder="https://github.com/owner/repository"
            value={url}
            onChange={e => {
              setUrl(e.target.value);
              if (validationError) setValidationError('');
            }}
            disabled={isLoading}
            autoComplete="off"
            spellCheck={false}
            aria-label="URL du repo GitHub"
            aria-describedby={validationError ? 'url-error' : undefined}
          />
          <button
            type="submit"
            className="analyze-button"
            disabled={isLoading || !url.trim()}
            aria-label="Analyser le repo"
          >
            {isLoading ? (
              <span className="button-spinner" aria-hidden="true" />
            ) : (
              <>
                Analyser
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </div>

        {validationError && (
          <p id="url-error" className="validation-error" role="alert">
            {validationError}
          </p>
        )}
      </form>

      <div className="examples">
        <span className="examples-label">Essayer :</span>
        {EXAMPLE_REPOS.map(ex => (
          <button
            key={ex.url}
            className="example-chip"
            onClick={() => fillExample(ex.url)}
            disabled={isLoading}
            type="button"
          >
            {ex.label}
          </button>
        ))}
      </div>
    </div>
  );
}
