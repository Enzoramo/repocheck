export type CheckStatus = "found" | "missing" | "unknown";
export type Category = "Documentação" | "Colaboração" | "Automação";

export interface Check {
  id: string;
  title: string;
  category: Category;
  status: CheckStatus;
  evidence: string;
  path?: string;
  suggestion: string;
}

export interface Repository {
  fullName: string;
  description: string | null;
  url: string;
  branch: string;
  stars: number;
  language: string | null;
  archived: boolean;
}

export interface Analysis {
  repository: Repository;
  checks: Check[];
  analyzedAt: string;
  truncated: boolean;
  fileCount: number;
  demo?: boolean;
}

export interface Snapshot {
  repository: Repository;
  paths: string[];
  truncated: boolean;
  readme: { path: string; content: string | null } | null;
}

function plainReadme(content: string) {
  return content
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/```[^\n]*\n[\s\S]*?```/g, "")
    .replace(/~~~[^\n]*\n[\s\S]*?~~~/g, "");
}

export function analyzeSnapshot(
  snapshot: Snapshot,
  now = new Date(),
): Analysis {
  const { paths, truncated, readme } = snapshot;
  const checks: Check[] = [];
  function fileCheck(
    id: string,
    title: string,
    category: Category,
    match: (path: string) => boolean,
    suggestion: string,
  ) {
    const path = paths.find(match);
    checks.push({
      id,
      title,
      category,
      status: path ? "found" : truncated ? "unknown" : "missing",
      path,
      evidence: path
        ? `Ficheiro encontrado: ${path}`
        : truncated
          ? "O GitHub devolveu uma árvore incompleta. Não é possível confirmar a ausência."
          : "Nenhum ficheiro correspondente foi encontrado na árvore analisada.",
      suggestion,
    });
  }
  checks.push({
    id: "readme",
    title: "Apresentação do projeto",
    category: "Documentação",
    status: readme ? "found" : truncated ? "unknown" : "missing",
    path: readme?.path,
    evidence: readme
      ? `README encontrado: ${readme.path}`
      : truncated
        ? "A árvore está incompleta; o README pode não ter sido incluído."
        : "Não foi encontrado um README na raiz, em docs/ ou em .github/.",
    suggestion:
      "Cria um README com o objetivo do projeto, uma imagem e um exemplo de utilização.",
  });
  const installHeading =
    readme?.content !== null &&
    readme?.content !== undefined &&
    /^#{1,6}\s+[^\n]*(?:install(?:ation|ing)?|instala[çc][aã]o|getting started|quick\s?start|come[çc]ar|configura[çc][aã]o|setup|set up|executar|running locally)[^\n]*$/im.test(
      plainReadme(readme.content),
    );
  const unreadable = !!readme && readme.content === null;
  checks.push({
    id: "installation",
    title: "Como executar localmente",
    category: "Documentação",
    status: installHeading
      ? "found"
      : unreadable || (!readme && truncated)
        ? "unknown"
        : "missing",
    path: installHeading ? readme?.path : undefined,
    evidence: installHeading
      ? `Secção de instalação ou arranque encontrada em ${readme?.path}. Os comandos não foram executados.`
      : unreadable
        ? "O README existe, mas o seu conteúdo não pôde ser lido integralmente."
        : "Não foi identificado um título de instalação ou arranque no README. As instruções podem usar outro formato.",
    suggestion:
      "Adiciona uma secção de instalação com requisitos, comandos e variáveis de ambiente.",
  });
  fileCheck(
    "license",
    "Licença de utilização",
    "Colaboração",
    (p) => /^(?:licen[cs]e|copying)(?:\.[^/]+)?$/i.test(p),
    "Adiciona uma licença adequada e explica como o código pode ser utilizado.",
  );
  fileCheck(
    "contributing",
    "Guia de contribuição",
    "Colaboração",
    (p) =>
      /^(?:(?:\.github|docs)\/)?contributing(?:\.(?:md|rst|txt))?$/i.test(p),
    "Cria um CONTRIBUTING.md com os passos para propor alterações e executar verificações.",
  );
  fileCheck(
    "tests",
    "Ficheiros de teste",
    "Automação",
    (p) =>
      /(?:^|\/)(?:__tests__|tests?|specs?)\/.*\.(?:[cm]?[jt]sx?|py|go|rs|rb|java|kt|swift|cs|php|exs?)$/i.test(
        p,
      ) ||
      /(?:\.(?:test|spec)\.[cm]?[jt]sx?$|(?:^|\/)test_[^/]+\.py$|_test\.(?:py|go|rs)$|Tests?\.swift$)/i.test(
        p,
      ),
    "Adiciona testes para os comportamentos principais e documenta como executá-los.",
  );
  fileCheck(
    "ci",
    "Integração contínua",
    "Automação",
    (p) =>
      /^\.github\/workflows\/[^/]+\.ya?ml$/i.test(p) ||
      /^(?:\.gitlab-ci\.yml|\.travis\.yml|azure-pipelines\.yml|Jenkinsfile|\.circleci\/config\.yml)$/.test(
        p,
      ),
    "Configura um workflow para verificar os tipos, executar os testes e construir a aplicação.",
  );
  fileCheck(
    "templates",
    "Templates para issues ou PRs",
    "Colaboração",
    (p) =>
      /^\.github\/(?:ISSUE_TEMPLATE\/(?!config\.ya?ml$)[^/]+\.(?:md|ya?ml)|(?:PULL_REQUEST_TEMPLATE|ISSUE_TEMPLATE)\.md|PULL_REQUEST_TEMPLATE\/[^/]+\.md)$/i.test(
        p,
      ),
    "Cria um template que peça contexto, passos para reproduzir e o resultado esperado.",
  );
  return {
    repository: snapshot.repository,
    checks,
    analyzedAt: now.toISOString(),
    truncated,
    fileCount: paths.length,
  };
}

export function evidenceUrl(analysis: Analysis, path: string) {
  return `${analysis.repository.url}/blob/${encodeURIComponent(analysis.repository.branch)}/${path.split("/").map(encodeURIComponent).join("/")}`;
}
