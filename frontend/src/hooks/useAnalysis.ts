// hooks/useAnalysis.ts — Custom React Hook


import { useState, useCallback } from 'react';
import type { AnalysisResult, ApiError } from '../types/analysis';


const API_BASE = import.meta.env.VITE_API_URL ?? '';

type AnalysisState =
  | { status: 'idle' }
  | { status: 'loading'; step: string }
  | { status: 'success'; result: AnalysisResult }
  | { status: 'error'; code: string; message: string };

export function useAnalysis() {
  const [state, setState] = useState<AnalysisState>({ status: 'idle' });

  const analyze = useCallback(async (repoUrl: string) => {
    setState({ status: 'loading', step: 'Connexion à GitHub...' });

    try {
      
      const progressSteps = [
        'Connexion à GitHub...',
        'Sélection intelligente des fichiers...',
        'Envoi au LLM...',
        'Génération du résumé...',
      ];

      let stepIndex = 0;
      const progressInterval = setInterval(() => {
        stepIndex = Math.min(stepIndex + 1, progressSteps.length - 1);
        setState({ status: 'loading', step: progressSteps[stepIndex] });
      }, 1800);

      const response = await fetch(`${API_BASE}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl }),
      });

      clearInterval(progressInterval);

      const json = await response.json();

      if (!response.ok) {
        const err = json as ApiError;
        setState({ status: 'error', code: err.error, message: err.message });
        return;
      }

      setState({ status: 'success', result: json.data as AnalysisResult });
    } catch (err) {
      setState({
        status: 'error',
        code: 'NETWORK_ERROR',
        message: 'Impossible de contacter le serveur. Est-il démarré ?',
      });
    }
  }, []);

  const reset = useCallback(() => {
    setState({ status: 'idle' });
  }, []);

  return { state, analyze, reset };
}
