import { evidenceUrl, type Analysis } from "./analyzer";

const labels = {
  found: "Encontrado",
  missing: "A melhorar",
  unknown: "Inconclusivo",
};
const escape = (value: string) =>
  value.replace(/[\\`*_{}\[\]<>#|]/g, "\\$&").replace(/[\r\n]+/g, " ");

export function toMarkdown(analysis: Analysis): string {
  const found = analysis.checks.filter(
    (check) => check.status === "found",
  ).length;
  return (
    [
      `# RepoCheck · ${escape(analysis.repository.fullName)}`,
      analysis.demo
        ? "Relatório de demonstração com dados fictícios."
        : `Repositório: ${analysis.repository.url}`,
      `Analisado em: ${analysis.analyzedAt}`,
      `${found} de ${analysis.checks.length} sinais encontrados. Este resumo não é uma classificação de qualidade.`,
      ...analysis.checks.map((check) =>
        [
          `## ${escape(check.title)} · ${labels[check.status]}`,
          escape(check.evidence),
          check.path && !analysis.demo
            ? `[Ver ficheiro](${evidenceUrl(analysis, check.path)})`
            : "",
          check.status !== "found"
            ? `Próximo passo: ${escape(check.suggestion)}`
            : "",
        ]
          .filter(Boolean)
          .join("\n\n"),
      ),
      "## Limitações",
      "Verificações heurísticas de nomes de ficheiros e títulos do README na branch predefinida. Não foi executado código nem verificado o resultado dos testes ou workflows. A presença de ficheiros não comprova a qualidade ou a suficiência do seu conteúdo.",
      analysis.truncated
        ? "A árvore devolvida pelo GitHub está incompleta. Ficheiros não encontrados foram marcados como inconclusivos."
        : "",
      "Gerado com [RepoCheck](https://github.com/Enzoramo/repocheck).",
    ]
      .filter(Boolean)
      .join("\n\n") + "\n"
  );
}
