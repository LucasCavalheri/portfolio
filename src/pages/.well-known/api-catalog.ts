import { catalogoApi, respostaDescoberta, TIPO_LINKSET } from "../../data/agentes";

export const GET = () => respostaDescoberta(catalogoApi(), TIPO_LINKSET);
