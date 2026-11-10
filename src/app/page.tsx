"use client";

import { useRef, useState, type FormEvent } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  BookOpen,
  Check,
  CheckCheck,
  ChevronDown,
  CircleHelp,
  ExternalLink,
  FileCode2,
  GitBranch,
  Github,
  Info,
  LoaderCircle,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { type Analysis, type Category, evidenceUrl } from "@/lib/analyzer";
import { demoAnalysis } from "@/lib/demo";
import { toMarkdown } from "@/lib/markdown";

const categories: (Category | "Tudo")[] = [
  "Tudo",
  "Documentação",
  "Colaboração",
  "Automação",
];
const statusLabels = {
  found: "Encontrado",
  missing: "A melhorar",
  unknown: "Inconclusivo",
};

export default function Home() {
  const [input, setInput] = useState("");
  const [analysis, setAnalysis] = useState<Analysis>(demoAnalysis);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [category, setCategory] = useState<Category | "Tudo">("Tudo");
  const [exported, setExported] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const resultRef = useRef<HTMLElement>(null);
  const found = analysis.checks.filter(
    (check) => check.status === "found",
  ).length;
  const missing = analysis.checks.filter(
    (check) => check.status === "missing",
  ).length;
  const unknown = analysis.checks.filter(
    (check) => check.status === "unknown",
  ).length;
  const visible = analysis.checks.filter(
    (check) => category === "Tudo" || check.category === category,
  );

  async function analyze(value: string) {
    if (loading) return;
    setInput(value);
    setLoading(true);
    setError("");
    setExported(false);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repository: value }),
        signal: AbortSignal.timeout(45_000),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.error || "Não foi possível analisar este repositório.",
        );
      setAnalysis(data as Analysis);
      setCategory("Tudo");
      requestAnimationFrame(() =>
        resultRef.current?.focus({ preventScroll: true }),
      );
    } catch (error) {
      setError(
        error instanceof Error && error.name !== "TimeoutError"
          ? error.message
          : "A análise demorou demasiado. Tenta novamente.",
      );
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void analyze(input);
  }

  function exportReport() {
    const url = URL.createObjectURL(
      new Blob([toMarkdown(analysis)], { type: "text/markdown;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `repocheck-${analysis.repository.fullName.replace("/", "-")}.md`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setExported(true);
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Saltar para o conteúdo
      </a>
      <aside className="sidebar" aria-label="Navegação principal">
        <a href="#main" className="brand" aria-label="RepoCheck, início">
          <span className="brand-mark">
            <CheckCheck size={23} strokeWidth={2.5} />
          </span>
          repo<span className="brand-light">check</span>
          <span className="beta">beta</span>
        </a>
        <div className="workspace-label">O teu espaço de trabalho</div>
        <nav>
          <a href="#main" className="nav-link active" aria-current="page">
            <Search size={18} />
            Analisar repositório
            <span className="nav-dot" />
          </a>
          <button
            className="nav-link"
            onClick={() => {
              setHelpOpen(true);
              document
                .getElementById("methodology")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <BookOpen size={18} />
            Como funciona
          </button>
        </nav>
        <div className="sidebar-bottom">
          <div className="open-source-note">
            <span className="note-icon">
              <GitBranch size={20} />
            </span>
            <strong>Construído em público.</strong>
            <p>
              Uma ferramenta aberta.
              <br />
              Um commit de cada vez.
            </p>
            <a
              href="https://github.com/Enzoramo/repocheck"
              target="_blank"
              rel="noreferrer"
            >
              Acompanha no GitHub <ExternalLink size={13} />
            </a>
          </div>
          <div className="sidebar-footer">
            <span className="status-dot" />
            Feito para quem constrói.
          </div>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <div>
            <span className="breadcrumb">Workspace</span>
            <span className="breadcrumb-slash">/</span>
            <span>Análise de repositório</span>
          </div>
          <a
            href="https://github.com/Enzoramo/repocheck"
            target="_blank"
            rel="noreferrer"
            className="source-link"
          >
            <Github size={17} />
            <span>Código aberto</span>
            <ExternalLink size={13} />
          </a>
        </header>
        <main id="main">
          <section className="intro" aria-labelledby="page-title">
            <div className="intro-copy">
              <h1 id="page-title">
                O teu próximo commit
                <br />
                pode fazer a diferença.
              </h1>
              <p>
                Descobre o que falta para tornar o teu repositório
                <br className="desktop-break" /> mais fácil de explorar,
                executar e receber contribuições.
              </p>
            </div>
            <div className="intro-illustration" aria-hidden="true">
              <div className="file-sheet">
                <div className="file-sheet-header">
                  <FileCode2 size={21} />
                  <span>repository.md</span>
                </div>
                <div className="illustration-line long" />
                <div className="illustration-line medium" />
                <div className="illustration-check">
                  <span>
                    <Check size={13} />
                  </span>
                  <i />
                </div>
                <div className="illustration-check">
                  <span>
                    <Check size={13} />
                  </span>
                  <i />
                </div>
                <div className="illustration-pending">
                  <span />
                  <i />
                </div>
              </div>
              <span className="floating-check">
                <CheckCheck size={29} />
              </span>
            </div>
          </section>

          <section
            className="analyze-panel"
            aria-label="Analisar um repositório"
          >
            <form onSubmit={submit}>
              <label htmlFor="repository">
                Começa com um repositório público
              </label>
              <div className={`input-row ${error ? "has-error" : ""}`}>
                <Github size={21} aria-hidden="true" />
                <input
                  id="repository"
                  name="repository"
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="github.com/dono/repositório"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  disabled={loading}
                  required
                  maxLength={300}
                  aria-describedby={error ? "input-error" : "input-hint"}
                  aria-invalid={!!error}
                />
                <button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <LoaderCircle size={17} className="spin" />A analisar…
                    </>
                  ) : (
                    <>
                      Analisar repositório
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </div>
              {error && (
                <p id="input-error" className="error" role="alert">
                  <Info size={16} />
                  {error}
                </p>
              )}
              <div className="input-bottom">
                <span id="input-hint">
                  <ShieldCheck size={14} />
                  Só leitura. O teu código fica no GitHub.
                </span>
                <span className="try-example">
                  Experimenta:{" "}
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => void analyze("Enzoramo/repocheck")}
                  >
                    este projeto
                  </button>
                  <span>ou</span>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => void analyze("vercel/next.js")}
                  >
                    vercel/next.js
                  </button>
                </span>
              </div>
            </form>
          </section>

          <section
            className={`report ${loading ? "report-loading" : ""}`}
            ref={resultRef}
            tabIndex={-1}
            aria-labelledby="report-title"
            aria-busy={loading}
          >
            <div className="report-heading">
              <div className="report-title-row">
                <h2 id="report-title">O que encontramos</h2>
                {analysis.demo && (
                  <span className="demo-badge">Demonstração</span>
                )}
              </div>
              <button
                className="export-button"
                onClick={exportReport}
                disabled={loading}
              >
                <ArrowDownToLine size={16} />
                {exported ? "Exportado" : "Exportar Markdown"}
              </button>
            </div>
            <div className="repository-line">
              <Github size={19} />
              <strong>{analysis.repository.fullName}</strong>
              {!analysis.demo && (
                <a
                  href={analysis.repository.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Abrir repositório no GitHub"
                >
                  <ExternalLink size={14} />
                </a>
              )}
              <span className="repository-language">
                <i />
                {analysis.repository.language ?? "Sem linguagem principal"}
              </span>
              {analysis.repository.archived && (
                <span className="demo-badge">Arquivado</span>
              )}
            </div>
            <p className="repository-description">
              {analysis.demo
                ? "Um exemplo fictício para explorares o relatório antes da primeira análise."
                : analysis.repository.description ||
                  "Este repositório ainda não tem uma descrição."}
            </p>

            <div className="summary-grid">
              <div className="summary-overview">
                <span className="summary-icon">
                  <CheckCheck size={22} />
                </span>
                <div>
                  <strong>
                    {found}
                    <span> / {analysis.checks.length}</span>
                  </strong>
                  <span>Sinais encontrados</span>
                </div>
                <div className="signal-bars" aria-hidden="true">
                  {analysis.checks.map((check) => (
                    <i key={check.id} className={check.status} />
                  ))}
                </div>
              </div>
              <div className="summary-item">
                <span className="metric-dot found" />
                <strong>{found}</strong>
                <span>Encontrados</span>
              </div>
              <div className="summary-item">
                <span className="metric-dot missing" />
                <strong>{missing}</strong>
                <span>A melhorar</span>
              </div>
              <div className="summary-item">
                <span className="metric-dot unknown" />
                <strong>{unknown}</strong>
                <span>Inconclusivos</span>
              </div>
            </div>
            <div className="report-note">
              <Info size={14} />
              <span>
                Sinais de preparação, sem uma nota de qualidade. Cada conclusão
                vem acompanhada de evidência.
              </span>
            </div>
            {analysis.truncated && (
              <p className="scan-warning" role="status">
                O GitHub devolveu uma árvore incompleta. As ausências foram
                marcadas como inconclusivas.
              </p>
            )}

            <div className="filter-bar">
              <div
                className="filters"
                role="group"
                aria-label="Filtrar verificações"
              >
                {categories.map((item) => (
                  <button
                    key={item}
                    aria-pressed={category === item}
                    onClick={() => setCategory(item)}
                  >
                    {item}
                    {item === "Tudo" && <span>{analysis.checks.length}</span>}
                  </button>
                ))}
              </div>
              <span className="check-count">{visible.length} verificações</span>
            </div>
            <div className="checks-list">
              {visible.map((check) => (
                <details className="check-item" key={check.id}>
                  <summary>
                    <span className={`check-icon ${check.status}`}>
                      {check.status === "found" ? (
                        <Check size={17} />
                      ) : check.status === "missing" ? (
                        <span className="small-dash" />
                      ) : (
                        <CircleHelp size={17} />
                      )}
                    </span>
                    <span className="check-label">
                      <strong>{check.title}</strong>
                      <span>{check.category}</span>
                    </span>
                    <span className={`check-status ${check.status}`}>
                      {statusLabels[check.status]}
                    </span>
                    <ChevronDown className="details-chevron" size={16} />
                  </summary>
                  <div className="check-detail">
                    <p>{check.evidence}</p>
                    {check.path && !analysis.demo && (
                      <a
                        href={evidenceUrl(analysis, check.path)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <FileCode2 size={14} />
                        {check.path}
                        <ExternalLink size={12} />
                      </a>
                    )}
                    {check.status !== "found" && (
                      <div className="suggestion">
                        <Sparkles size={16} />
                        <p>
                          <strong>Próximo passo</strong>
                          {check.suggestion}
                        </p>
                      </div>
                    )}
                  </div>
                </details>
              ))}
            </div>
            <div className="report-footer">
              <span>
                <GitBranch size={13} />
                Branch: {analysis.repository.branch}
              </span>
              <span>
                {analysis.demo
                  ? "Dados fictícios"
                  : `${analysis.fileCount.toLocaleString("pt-PT")} ${analysis.fileCount === 1 ? "ficheiro analisado" : "ficheiros analisados"}`}
              </span>
              <span role="status" className="sr-only">
                {loading
                  ? "A analisar o repositório."
                  : `${analysis.demo ? "Demonstração" : "Análise concluída"}: ${found} de ${analysis.checks.length} sinais encontrados. ${exported ? "Relatório exportado." : ""}`}
              </span>
            </div>
          </section>

          <section id="methodology" className="methodology">
            <button
              className="methodology-toggle"
              aria-expanded={helpOpen}
              aria-controls="methodology-content"
              onClick={() => setHelpOpen(!helpOpen)}
            >
              <span>
                <CircleHelp size={17} />O que é analisado?
              </span>
              <ChevronDown size={17} className={helpOpen ? "rotated" : ""} />
            </button>
            {helpOpen && (
              <div id="methodology-content" className="methodology-content">
                <p>
                  O RepoCheck lê a lista de ficheiros e o README da branch
                  predefinida através da API do GitHub. Procura nomes conhecidos
                  de documentação, testes, workflows e templates, além de
                  títulos de instalação no README.
                </p>
                <p>
                  Os resultados são heurísticos: um ficheiro presente pode estar
                  vazio ou desatualizado. Os testes e workflows não são
                  executados, e outras convenções de nomes podem não ser
                  reconhecidas. As instruções de instalação podem existir num
                  formato diferente.
                </p>
                <p>
                  Se a árvore estiver incompleta ou o README não puder ser lido,
                  a verificação correspondente fica inconclusiva. Esta versão
                  aceita apenas repositórios públicos e está sujeita aos limites
                  da API do GitHub.
                </p>
              </div>
            )}
          </section>
          <footer className="page-footer">
            <span>Um olhar de fora. Um projeto melhor.</span>
            <a
              href="https://github.com/Enzoramo/repocheck/issues"
              target="_blank"
              rel="noreferrer"
            >
              Tens uma sugestão?
              <ExternalLink size={12} />
            </a>
          </footer>
        </main>
      </div>
    </div>
  );
}
