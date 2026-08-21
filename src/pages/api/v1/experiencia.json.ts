import { respostaJson, listaExperiencia } from "../../../data/api";

export const GET = () => respostaJson(listaExperiencia());
