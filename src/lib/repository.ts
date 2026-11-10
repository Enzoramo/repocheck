export class AnalysisError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
    this.name = "AnalysisError";
  }
}

export function parseRepository(input: string): {
  owner: string;
  name: string;
} {
  const trimmed = input.trim();
  const value = /^github\.com\//i.test(trimmed)
    ? `https://${trimmed}`
    : trimmed;
  let path = value;
  if (/^https?:\/\//i.test(value)) {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw new AnalysisError("Introduz um endereço GitHub válido.");
    }
    if (
      url.protocol !== "https:" ||
      url.hostname !== "github.com" ||
      url.port ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    ) {
      throw new AnalysisError(
        "Usa um endereço HTTPS do github.com, sem parâmetros.",
      );
    }
    path = url.pathname.replace(/^\//, "");
  }
  const parts = path
    .replace(/\/$/, "")
    .replace(/\.git$/, "")
    .split("/");
  if (
    parts.length !== 2 ||
    !/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(parts[0]) ||
    !/^[a-z\d_.-]{1,100}$/i.test(parts[1]) ||
    /^\.{1,2}$/.test(parts[1])
  ) {
    throw new AnalysisError(
      "Introduz um repositório como dono/projeto ou https://github.com/dono/projeto.",
    );
  }
  return { owner: parts[0], name: parts[1] };
}
