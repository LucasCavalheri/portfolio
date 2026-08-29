import { authMd, respostaTexto } from "../data/agentes";

export const GET = () => respostaTexto(authMd(), "text/markdown; charset=utf-8");
