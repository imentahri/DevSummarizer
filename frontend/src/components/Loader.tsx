// components/Loader.tsx — Loader animé avec étapes

interface LoaderProps {
  step: string;
}

export function Loader({ step }: LoaderProps) {
  return (
    <div className="loader-container" role="status" aria-live="polite">
      <div className="loader-animation">
        <div className="loader-ring" />
        <div className="loader-ring loader-ring--delay1" />
        <div className="loader-ring loader-ring--delay2" />
      </div>
      <p className="loader-step">{step}</p>
      <p className="loader-hint">Cela prend 5 à 15 secondes selon la taille du repo.</p>
    </div>
  );
}
