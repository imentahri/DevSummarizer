# DevSummarizer — GitHub Repo Analyzer

Une application Full-Stack qui permet d'obtenir instantanément une fiche de lecture technique (stack, architecture estimée, niveau de complexité et cas d'usage) de n'importe quel dépôt GitHub public.

L'objectif de ce projet était de construire un outil capable d'ingérer et de synthétiser des données issues d'API tierces en optimisant le traitement des tokens envoyés au LLM.

## 🔗 Liens du projet
* **Démo en ligne :** [COLLE_TON_LIEN_VERCEL]
* **API Backend :** [COLLE_TON_LIEN_RENDER]

---

## 🛠️ Stack technique & Choix d'architecture

L'application est séparée en deux entités distinctes (découplage complet) pour faciliter le déploiement et la scalabilité :

* **Frontend :** React 18, TypeScript, Vite. Le style utilise Tailwind CSS pour une interface épurée en mode sombre natif.
* **Backend :** Node.js avec Express. Choisi pour sa gestion native de l'asynchronisme, idéal pour le chaînage d'API.
* **Services tiers :** API REST GitHub (intégration de l'API Commits) et Groq Cloud API (modèle ultra-rapide Llama 3 - llama3-8b-8192).

### Structure des dossiers

```text
devsummarizer/
├── backend/                  # Serveur Express (Node.js)
│   ├── src/
│   │   ├── index.js          # Point d'entrée, middlewares (CORS, JSON) et routing
│   │   ├── analyzer.js       # Orchestrateur du flux (GitHub -> LLM)
│   │   ├── github.js         # Consommation de l'API GitHub & logique de filtrage
│   │   └── llm.js            # Prompt engineering et interface Anthropic
├── frontend/                 # Application React / TypeScript (Vite)
│   ├── src/
│   │   ├── hooks/
│   │   │   └── useAnalysis.ts # Custom hook pour la gestion d'état de l'analyse
│   │   ├── components/       # Interface modulaire (UrlInput, Loader, Cards)
│   │   └── types/            # Typage strict des retours de l'API