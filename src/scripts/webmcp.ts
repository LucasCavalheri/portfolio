// WebMCP: expõe as ações do site a agentes no navegador.
// Spec atual: document.modelContext.registerTool (W3C CG).
// API anterior / Chrome EPP: navigator.modelContext.provideContext.
import { site } from "../data/site";

type Entrada = Record<string, unknown>;
type Ferramenta = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: { readOnlyHint: boolean };
  execute: (entrada: Entrada) => Promise<unknown>;
};

const jsonApi = async (rota: string) => {
  const resposta = await fetch(rota);
  if (!resposta.ok) throw new Error(`${rota} → HTTP ${resposta.status}`);
  return resposta.json();
};

const paginas = [
  "/",
  "/sobre",
  "/contato",
  "/usos",
  "/desenvolvedores",
  "/privacidade",
  "/#projetos",
  "/#experiencia",
  "/#contato",
] as const;

const ferramentas: Ferramenta[] = [
  {
    name: "get_perfil",
    description: "Identidade, cargo, localização e disponibilidade de Lucas Cavalheri.",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true },
    execute: () => jsonApi("/api/v1/perfil.json"),
  },
  {
    name: "get_projetos",
    description: "Projetos com tipo, ano, stack e links.",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true },
    execute: () => jsonApi("/api/v1/projetos.json"),
  },
  {
    name: "get_experiencia",
    description: "Cargos, empresas, períodos e stack.",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true },
    execute: () => jsonApi("/api/v1/experiencia.json"),
  },
  {
    name: "get_stack",
    description: "Tecnologias agrupadas por categoria.",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true },
    execute: () => jsonApi("/api/v1/stack.json"),
  },
  {
    name: "get_contato",
    description: "E-mail, WhatsApp e demais canais de Lucas Cavalheri.",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true },
    execute: () => jsonApi("/api/v1/contato.json"),
  },
  {
    name: "ir_para",
    description: "Navega para uma página ou âncora deste site.",
    inputSchema: {
      type: "object",
      properties: {
        caminho: {
          type: "string",
          description: "Rota do site",
          enum: [...paginas],
        },
      },
      required: ["caminho"],
    },
    execute: async ({ caminho }) => {
      const alvo = String(caminho ?? "/");
      const url = new URL(alvo, location.origin);
      location.assign(`${url.pathname}${url.hash}`);
      return { ok: true, href: `${url.pathname}${url.hash}` };
    },
  },
  {
    name: "copiar_email",
    description: `Copia o e-mail ${site.email} para a área de transferência.`,
    inputSchema: { type: "object", properties: {} },
    execute: async () => {
      try {
        await navigator.clipboard.writeText(site.email);
        return { ok: true, email: site.email, copiado: true };
      } catch {
        return { ok: true, email: site.email, copiado: false };
      }
    },
  },
];

type Contexto = {
  registerTool?: (ferramenta: Ferramenta, opcoes?: { signal?: AbortSignal }) => Promise<unknown>;
  provideContext?: (contexto: { tools: Ferramenta[] }) => Promise<unknown>;
};

const contextoDe = (alvo: unknown): Contexto | undefined => {
  if (!alvo || typeof alvo !== "object") return undefined;
  const candidato = alvo as Contexto;
  if (typeof candidato.registerTool === "function" || typeof candidato.provideContext === "function") {
    return candidato;
  }
  return undefined;
};

const registrar = async () => {
  const ctx =
    contextoDe((navigator as Navigator & { modelContext?: unknown }).modelContext) ??
    contextoDe((document as Document & { modelContext?: unknown }).modelContext) ??
    contextoDe((window as Window & { modelContext?: unknown }).modelContext);

  if (!ctx) return;

  const ac = new AbortController();
  addEventListener("pagehide", () => ac.abort(), { once: true });

  if (typeof ctx.registerTool === "function") {
    for (const ferramenta of ferramentas) {
      await ctx.registerTool(ferramenta, { signal: ac.signal }).catch(() => undefined);
    }
    return;
  }

  if (typeof ctx.provideContext === "function") {
    await ctx.provideContext({ tools: ferramentas }).catch(() => undefined);
  }
};

void registrar();
