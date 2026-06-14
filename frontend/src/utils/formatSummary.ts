import type { AnalysisResult } from '../types/analysis';

function bulletList(items: string[]): string {
  return items.map(item => `- ${item}`).join('\n');
}

/** Formate le résultat en Markdown pour le presse-papiers. Fonction pure, sans effet de bord. */
export function formatSummaryAsMarkdown(result: AnalysisResult): string {
  const { meta } = result;
  const lines: string[] = [
    `# ${result.projectName}`,
    '',
    result.oneLiner,
    '',
    `**Repo :** ${meta.repoUrl}`,
    `**Stars :** ${meta.repoInfo.stars.toLocaleString()} · **Forks :** ${meta.repoInfo.forks.toLocaleString()}`,
    `**Complexité :** ${result.complexity.level} (${result.complexity.score}/10)`,
    '',
    `## Public cible`,
    result.targetAudience,
  ];

  const stackParts: string[] = [];
  if (result.stack.languages.length) stackParts.push(`- Langages : ${result.stack.languages.join(', ')}`);
  if (result.stack.frameworks.length) stackParts.push(`- Frameworks : ${result.stack.frameworks.join(', ')}`);
  if (result.stack.databases.length) stackParts.push(`- Bases de données : ${result.stack.databases.join(', ')}`);
  if (result.stack.devops.length) stackParts.push(`- DevOps : ${result.stack.devops.join(', ')}`);
  if (result.stack.testing.length) stackParts.push(`- Tests : ${result.stack.testing.join(', ')}`);

  if (stackParts.length) {
    lines.push('', '## Stack technique', ...stackParts);
  }

  lines.push(
    '',
    '## Architecture',
    `**${result.architecture.pattern}**`,
    result.architecture.description,
  );

  if (result.architecture.entryPoints.length) {
    lines.push('', 'Points d\'entrée :', ...result.architecture.entryPoints.map(ep => `- \`${ep}\``));
  }

  lines.push(
    '',
    '## Complexité',
    result.complexity.rationale,
    '',
    '## Cas d\'usage',
    bulletList(result.useCases),
    '',
    '## Points forts',
    bulletList(result.strengths),
    '',
    '## Suggestions',
    bulletList(result.suggestions),
  );

  return lines.join('\n');
}
