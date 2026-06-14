import { useState } from 'react';
import type { AnalysisResult } from '../types/analysis';
import { formatSummaryAsMarkdown } from '../utils/formatSummary';

interface AnalysisCardProps {
  result: AnalysisResult;
  onReset: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  documentation: 'doc',
  dependencies: 'deps',
  configuration: 'config',
  'core-code': 'code',
};

function repoPath(url: string): string {
  try {
    return new URL(url).pathname.replace(/^\//, '');
  } catch {
    return url;
  }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="result-section">
      <h3 className="section-title">{title}</h3>
      {children}
    </section>
  );
}

function StackRow({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="stack-row">
      <span className="stack-row-label">{label}</span>
      <span className="stack-row-value">{items.join(', ')}</span>
    </div>
  );
}

export function AnalysisCard({ result, onReset }: AnalysisCardProps) {
  const { meta } = result;
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const topics = meta.repoInfo.topics?.slice(0, 6) ?? [];
  const levelClass = result.complexity.level
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatSummaryAsMarkdown(result));
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch {
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  return (
    <article className="result-card">
      <header className="result-header">
        <div className="result-header-main">
          <p className="result-repo-path">
            <a href={meta.repoUrl} target="_blank" rel="noopener noreferrer">
              {repoPath(meta.repoUrl)}
            </a>
          </p>
          <h2 className="project-name">{result.projectName}</h2>
          <p className="project-oneliner">{result.oneLiner}</p>

          <ul className="result-meta-list">
            <li>
              <span className="result-meta-k">Stars</span>
              <span className="result-meta-v">{meta.repoInfo.stars.toLocaleString()}</span>
            </li>
            <li>
              <span className="result-meta-k">Forks</span>
              <span className="result-meta-v">{meta.repoInfo.forks.toLocaleString()}</span>
            </li>
            <li>
              <span className="result-meta-k">Complexité</span>
              <span className={`result-meta-v complexity-level complexity-level--${levelClass}`}>
                {result.complexity.score}/10 · {result.complexity.level}
              </span>
            </li>
          </ul>

          {topics.length > 0 && (
            <ul className="repo-topics" aria-label="Topics GitHub">
              {topics.map(topic => (
                <li key={topic} className="repo-topic">{topic}</li>
              ))}
            </ul>
          )}

          <p className="target-audience">{result.targetAudience}</p>
        </div>
      </header>

      <div className="result-body">
        <Section title="Stack">
          <div className="stack-rows">
            <StackRow label="Langages" items={result.stack.languages} />
            <StackRow label="Frameworks" items={result.stack.frameworks} />
            <StackRow label="Bases de données" items={result.stack.databases} />
            <StackRow label="DevOps" items={result.stack.devops} />
            <StackRow label="Tests" items={result.stack.testing} />
          </div>
        </Section>

        <Section title="Architecture">
          <p className="arch-lead">
            <code className="arch-pattern">{result.architecture.pattern}</code>
          </p>
          <p className="arch-description">{result.architecture.description}</p>
          {result.architecture.entryPoints.length > 0 && (
            <div className="entry-points">
              <span className="entry-points-label">Points d'entrée</span>
              <ul className="entry-points-list">
                {result.architecture.entryPoints.map(ep => (
                  <li key={ep}><code>{ep}</code></li>
                ))}
              </ul>
            </div>
          )}
        </Section>

        <Section title="Complexité">
          <p className="complexity-summary">
            Niveau <strong>{result.complexity.level}</strong> — score{' '}
            <strong>{result.complexity.score}</strong> sur 10.
          </p>
          <p className="complexity-rationale">{result.complexity.rationale}</p>
        </Section>

        <Section title="Cas d'usage">
          <ul className="plain-list">
            {result.useCases.map((uc, i) => (
              <li key={i}>{uc}</li>
            ))}
          </ul>
        </Section>

        <div className="result-columns">
          <Section title="Points forts">
            <ul className="plain-list plain-list--accent">
              {result.strengths.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </Section>
          <Section title="Suggestions">
            <ul className="plain-list">
              {result.suggestions.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </Section>
        </div>
      </div>

      <details className="meta-details">
        <summary className="meta-summary">
          {meta.filesAnalyzed.length} fichiers analysés en {meta.processingTimeSeconds}s
        </summary>
        <div className="meta-content">
          <ul className="analyzed-files">
            {meta.filesAnalyzed.map(f => (
              <li key={f.path} className="analyzed-file">
                <span className="file-role-badge">{ROLE_LABELS[f.role] ?? f.role}</span>
                <code>{f.path}</code>
              </li>
            ))}
          </ul>
        </div>
      </details>

      <footer className="result-actions">
        <button className="new-analysis-button" onClick={onReset}>
          Nouvelle analyse
        </button>
        <button
          type="button"
          className="copy-summary-button"
          onClick={handleCopy}
          aria-live="polite"
        >
          {copyStatus === 'copied' ? 'Copié' : copyStatus === 'error' ? 'Échec' : 'Copier'}
        </button>
        <a
          href={meta.repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="view-repo-link"
        >
          Ouvrir sur GitHub
        </a>
      </footer>
    </article>
  );
}
