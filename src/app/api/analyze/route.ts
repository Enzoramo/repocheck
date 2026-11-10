import { NextResponse } from "next/server";
import { analyzeRepository } from "@/lib/github";
import { AnalysisError } from "@/lib/repository";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (Number(request.headers.get("content-length") ?? 0) > 2048)
      throw new AnalysisError("O endereço é demasiado longo.");
    const text = await request.text();
    if (text.length > 2048)
      throw new AnalysisError("O endereço é demasiado longo.");
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      throw new AnalysisError("Envia um endereço de repositório válido.");
    }
    if (
      !body ||
      typeof body !== "object" ||
      !("repository" in body) ||
      typeof body.repository !== "string" ||
      body.repository.length > 300
    ) {
      throw new AnalysisError("Introduz o endereço de um repositório público.");
    }
    const analysis = await analyzeRepository(body.repository);
    return NextResponse.json(analysis, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof AnalysisError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    return NextResponse.json(
      { error: "Não foi possível concluir a análise. Tenta novamente." },
      { status: 500 },
    );
  }
}
