import type { APIRoute } from "astro";
import { habilidadePorNome, habilidades, respostaTexto } from "../../../../data/agentes";

export const getStaticPaths = () =>
  habilidades.map((item) => ({ params: { nome: item.name } }));

export const GET: APIRoute = ({ params }) => {
  const habilidade = habilidadePorNome(params.nome ?? "");
  if (!habilidade) return new Response("Not found", { status: 404 });
  return respostaTexto(habilidade.corpo, "text/markdown; charset=utf-8");
};
