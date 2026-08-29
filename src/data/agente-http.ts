// Handlers de borda para MCP e OAuth. Só Web APIs: o middleware da Vercel
// empacota este arquivo junto com o restante da borda.

import {
  indiceApi,
  listaContato,
  listaExperiencia,
  listaProjetos,
  listaStack,
  perfil,
  VERSAO_API,
} from "./api";
import { site } from "./site";

export const MCP_SERVER_INFO = {
  name: "lucascavalheri-portfolio",
  title: site.nome,
  version: VERSAO_API,
  description:
    "Perfil, projetos, experiência, stack e contato de Lucas Cavalheri. Somente leitura, sem autenticação.",
};

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, HEAD, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, Accept, MCP-Protocol-Version, Mcp-Session-Id",
  "Access-Control-Expose-Headers": "MCP-Protocol-Version",
};

const PROTOCOLO_MCP = "2025-11-25";
const PROTOCOLOS = new Set(["2025-11-25", "2025-03-26", "2024-11-05"]);

const json = (corpo: unknown, status = 200, extras: Record<string, string> = {}) =>
  new Response(`${JSON.stringify(corpo, null, 2)}\n`, {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...CORS,
      ...extras,
    },
  });

const ferramentasMcp = [
  {
    name: "get_perfil",
    description:
      "Identidade, cargo, localização e para o que Lucas Cavalheri está disponível.",
    inputSchema: { type: "object", properties: {} },
    ler: perfil,
  },
  {
    name: "get_projetos",
    description: "Projetos com tipo, ano, stack e links.",
    inputSchema: { type: "object", properties: {} },
    ler: listaProjetos,
  },
  {
    name: "get_experiencia",
    description: "Cargos, empresas, períodos e stack de cada um.",
    inputSchema: { type: "object", properties: {} },
    ler: listaExperiencia,
  },
  {
    name: "get_stack",
    description: "Tecnologias agrupadas por categoria.",
    inputSchema: { type: "object", properties: {} },
    ler: listaStack,
  },
  {
    name: "get_contato",
    description: "E-mail, WhatsApp e demais canais, com tempo de resposta.",
    inputSchema: { type: "object", properties: {} },
    ler: listaContato,
  },
  {
    name: "get_indice",
    description: "Índice da API: recursos, versão, limite e política de uso.",
    inputSchema: { type: "object", properties: {} },
    ler: indiceApi,
  },
];

const rpc = (id: unknown, result: unknown) => ({ jsonrpc: "2.0", id, result });
const rpcErro = (id: unknown, code: number, message: string) => ({
  jsonrpc: "2.0",
  id,
  error: { code, message },
});

const executarMcp = (mensagem: Record<string, unknown>) => {
  const id = mensagem.id ?? null;
  const metodo = mensagem.method;

  if (typeof metodo !== "string") return rpcErro(id, -32600, "Invalid Request");

  if (metodo === "initialize") {
    const params = (mensagem.params ?? {}) as { protocolVersion?: string };
    const pedido = params.protocolVersion;
    const protocolVersion = pedido && PROTOCOLOS.has(pedido) ? pedido : PROTOCOLO_MCP;
    return rpc(id, {
      protocolVersion,
      capabilities: { tools: {}, resources: {} },
      serverInfo: MCP_SERVER_INFO,
    });
  }

  if (metodo === "ping") return rpc(id, {});

  if (metodo === "tools/list") {
    return rpc(id, {
      tools: ferramentasMcp.map(({ name, description, inputSchema }) => ({
        name,
        description,
        inputSchema,
      })),
    });
  }

  if (metodo === "tools/call") {
    const params = (mensagem.params ?? {}) as { name?: string };
    const ferramenta = ferramentasMcp.find((item) => item.name === params.name);
    if (!ferramenta) return rpcErro(id, -32602, `Ferramenta desconhecida: ${params.name}`);
    const dados = ferramenta.ler();
    const texto = JSON.stringify(dados, null, 2);
    return rpc(id, {
      content: [{ type: "text", text: texto }],
      structuredContent: dados,
    });
  }

  if (metodo === "resources/list") {
    return rpc(id, {
      resources: [
        {
          uri: `${site.url}/llms.txt`,
          name: "llms.txt",
          mimeType: "text/plain",
        },
        {
          uri: `${site.url}/openapi.json`,
          name: "openapi",
          mimeType: "application/json",
        },
      ],
    });
  }

  if (metodo.startsWith("notifications/")) return null;

  return rpcErro(id, -32601, `Método não suportado: ${metodo}`);
};

export const tratarMcp = async (request: Request): Promise<Response> => {
  if (request.method === "GET" || request.method === "HEAD") {
    return json(
      {
        serverInfo: MCP_SERVER_INFO,
        url: `${site.url}/mcp`,
        endpoint: `${site.url}/mcp`,
        transport: { type: "streamable-http", endpoint: `${site.url}/mcp` },
        capabilities: { tools: {}, resources: {}, prompts: {} },
      },
      200,
      { "MCP-Protocol-Version": PROTOCOLO_MCP }
    );
  }

  if (request.method !== "POST") {
    return new Response(null, { status: 405, headers: { Allow: "GET, HEAD, POST, OPTIONS", ...CORS } });
  }

  let corpo: unknown;
  try {
    corpo = await request.json();
  } catch {
    return json(rpcErro(null, -32700, "Parse error"), 400);
  }

  const mensagens = Array.isArray(corpo) ? corpo : [corpo];
  const respostas = [];
  for (const mensagem of mensagens) {
    if (!mensagem || typeof mensagem !== "object") {
      respostas.push(rpcErro(null, -32600, "Invalid Request"));
      continue;
    }
    const resposta = executarMcp(mensagem as Record<string, unknown>);
    if (resposta) respostas.push(resposta);
  }

  if (respostas.length === 0) {
    return new Response(null, { status: 202, headers: CORS });
  }

  return json(Array.isArray(corpo) ? respostas : respostas[0], 200, {
    "MCP-Protocol-Version": PROTOCOLO_MCP,
  });
};

const tokenPublico = {
  access_token: "public",
  token_type: "Bearer",
  expires_in: 86400,
  scope: "portfolio:read",
};

const tratarOAuth = async (request: Request, caminho: string): Promise<Response> => {
  if (caminho === "/oauth/authorize") {
    return json({
      error: "this_api_is_public",
      error_description:
        "Esta API é pública. Não há tela de autorização. Chame GET /api/v1/index.json, ou POST /oauth/token com grant_type=client_credentials se o seu cliente exige um Bearer.",
      documentacao: `${site.url}/auth.md`,
    });
  }

  if (caminho === "/oauth/revoke") {
    if (request.method !== "POST") {
      return new Response(null, { status: 405, headers: { Allow: "POST, OPTIONS", ...CORS } });
    }
    return json({ revogado: true });
  }

  if (request.method !== "POST") {
    return new Response(null, { status: 405, headers: { Allow: "POST, OPTIONS", ...CORS } });
  }

  return json(tokenPublico);
};

const tratarIdentidade = async (request: Request, caminho: string): Promise<Response> => {
  if (caminho === "/agent/identity/claim") {
    return json({
      error: "claim_not_applicable",
      error_description:
        "Não há cerimônia de claim: a API é pública e anônima por padrão. Chame GET /api/v1/index.json.",
      documentacao: `${site.url}/auth.md`,
    });
  }

  if (request.method === "GET" || request.method === "HEAD") {
    return json({
      identity_types_supported: ["anonymous"],
      detail:
        "POST { \"type\": \"anonymous\" } se o seu runtime exige registro. A API responde GET sem credencial.",
      documentacao: `${site.url}/auth.md`,
    });
  }

  if (request.method !== "POST") {
    return new Response(null, { status: 405, headers: { Allow: "GET, HEAD, POST, OPTIONS", ...CORS } });
  }

  return json({
    registration_id: "public",
    registration_type: "anonymous",
    scopes: ["portfolio:read"],
    detail:
      "Registro anônimo aceito. Nenhum credencial é emitido nem exigido. Chame GET /api/v1/index.json.",
  });
};

export const tratarAgenteHttp = async (request: Request): Promise<Response> => {
  const caminho = new URL(request.url).pathname.replace(/\/+$/, "") || "/";

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  if (caminho === "/mcp") return tratarMcp(request);
  if (caminho.startsWith("/oauth/")) return tratarOAuth(request, caminho);
  if (caminho.startsWith("/agent/")) return tratarIdentidade(request, caminho);

  return json({ error: "not_found", instance: caminho }, 404);
};
