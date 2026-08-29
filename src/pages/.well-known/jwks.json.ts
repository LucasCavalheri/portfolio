import { jwks, respostaDescoberta } from "../../data/agentes";

export const GET = () => respostaDescoberta(jwks());
