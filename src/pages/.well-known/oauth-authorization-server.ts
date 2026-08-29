import { respostaDescoberta, servidorAutorizacao } from "../../data/agentes";

export const GET = () => respostaDescoberta(servidorAutorizacao());
