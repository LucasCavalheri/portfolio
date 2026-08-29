import { cartaoMcp, respostaDescoberta } from "../data/agentes";

export const GET = () => respostaDescoberta(cartaoMcp());
