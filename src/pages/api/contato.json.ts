import { respostaJson, listaContato } from "../../data/api";

export const GET = () => respostaJson(listaContato());
