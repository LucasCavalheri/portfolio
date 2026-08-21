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

export const config = {
  matcher: [
    "/",
    "/sobre",
    "/contato",
    "/usos",
    "/privacidade",
    "/desenvolvedores",
    "/api/:caminho*",
  ],
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

/** Recursos que existem sob /api/. Fora desta lista, é 404 em JSON. */
const RECURSOS_API = new Set([
  "/api/index.json",
  "/api/perfil.json",
  "/api/projetos.json",
  "/api/experiencia.json",
  "/api/stack.json",
  "/api/contato.json",
  "/api/openapi.json",
]);

const SITE = "https://lucascavalheri.com.br";

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

export const corpoErroJson = (status: number, codigo: string, mensagem: string, dica: string, caminho: string) => ({
  erro: {
    status,
    codigo,
    mensagem,
    dica,
    caminho,
    documentacao: `${SITE}/desenvolvedores`,
    indice: `${SITE}/api/index.json`,
  },
});

/** Decide o que fazer com a requisição. Separado para poder testar sem rede. */
export const decidir = (url: URL, accept: string | null) => {
  const caminho = url.pathname.replace(/\/+$/, "") || "/";

  if (caminho === "/api" || caminho === "/api/index") {
    return { tipo: "reescrever" as const, para: "/api/index.json" };
  }

  if (caminho.startsWith("/api/") && !RECURSOS_API.has(caminho)) {
    return {
      tipo: "erroJson" as const,
      status: 404,
      corpo: corpoErroJson(
        404,
        "recurso_nao_encontrado",
        `O recurso ${caminho} não existe nesta API.`,
        "Consulte /api/index.json para a lista de recursos, ou /openapi.json para a especificação completa.",
        caminho
      ),
    };
  }

  if (preferecMarkdown(accept)) {
    const par = PARES_MARKDOWN[caminho];
    if (par) return { tipo: "reescrever" as const, para: par };
    if (!caminho.startsWith("/api/")) {
      return { tipo: "reescrever" as const, para: "/404.md", status: 404 };
    }
  }

  return { tipo: "seguir" as const };
};

export default function middleware(request: Request): Response | undefined {
  const url = new URL(request.url);
  const decisao = decidir(url, request.headers.get("accept"));

  if (decisao.tipo === "erroJson") {
    return new Response(JSON.stringify(decisao.corpo, null, 2), {
      status: decisao.status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        Vary: "Accept, Accept-Encoding",
        "Cache-Control": "public, max-age=0, s-maxage=60",
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
      },
    });
  }

  return undefined;
}
