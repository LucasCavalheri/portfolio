import { respostaJson, perfil } from "../../data/api";

export const GET = () => respostaJson(perfil());
