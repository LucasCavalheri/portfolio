import { respostaJson } from "../data/api";
import { openapi } from "../data/openapi";

export const GET = () => respostaJson(openapi());
