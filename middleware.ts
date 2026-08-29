// Roda na borda, antes do cache: é o único lugar onde dá para negociar
// conteúdo por Accept num site estático. O vercel.json não serve para isso,
// porque a variante HTML cacheada é devolvida antes da regra ser avaliada.
//
// Faz três coisas:
//   1. Accept: text/markdown numa rota de página  -> serve o .md equivalente
//   2. rota inexistente sob /api/                 -> 404 em JSON, com dica
//   3. rota inexistente pedida em markdown        -> 404 em markdown
//
// Em qualquer caso a resposta leva Vary: Accept, para o CDN guardar uma
// entrada por variante em vez de misturá-las.

// Precisa alcançar rota inexistente também, senão o 404 em markdown nunca
// passa por aqui. Só os assets do Astro ficam de fora.
import { tratarAgenteHttp } from "./src/data/agente-http";

// Duplicado de src/data/agentes.ts: o middleware vai sozinho para a borda.
export const LINK_DESCOBERTA = [
  '</.well-known/api-catalog>; rel="api-catalog"',
  '</openapi.json>; rel="service-desc"; type="application/json"',
  '</desenvolvedores>; rel="service-doc"',
  '</llms.txt>; rel="describedby"',
  '</.well-known/ai-catalog.json>; rel="ai-catalog"',
  '</.well-known/mcp/server-card.json>; rel="alternate"; type="application/json"',
].join(", ");

export const config = {
  matcher: ["/((?!_astro/).*)"],
};

/** Rotas de página que têm par em markdown. */
const PARES_MARKDOWN: Record<string, string> = {
  "/": "/index.md",
  "/sobre": "/sobre.md",
  "/contato": "/contato.md",
  "/usos": "/usos.md",
  "/privacidade": "/privacidade.md",
  "/desenvolvedores": "/desenvolvedores.md",
};

/** Versão corrente no caminho. O caminho sem versão redireciona para ela. */
const VERSAO = "v1";

const RECURSOS = ["index", "perfil", "projetos", "experiencia", "stack", "contato", "openapi"];

/** Recursos que existem. Fora desta lista, é 404 em problem+json. */
const RECURSOS_API = new Set(RECURSOS.map((r) => `/api/${VERSAO}/${r}.json`));

/** Política de uso, também declarada em RateLimit-Policy. */
const LIMITE_JANELA = 120;
const JANELA_SEGUNDOS = 60;

// Contagem por origem, na memória da instância de borda: aproximada por
// natureza, já que cada instância conta o que passou por ela. Serve para
// conter abuso e para os cabeçalhos refletirem algo real, não um número fixo.
const contagem = new Map<string, { total: number; reinicioMs: number }>();

export const registrarAcesso = (
  origem: string,
  agoraMs: number,
  limite = LIMITE_JANELA,
  janelaSegundos = JANELA_SEGUNDOS
) => {
  const atual = contagem.get(origem);
  if (!atual || agoraMs >= atual.reinicioMs) {
    const novo = { total: 1, reinicioMs: agoraMs + janelaSegundos * 1000 };
    contagem.set(origem, novo);
    return { excedeu: false, restantes: limite - 1, resetSegundos: janelaSegundos };
  }
  atual.total += 1;
  const resetSegundos = Math.max(1, Math.ceil((atual.reinicioMs - agoraMs) / 1000));
  return {
    excedeu: atual.total > limite,
    restantes: Math.max(0, limite - atual.total),
    resetSegundos,
  };
};

const cabecalhosLimite = (restantes: number, resetSegundos: number) => ({
  "RateLimit-Policy": `${LIMITE_JANELA};w=${JANELA_SEGUNDOS}`,
  "RateLimit-Limit": String(LIMITE_JANELA),
  "RateLimit-Remaining": String(restantes),
  "RateLimit-Reset": String(resetSegundos),
});

const SITE = "https://lucascavalheri.com.br";

/** Extensões servidas direto, sem passar pela negociação. */
const ARQUIVO = /\.(?:png|jpe?g|gif|svg|ico|webp|avif|pdf|xml|txt|md|woff2?|ttf|css|js|map)$/i;

// Duplicado de propósito: o middleware é empacotado sozinho para a borda, e um
// import do site inteiro entraria no pacote. O teste "a lista do 404 acompanha
// site.ts" falha se estas rotas divergirem das publicadas.
const PAGINAS_404 = [
  "/ — perfil, projetos, experiência e stack",
  "/sobre — trajetória, como trabalho e o que procuro",
  "/contato — e-mail, WhatsApp, redes e tempo de resposta",
  "/usos — lista completa de linguagens, frameworks e ferramentas",
  "/desenvolvedores — API pública em JSON, especificação OpenAPI e CLI",
  "/privacidade — que dados o site coleta, e quais não coleta",
];

/** Corpo curto de 404 em markdown, para o agente saber onde procurar. */
export const corpo404Markdown = (caminho: string) =>
  [
    "# 404 — Página não encontrada",
    "",
    `O caminho \`${caminho}\` não existe em ${SITE}.`,
    "",
    "## Páginas que existem",
    "",
    ...PAGINAS_404.map((linha) => `- ${linha}`),
    "",
    "## Onde procurar",
    "",
    `- ${SITE}/llms.txt — o que este site é e quando me chamar`,
    `- ${SITE}/sitemap-index.xml — todas as URLs`,
    `- ${SITE}/api/index.json — índice da API pública`,
    `- ${SITE}/.well-known/api-catalog — catálogo RFC 9727`,
    `- ${SITE}/.well-known/mcp/server-card.json — MCP`,
    `- ${SITE}/404.md — esta mesma resposta, completa`,
    "",
  ].join("\n");

/** O cliente prefere markdown a HTML? Compara os valores de q. */
export const preferecMarkdown = (accept: string | null): boolean => {
  if (!accept) return false;
  const peso = (tipo: string) => {
    for (const parte of accept.split(",")) {
      const [valor, ...params] = parte.trim().split(";");
      if (valor.trim().toLowerCase() !== tipo) continue;
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      return q ? Number(q.slice(2)) : 1;
    }
    return 0;
  };
  const markdown = Math.max(peso("text/markdown"), peso("text/x-markdown"));
  if (markdown === 0) return false;
  return markdown >= Math.max(peso("text/html"), peso("application/xhtml+xml"));
};

// RFC 9457. Repetido do src/data/problema.ts porque o middleware vai para a
// borda em pacote próprio; o teste "o problema do middleware casa com o do
// site" falha se os dois formatos divergirem.
export const corpoProblema = (
  status: number,
  tipo: string,
  titulo: string,
  detalhe: string,
  instancia: string,
  codigo: string,
  dica: string
) => ({
  type: `${SITE}/desenvolvedores#${tipo}`,
  title: titulo,
  status,
  detail: detalhe,
  instance: instancia,
  codigo,
  dica,
  documentacao: `${SITE}/desenvolvedores`,
});

/** Decide o que fazer com a requisição. Separado para poder testar sem rede. */
const respostaProblema = (
  corpo: ReturnType<typeof corpoProblema>,
  status: number,
  extras: Record<string, string> = {}
) =>
  new Response(JSON.stringify(corpo, null, 2), {
    status,
    headers: {
      // RFC 9457 exige este tipo de mídia
      "Content-Type": "application/problem+json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      Vary: "Accept, Accept-Encoding",
      "Cache-Control": "no-store",
      ...extras,
    },
  });

export const decidir = (url: URL, accept: string | null) => {
  const caminho = url.pathname.replace(/\/+$/, "") || "/";

  // asset e arquivo de máquina não são negociados
  if (ARQUIVO.test(caminho) && !caminho.startsWith("/api/")) {
    return { tipo: "seguir" as const };
  }

  if (
    caminho.startsWith("/.well-known/") ||
    caminho === "/mcp" ||
    caminho.startsWith("/oauth") ||
    caminho.startsWith("/agent/")
  ) {
    return { tipo: "seguir" as const };
  }

  if (caminho === "/api" || caminho === "/api/index") {
    return { tipo: "reescrever" as const, para: `/api/${VERSAO}/index.json` };
  }

  // caminho sem versão: redireciona para a versão corrente, com Link canônico
  const semVersao = caminho.match(/^\/api\/([a-z]+)\.json$/);
  if (semVersao && RECURSOS.includes(semVersao[1])) {
    return {
      tipo: "redirecionar" as const,
      status: 301,
      para: `/api/${VERSAO}/${semVersao[1]}.json`,
    };
  }

  if (caminho.startsWith("/api/") && !RECURSOS_API.has(caminho)) {
    return {
      tipo: "problema" as const,
      status: 404,
      corpo: corpoProblema(
        404,
        "recurso-nao-encontrado",
        "Recurso não encontrado",
        `O recurso ${caminho} não existe nesta API.`,
        caminho,
        "recurso_nao_encontrado",
        `Consulte /api/${VERSAO}/index.json para a lista de recursos, ou /openapi.json para a especificação.`
      ),
    };
  }

  if (preferecMarkdown(accept)) {
    const par = PARES_MARKDOWN[caminho];
    if (par) return { tipo: "reescrever" as const, para: par };
    if (!caminho.startsWith("/api/")) {
      // reescrever devolveria 200; o agente precisa do 404 de verdade
      return { tipo: "markdown404" as const, status: 404, corpo: corpo404Markdown(caminho) };
    }
  }

  return { tipo: "seguir" as const };
};

export default function middleware(request: Request): Response | Promise<Response> | undefined {
  const url = new URL(request.url);
  const caminho = url.pathname.replace(/\/+$/, "") || "/";

  if (caminho === "/mcp" || caminho.startsWith("/oauth") || caminho.startsWith("/agent/")) {
    return tratarAgenteHttp(request);
  }

  // só a API é contada: página estática não tem por que ter limite
  if (caminho.startsWith("/api/") || caminho === "/api") {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return respostaProblema(
        corpoProblema(
          405,
          "metodo-nao-permitido",
          "Método não permitido",
          `Esta API só aceita GET. O método ${request.method} não é suportado.`,
          caminho,
          "metodo_nao_permitido",
          "Use GET. Toda operação é somente leitura e idempotente."
        ),
        405,
        { Allow: "GET, HEAD" }
      );
    }

    const origem =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      request.headers.get("x-real-ip") ??
      "desconhecida";
    const uso = registrarAcesso(origem, Date.now());

    if (uso.excedeu) {
      return respostaProblema(
        corpoProblema(
          429,
          "limite-excedido",
          "Limite de requisições excedido",
          `Muitas requisições. Tente novamente em ${uso.resetSegundos} segundos.`,
          caminho,
          "limite_excedido",
          "Respeite o cabeçalho Retry-After. A política está em RateLimit-Policy."
        ),
        429,
        {
          "Retry-After": String(uso.resetSegundos),
          ...cabecalhosLimite(0, uso.resetSegundos),
        }
      );
    }

    const decisaoApi = decidir(url, request.headers.get("accept"));
    const limites = cabecalhosLimite(uso.restantes, uso.resetSegundos);

    if (decisaoApi.tipo === "problema") {
      return respostaProblema(decisaoApi.corpo, decisaoApi.status, limites);
    }
    if (decisaoApi.tipo === "redirecionar") {
      return new Response(null, {
        status: decisaoApi.status,
        headers: {
          Location: new URL(decisaoApi.para, url.origin).toString(),
          Link: `<${new URL(decisaoApi.para, url.origin)}>; rel="canonical"`,
          ...limites,
        },
      });
    }
    if (decisaoApi.tipo === "reescrever") {
      return new Response(null, {
        status: 200,
        headers: {
          "x-middleware-rewrite": new URL(decisaoApi.para, url.origin).toString(),
          Vary: "Accept, Accept-Encoding",
          ...limites,
        },
      });
    }
    // recurso existente: segue para o arquivo, com os cabeçalhos de limite
    return new Response(null, {
      status: 200,
      headers: { "x-middleware-next": "1", ...limites },
    });
  }

  const decisao = decidir(url, request.headers.get("accept"));
  const descoberta = caminho === "/" ? { Link: LINK_DESCOBERTA } : {};

  if (decisao.tipo === "markdown404") {
    return new Response(decisao.corpo, {
      status: decisao.status,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        Vary: "Accept, Accept-Encoding",
        "Cache-Control": "public, max-age=0, s-maxage=60",
        ...descoberta,
      },
    });
  }

  if (decisao.tipo === "reescrever") {
    const destino = new URL(decisao.para, url.origin);
    return new Response(null, {
      status: 200,
      headers: {
        "x-middleware-rewrite": destino.toString(),
        Vary: "Accept, Accept-Encoding",
        ...descoberta,
      },
    });
  }

  if (caminho === "/") {
    return new Response(null, {
      status: 200,
      headers: { "x-middleware-next": "1", Link: LINK_DESCOBERTA },
    });
  }

  return undefined;
}
