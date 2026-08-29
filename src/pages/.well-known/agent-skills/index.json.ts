import { createHash } from "node:crypto";
import { indiceHabilidades, respostaDescoberta } from "../../../data/agentes";

const digest = (corpo: string) => `sha256:${createHash("sha256").update(corpo).digest("hex")}`;

export const GET = () => respostaDescoberta(indiceHabilidades(digest));
