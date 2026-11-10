import { analyzeSnapshot, type Analysis, type Repository } from "./analyzer";
import { AnalysisError, parseRepository } from "./repository";

const API = "https://api.github.com";
const README_LIMIT = 200_000;
type Fetcher = typeof fetch;
type RepoResponse = {
  full_name: string;
  description: string | null;
  default_branch: string;
  stargazers_count: number;
  language: string | null;
  archived: boolean;
  private: boolean;
};
type TreeResponse = {
  tree: { path: string; type: string; size?: number; sha: string }[];
  truncated: boolean;
};

export async function analyzeRepository(
  input: string,
  fetcher: Fetcher = fetch,
): Promise<Analysis> {
  const { owner, name } = parseRepository(input);
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "RepoCheck",
  };
  if (process.env.GITHUB_TOKEN)
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  async function request(path: string, allowEmpty = false) {
    let response: Response;
    try {
      response = await fetcher(`${API}${path}`, {
        headers,
        signal: AbortSignal.timeout(12_000),
        cache: "no-store",
        redirect: "error",
      });
    } catch {
      throw new AnalysisError(
        "Não foi possível contactar o GitHub. Tenta novamente dentro de instantes.",
        502,
      );
    }
    if (response.status === 404)
      throw new AnalysisError(
        "Repositório não encontrado. Confirma o endereço e se o projeto é público.",
        404,
      );
    if (
      response.status === 429 ||
      (response.status === 403 &&
        (response.headers.get("x-ratelimit-remaining") === "0" ||
          response.headers.has("retry-after")))
    ) {
      throw new AnalysisError(
        "O limite de pedidos ao GitHub foi atingido. Aguarda e tenta novamente mais tarde.",
        429,
      );
    }
    if (!response.ok && !(allowEmpty && response.status === 409))
      throw new AnalysisError(
        "O GitHub não conseguiu fornecer os dados deste repositório. Tenta novamente mais tarde.",
        502,
      );
    return response;
  }
  const base = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
  const data = (await (await request(base)).json()) as RepoResponse;
  if (data.private)
    throw new AnalysisError(
      "Esta versão analisa apenas repositórios públicos.",
      400,
    );
  const repository: Repository = {
    fullName: data.full_name,
    description: data.description,
    url: `https://github.com/${data.full_name}`,
    branch: data.default_branch,
    stars: data.stargazers_count,
    language: data.language,
    archived: data.archived,
  };
  // GitHub returns 409 for an empty repository. Rounded repository size is not
  // reliable: a small, non-empty repository can also report zero.
  const treeResponse = await request(
    `${base}/git/trees/${encodeURIComponent(data.default_branch)}?recursive=1`,
    true,
  );
  const tree: TreeResponse =
    treeResponse.status === 409
      ? { tree: [], truncated: false }
      : await treeResponse.json();
  const files = tree.tree.filter((entry) => entry.type === "blob");
  const readmeFile = files
    .filter((file) =>
      /^(?:(?:\.github|docs)\/)?readme(?:\.(?:md|mdx|markdown|rst|txt))?$/i.test(
        file.path,
      ),
    )
    .sort(
      (a, b) =>
        a.path.split("/").length - b.path.split("/").length ||
        a.path.localeCompare(b.path),
    )[0];
  let readme: { path: string; content: string | null } | null = null;
  if (readmeFile) {
    readme = { path: readmeFile.path, content: null };
    if (readmeFile.size !== undefined && readmeFile.size <= README_LIMIT) {
      try {
        const blob = (await (
          await request(`${base}/git/blobs/${readmeFile.sha}`)
        ).json()) as { encoding: string; content: string; size: number };
        if (blob.encoding === "base64" && blob.size <= README_LIMIT)
          readme.content = Buffer.from(blob.content, "base64").toString("utf8");
      } catch (error) {
        if (error instanceof AnalysisError && error.status === 429) throw error;
        // A failed README read must remain unknown, rather than a missing section.
      }
    }
  }
  return analyzeSnapshot({
    repository,
    paths: files.map((file) => file.path),
    truncated: tree.truncated,
    readme,
  });
}
