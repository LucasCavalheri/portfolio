// mesmo documento em /api/openapi.json, que é o outro caminho previsível
import { respostaJson } from "../../data/api";
import { openapi } from "../../data/openapi";

export const GET = () => respostaJson(openapi());
