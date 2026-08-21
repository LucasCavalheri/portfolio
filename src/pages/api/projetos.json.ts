import { respostaJson, listaProjetos } from "../../data/api";

export const GET = () => respostaJson(listaProjetos());
