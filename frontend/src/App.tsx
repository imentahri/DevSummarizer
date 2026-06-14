// App.tsx — Composant racine de l'application


import { useAnalysis } from './hooks/useAnalysis';
import { UrlInput } from './components/UrlInput';
import { Loader } from './components/Loader';
import { ErrorCard } from './components/ErrorCard';
import { AnalysisCard } from './components/AnalysisCard';

export default function App() {
  const { state, analyze, reset } = useAnalysis();

  return (
    <div className="app">
      {}
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">⟨/⟩</span>
            <span className="logo-text">DevSummarizer</span>
          </div>
          <p className="tagline">
            Colle un lien GitHub → reçois un résumé technique intelligent
          </p>
        </div>
      </header>

      <main className="app-main">

        {state.status !== 'success' && (
          <UrlInput
            onSubmit={analyze}
            isLoading={state.status === 'loading'}
          />
        )}

        {state.status === 'loading' && (
          <Loader step={state.step} />
        )}

        {state.status === 'error' && (
          <ErrorCard
            code={state.code}
            message={state.message}
            onRetry={reset}
          />
        )}

        {state.status === 'success' && (
          <AnalysisCard result={state.result} onReset={reset} />
        )}

        {state.status === 'idle' && (
          <div className="idle-screen">
            <div className="how-it-works">
              <div className="step-card">
                <span className="step-number">1</span>
                <span className="step-text">Colle l'URL d'un repo GitHub public</span>
              </div>
              <div className="step-arrow">→</div>
              <div className="step-card">
                <span className="step-number">2</span>
                <span className="step-text">Notre sélecteur intelligent choisit les bons fichiers</span>
              </div>
              <div className="step-arrow">→</div>
              <div className="step-card">
                <span className="step-number">3</span>
                <span className="step-text">Le LLM génère un résumé structuré</span>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        
      </footer>
    </div>
  );
}
