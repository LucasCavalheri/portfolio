// Cobre a superfície de máquina: API JSON, OpenAPI, erros e o middleware que
// negocia conteúdo na borda.
import { readFileSync, existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { site, paginas } from "../src/data/site";
import { CHAVE_INDEXNOW } from "../src/data/indexnow";
import { VERSAO_API } from "../src/data/api";
import { openapi } from "../src/data/openapi";
import middleware, {
  corpo404Markdown,
  corpoProblema,
  decidir,
  preferecMarkdown,
  registrarAcesso,
} from "../middleware";

const DIST = new URL("../dist/", import.meta.url);
const lerJson = (caminho: string) => JSON.parse(readFileSync(new URL(caminho, DIST), "utf8"));
const ler = (caminho: string) => readFileSync(new URL(caminho, DIST), "utf8");

const RECURSOS = [
  "api/v1/index.json",
  "api/v1/perfil.json",
  "api/v1/projetos.json",
  "api/v1/experiencia.json",
  "api/v1/stack.json",
  "api/v1/contato.json",
  "api/v1/openapi.json",
  "openapi.json",
] as const;

describe("API pública", () => {
  for (const recurso of RECURSOS) {
    it(`/${recurso} é JSON válido`, () => {
      expect(existsSync(new URL(recurso, DIST)), recurso).toBe(true);
      expect(() => lerJson(recurso)).not.toThrow();
    });
  }

  it("o índice aponta os recursos, a especificação e a documentação", () => {
    const indice = lerJson("api/v1/index.json");
    expect(indice.versao).toBe(VERSAO_API);
    expect(indice.openapi).toBe(`${site.url}/openapi.json`);
    expect(indice.documentacao).toBe(`${site.url}/desenvolvedores`);
    expect(indice.autenticacao).toBe("nenhuma");
    expect(indice.versionamento.atual).toBe("v1");
    expect(indice.versionamento.descontinuacao).toContain("Sunset");
    expect(indice.limiteDeUso.requisicoes).toBeGreaterThan(0);
    expect(indice.limiteDeUso.cabecalhos).toContain("RateLimit-Remaining");
    expect(indice.recursos.length).toBeGreaterThanOrEqual(5);
    for (const recurso of indice.recursos) {
      expect(existsSync(new URL(recurso.rota.slice(1), DIST)), recurso.rota).toBe(true);
      expect(recurso.descricao.length).toBeGreaterThan(10);
    }
  });

  it("o perfil traz identidade, localização e disponibilidade", () => {
    const perfil = lerJson("api/v1/perfil.json");
    expect(perfil.nome).toBe(site.nome);
    expect(perfil.cargo).toBe(site.cargo);
    expect(perfil.localizacao.cidade).toBe(site.cidade);
    expect(perfil.disponivelPara.length).toBeGreaterThan(3);
    expect(perfil.naoAtende.length).toBeGreaterThan(0);
  });

  it("projetos e experiência trazem stack tipada", () => {
    for (const arquivo of ["api/v1/projetos.json", "api/v1/experiencia.json"]) {
      const lista = lerJson(arquivo);
      expect(Array.isArray(lista)).toBe(true);
      expect(lista.length).toBeGreaterThan(0);
      for (const item of lista) {
        expect(item.tecnologias.length).toBeGreaterThan(0);
        for (const t of item.tecnologias) {
          expect(t).toMatchObject({ id: expect.any(String), nome: expect.any(String) });
          expect(t.site).toMatch(/^https?:\/\//);
        }
      }
    }
  });

  it("contato expõe canais com url utilizável", () => {
    const contato = lerJson("api/v1/contato.json");
    expect(contato.email).toBe(site.email);
    expect(contato.whatsapp).toContain("api.whatsapp.com");
    for (const canal of contato.canais) expect(canal.url).toBeTruthy();
  });
});

describe("OpenAPI", () => {
  const spec = openapi();

  it("declara a versão 3.1 e o servidor versionado", () => {
    expect(spec.openapi).toBe("3.1.0");
    expect(spec.servers[0].url).toBe(`${site.url}/api/v1`);
    expect(spec.info.description.length).toBeGreaterThan(100);
  });

  it("documenta versionamento, descontinuação e limites", () => {
    for (const termo of ["## Versionamento", "## Descontinuação", "Sunset", "180 dias", "RateLimit-Policy", "RFC 9457"]) {
      expect(spec.info.description, termo).toContain(termo);
    }
  });

  it("publicado em /openapi.json e /api/openapi.json, iguais", () => {
    expect(lerJson("openapi.json")).toEqual(lerJson("api/v1/openapi.json"));
  });

  it("toda operação tem operationId único, descrição e schema nomeado por $ref", () => {
    const ids: string[] = [];
    for (const [rota, operacoes] of Object.entries(spec.paths)) {
      for (const [metodo, operacao] of Object.entries(operacoes as Record<string, any>)) {
        const onde = `${metodo.toUpperCase()} ${rota}`;
        expect(operacao.operationId, onde).toBeTruthy();
        expect(operacao.summary, onde).toBeTruthy();
        expect(operacao.description.length, onde).toBeGreaterThan(30);
        expect(operacao.tags.length, onde).toBeGreaterThan(0);

        // $ref, não schema inline: é o que gerador de cliente procura
        const ok = operacao.responses["200"].content["application/json"].schema;
        expect(ok.$ref, `${onde} sem $ref na resposta`).toMatch(/^#\/components\/schemas\//);
        expect(spec.components.schemas[ok.$ref.split("/").pop()!], onde).toBeTruthy();

        // cabeçalhos de limite documentados na resposta de sucesso
        expect(Object.keys(operacao.responses["200"].headers), onde).toContain("RateLimit-Remaining");

        ids.push(operacao.operationId);
      }
    }
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("todo erro é problem+json apontando o mesmo schema", () => {
    for (const [rota, operacoes] of Object.entries(spec.paths)) {
      for (const [, operacao] of Object.entries(operacoes as Record<string, any>)) {
        for (const status of ["404", "405", "429", "500"]) {
          const resposta = operacao.responses[status];
          expect(resposta, `${rota} sem ${status}`).toBeTruthy();
          const conteudo = resposta.content["application/problem+json"];
          expect(conteudo, `${rota} ${status} fora da RFC 9457`).toBeTruthy();
          expect(conteudo.schema.$ref).toBe("#/components/schemas/Problema");
        }
        expect(operacao.responses["429"].headers["Retry-After"]).toBeTruthy();
      }
    }
  });

  it("o schema de erro segue os campos da RFC 9457", () => {
    const problema = spec.components.schemas.Problema;
    for (const campo of ["type", "title", "status", "detail", "instance", "codigo", "dica"]) {
      expect(Object.keys(problema.properties), campo).toContain(campo);
    }
    expect(problema.required).toContain("type");
    expect(problema.required).toContain("status");
  });

  it("cada caminho do spec existe no build, sob o servidor versionado", () => {
    for (const rota of Object.keys(spec.paths)) {
      expect(existsSync(new URL(`api/v1${rota}`, DIST)), rota).toBe(true);
    }
  });
});

describe("negociação de conteúdo no middleware", () => {
  it("reconhece quem prefere markdown, respeitando os pesos q", () => {
    expect(preferecMarkdown("text/markdown")).toBe(true);
    expect(preferecMarkdown("text/markdown, text/html;q=0.9")).toBe(true);
    expect(preferecMarkdown("text/x-markdown")).toBe(true);
    expect(preferecMarkdown("text/html")).toBe(false);
    expect(preferecMarkdown("text/html,application/xhtml+xml")).toBe(false);
    expect(preferecMarkdown("text/markdown;q=0.5, text/html;q=0.9")).toBe(false);
    expect(preferecMarkdown(null)).toBe(false);
  });

  it("serve o .md correspondente de cada página", () => {
    for (const pagina of paginas) {
      const esperado = pagina.rota === "/" ? "/index.md" : `${pagina.rota}.md`;
      const decisao = decidir(new URL(`${site.url}${pagina.rota}`), "text/markdown");
      expect(decisao, pagina.rota).toMatchObject({ tipo: "reescrever", para: esperado });
    }
  });

  it("responde 404 em markdown para rota inexistente pedida em markdown", () => {
    const decisao = decidir(new URL(`${site.url}/nao-existe`), "text/markdown");
    expect(decisao).toMatchObject({ tipo: "markdown404", status: 404 });
  });

  it("não interfere quando o cliente quer HTML", () => {
    expect(decidir(new URL(`${site.url}/`), "text/html")).toMatchObject({ tipo: "seguir" });
    expect(decidir(new URL(`${site.url}/sobre`), null)).toMatchObject({ tipo: "seguir" });
  });

  it("/api e /api/ caem no índice", () => {
    for (const rota of ["/api", "/api/", "/api/index"]) {
      expect(decidir(new URL(`${site.url}${rota}`), null)).toMatchObject({
        tipo: "reescrever",
        para: "/api/v1/index.json",
      });
    }
  });

  it("recurso de API inexistente responde problem+json, não HTML", () => {
    const decisao = decidir(new URL(`${site.url}/api/v1/nao-existe.json`), null) as any;
    expect(decisao.tipo).toBe("problema");
    expect(decisao.status).toBe(404);
    expect(decisao.corpo).toMatchObject({
      status: 404,
      codigo: "recurso_nao_encontrado",
      instance: "/api/v1/nao-existe.json",
    });
    expect(decisao.corpo.type).toContain("#recurso-nao-encontrado");
  });

  it("recurso versionado existente passa direto", () => {
    expect(decidir(new URL(`${site.url}/api/v1/perfil.json`), null)).toMatchObject({
      tipo: "seguir",
    });
  });

  it("caminho sem versão redireciona 301 para a versão corrente", () => {
    for (const recurso of ["perfil", "projetos", "experiencia", "stack", "contato", "openapi"]) {
      expect(decidir(new URL(`${site.url}/api/${recurso}.json`), null), recurso).toMatchObject({
        tipo: "redirecionar",
        status: 301,
        para: `/api/v1/${recurso}.json`,
      });
    }
  });

  it("a resposta de erro sai em application/problem+json", async () => {
    const resposta = middleware(new Request(`${site.url}/api/v1/nada.json`))!;
    expect(resposta.status).toBe(404);
    expect(resposta.headers.get("content-type")).toContain("application/problem+json");
    expect(resposta.headers.get("vary")).toContain("Accept");
    expect(resposta.headers.get("access-control-allow-origin")).toBe("*");
    const corpo = await resposta.json();
    expect(corpo.type).toMatch(/^https:\/\//);
    expect(corpo.title).toBeTruthy();
    expect(corpo.documentacao).toBe(`${site.url}/desenvolvedores`);
  });

  it("toda resposta de API traz os cabeçalhos de limite", () => {
    const resposta = middleware(new Request(`${site.url}/api/v1/perfil.json`))!;
    for (const cabecalho of [
      "RateLimit-Policy",
      "RateLimit-Limit",
      "RateLimit-Remaining",
      "RateLimit-Reset",
    ]) {
      expect(resposta.headers.get(cabecalho), cabecalho).toBeTruthy();
    }
    expect(resposta.headers.get("RateLimit-Policy")).toMatch(/^\d+;w=\d+$/);
  });

  it("conta por origem e devolve 429 com Retry-After ao exceder", () => {
    const agora = 1_000_000;
    let ultimo;
    for (let i = 0; i < 4; i += 1) ultimo = registrarAcesso("9.9.9.9", agora, 3, 60);
    expect(ultimo!.excedeu).toBe(true);
    expect(ultimo!.restantes).toBe(0);

    // janela nova zera a contagem
    const depois = registrarAcesso("9.9.9.9", agora + 61_000, 3, 60);
    expect(depois.excedeu).toBe(false);
    expect(depois.restantes).toBe(2);
  });

  it("método diferente de GET recebe 405", async () => {
    const resposta = middleware(
      new Request(`${site.url}/api/v1/perfil.json`, { method: "POST" })
    )!;
    expect(resposta.status).toBe(405);
    expect(resposta.headers.get("allow")).toContain("GET");
    const corpo = await resposta.json();
    expect(corpo.codigo).toBe("metodo_nao_permitido");
  });

  it("o problema do middleware casa com o do site", async () => {
    const { recursoNaoEncontrado } = await import("../src/data/problema");
    const doSite = recursoNaoEncontrado("/api/v1/x.json");
    const doMiddleware = (decidir(new URL(`${site.url}/api/v1/x.json`), null) as any).corpo;
    expect(Object.keys(doMiddleware).sort()).toEqual(Object.keys(doSite).sort());
    expect(doMiddleware.codigo).toBe(doSite.codigo);
    expect(doMiddleware.status).toBe(doSite.status);
  });

  it("a reescrita para markdown sai com Vary e o destino certo", () => {
    const resposta = middleware(
      new Request(`${site.url}/sobre`, { headers: { Accept: "text/markdown" } })
    )!;
    expect(resposta.headers.get("x-middleware-rewrite")).toBe(`${site.url}/sobre.md`);
    expect(resposta.headers.get("vary")).toContain("Accept");
  });

  it("o corpo de problema traz os campos da RFC 9457", () => {
    const corpo = corpoProblema(404, "tipo", "Título", "Detalhe", "/x", "codigo_teste", "dica");
    expect(corpo).toMatchObject({
      status: 404,
      title: "Título",
      detail: "Detalhe",
      instance: "/x",
      codigo: "codigo_teste",
    });
    expect(corpo.type).toBe(`${site.url}/desenvolvedores#tipo`);
  });
});

describe("404 em markdown", () => {
  it("traz título, páginas e onde procurar", () => {
    const corpo = corpo404Markdown("/rota-inexistente");
    expect(corpo.startsWith("# 404")).toBe(true);
    expect(corpo).toContain("/rota-inexistente");
    expect(corpo).toContain("/llms.txt");
    expect(corpo).toContain("/sitemap-index.xml");
    expect(corpo).toContain("/api/index.json");
  });

  it("a lista do 404 acompanha site.ts", () => {
    // o middleware repete as rotas porque é empacotado sozinho para a borda;
    // este teste falha se alguém publicar página nova e esquecer de somar lá
    const corpo = corpo404Markdown("/x");
    for (const pagina of paginas) {
      const alvo = pagina.rota === "/" ? "- / —" : `- ${pagina.rota} —`;
      expect(corpo, pagina.rota).toContain(alvo);
    }
    const listadas = [...corpo.matchAll(/^- (\/[a-z]*) —/gm)].map((m) => m[1]);
    expect(listadas.sort()).toEqual(paginas.map((p) => p.rota).sort());
  });

  it("responde com status 404 e tipo markdown", () => {
    const resposta = middleware(
      new Request(`${site.url}/nao-existe`, { headers: { Accept: "text/markdown" } })
    )!;
    expect(resposta.status).toBe(404);
    expect(resposta.headers.get("content-type")).toContain("text/markdown");
    expect(resposta.headers.get("vary")).toContain("Accept");
  });

  it("asset não é negociado", () => {
    for (const rota of ["/favicon.svg", "/og.png", "/Curriculo-LucasCavalheri.pdf", "/llms.txt"]) {
      expect(decidir(new URL(`${site.url}${rota}`), "text/markdown"), rota).toMatchObject({
        tipo: "seguir",
      });
    }
  });

  it("well-known, MCP e OAuth não caem na negociação markdown", () => {
    for (const rota of [
      "/.well-known/api-catalog",
      "/.well-known/oauth-protected-resource",
      "/mcp",
      "/oauth/token",
      "/agent/identity",
    ]) {
      expect(decidir(new URL(`${site.url}${rota}`), "text/markdown"), rota).toMatchObject({
        tipo: "seguir",
      });
    }
  });
});

describe("MCP e OAuth na borda", () => {
  it("initialize e tools/list respondem JSON-RPC", async () => {
    const init = await middleware(
      new Request(`${site.url}/mcp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "initialize",
          params: { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "t", version: "1" } },
        }),
      })
    )!;
    expect(init.status).toBe(200);
    const iniciado = await init.json();
    expect(iniciado.result.serverInfo.name).toBe("lucascavalheri-portfolio");
    expect(iniciado.result.capabilities.tools).toBeTruthy();

    const lista = await middleware(
      new Request(`${site.url}/mcp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list" }),
      })
    )!;
    const ferramentas = (await lista.json()).result.tools.map((t: { name: string }) => t.name);
    for (const nome of ["get_perfil", "get_projetos", "get_contato"]) {
      expect(ferramentas).toContain(nome);
    }
  });

  it("tools/call devolve o perfil", async () => {
    const resposta = await middleware(
      new Request(`${site.url}/mcp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 3,
          method: "tools/call",
          params: { name: "get_perfil", arguments: {} },
        }),
      })
    )!;
    const corpo = await resposta.json();
    expect(corpo.result.structuredContent.nome).toBe(site.nome);
  });

  it("token público sai sem cadastro", async () => {
    const resposta = await middleware(
      new Request(`${site.url}/oauth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "grant_type=client_credentials",
      })
    )!;
    const corpo = await resposta.json();
    expect(corpo.token_type).toBe("Bearer");
    expect(corpo.access_token).toBe("public");
    expect(corpo.scope).toContain("portfolio:read");
  });

  it("registro anônimo não exige credencial", async () => {
    const resposta = await middleware(
      new Request(`${site.url}/agent/identity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "anonymous" }),
      })
    )!;
    const corpo = await resposta.json();
    expect(corpo.registration_type).toBe("anonymous");
    expect(corpo.scopes).toContain("portfolio:read");
  });

  it("a home em markdown leva o cabeçalho Link de descoberta", () => {
    const resposta = middleware(
      new Request(`${site.url}/`, { headers: { Accept: "text/markdown" } })
    )!;
    expect(resposta.headers.get("link")).toContain('rel="api-catalog"');
    expect(resposta.headers.get("link")).toContain("/.well-known/api-catalog");
  });
});

describe("descoberta para desenvolvedores", () => {
  it("a home aponta a documentação, a especificação e a API", () => {
    const html = ler("index.html");
    for (const destino of ["/desenvolvedores", "/openapi.json", "/api/v1/index.json"]) {
      expect(html, destino).toContain(`href="${destino}"`);
    }
  });

  it("a página documenta autenticação, erros, exemplos e CLI", () => {
    const html = ler("desenvolvedores/index.html");
    for (const termo of [
      "openapi.json",
      "curl",
      "Accept: text/markdown",
      "npx lucascavalheri",
      "CC BY 4.0",
      "RFC 9457",
      "RateLimit-Policy",
      "Sunset",
      "180 dias",
      'id="versionamento"',
      'id="limites"',
      'id="recurso-nao-encontrado"',
    ]) {
      expect(html, termo).toContain(termo);
    }
    expect(html).toMatch(/<h1[\s>]/);
  });

  it("o nome do site está no título da página", () => {
    const html = ler("desenvolvedores/index.html");
    expect(html).toContain("API de Lucas Cavalheri");
    expect(html).toMatch(/<title>[^<]*API de Lucas Cavalheri[^<]*<\/title>/);
  });

  it("llms.txt lista API, OpenAPI, documentação e CLI", () => {
    const llms = ler("llms.txt");
    expect(llms).toContain("## API and developer resources");
    expect(llms).toContain(`${site.url}/openapi.json`);
    expect(llms).toContain(`${site.url}/api/v1/index.json`);
    expect(llms).toContain("RFC 9457");
    expect(llms).toContain("RateLimit-Policy");
    expect(llms).toContain("npx lucascavalheri");
    expect(llms).toContain("function calling");
  });

  it("os apelidos em inglês da documentação estão declarados", () => {
    const config = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
    for (const alias of ["/developers", "/docs", "/api-docs"]) {
      expect(config.rewrites).toEqual(
        expect.arrayContaining([{ source: alias, destination: "/desenvolvedores" }])
      );
    }
  });
});

describe("CLI", () => {
  const pacote = JSON.parse(readFileSync(new URL("../cli/package.json", import.meta.url), "utf8"));

  it("a versão do pacote e a impressa por --version são a mesma", () => {
    const fonte = readFileSync(new URL("../cli/bin/lucascavalheri.js", import.meta.url), "utf8");
    expect(fonte).toContain(`console.log("${pacote.version}")`);
    expect(fonte).toContain(`lucascavalheri-cli/${pacote.version}`);
  });

  it("o padding da coluna cabe a rota mais longa", () => {
    const fonte = readFileSync(new URL("../cli/bin/lucascavalheri.js", import.meta.url), "utf8");
    const padding = Number(fonte.match(/padEnd\((\d+)\)/)![1]);
    const maisLonga = Math.max(
      ...["index", "perfil", "projetos", "experiencia", "stack", "contato"].map(
        (r) => `/api/v1/${r}.json`.length
      )
    );
    expect(padding).toBeGreaterThan(maisLonga);
  });

  it("o site aponta o pacote publicado", () => {
    expect(site.cli.url).toBe("https://www.npmjs.com/package/lucascavalheri");
    expect(ler("desenvolvedores/index.html")).toContain(site.cli.url);
    expect(ler("llms.txt")).toContain(site.cli.url);
  });

  it("declara bin, licença e Node mínimo", () => {
    expect(pacote.name).toBe("lucascavalheri");
    expect(pacote.bin.lucascavalheri).toBe("bin/lucascavalheri.js");
    expect(pacote.engines.node).toBe(">=18");
    expect(pacote.homepage).toContain("/desenvolvedores");
  });

  it("não tem dependência de runtime", () => {
    expect(pacote.dependencies).toBeUndefined();
  });

  it("cobre um comando por recurso da API", () => {
    const fonte = readFileSync(new URL("../cli/bin/lucascavalheri.js", import.meta.url), "utf8");
    for (const comando of ["perfil", "projetos", "experiencia", "stack", "contato", "api"]) {
      expect(fonte, comando).toContain(`${comando}:`);
    }
    expect(fonte).toContain("--json");
    expect(fonte).toContain("LUCASCAVALHERI_API");
  });
});

describe("Organization no JSON-LD", () => {
  it("o nó de serviço também é Organization, com contato e endereço", () => {
    const html = ler("index.html");
    const dados = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)![1]);
    const organizacoes = dados["@graph"].filter((n: any) =>
      Array.isArray(n["@type"]) ? n["@type"].includes("Organization") : n["@type"] === "Organization"
    );
    expect(organizacoes.length).toBeGreaterThan(0);
    const principal = organizacoes.find((o: any) => o.contactPoint);
    expect(principal, "nenhuma Organization com contactPoint").toBeTruthy();
    expect(principal.address["@type"]).toBe("PostalAddress");
    expect(principal.address.addressLocality).toBe(site.cidade);
    const vendas = principal.contactPoint.find((c: any) => c.contactType === "sales");
    expect(vendas.email).toBe(site.email);
    expect(vendas.telephone).toBe(site.telefone);
  });
});

describe("migração do portfólio anterior", () => {
  const config = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));

  it("as rotas antigas respondem 301, não 404", () => {
    // 404 não diz para onde foi; 301 troca a entrada no índice do buscador
    const esperados: Record<string, string> = {
      "/projects": "/#projetos",
      "/projetos": "/#projetos",
      "/projects/:slug": "/#projetos",
      "/services": "/sobre",
      "/blog": "/",
      "/en": "/",
      "/stack": "/usos",
      "/experience": "/#experiencia",
      "/resume": "/Curriculo-LucasCavalheri.pdf",
    };
    for (const [origem, destino] of Object.entries(esperados)) {
      const regra = config.redirects.find((r: any) => r.source === origem);
      expect(regra, origem).toBeTruthy();
      expect(regra.destination, origem).toBe(destino);
      // 301 explícito: permanent:true emitiria 308, que crawler antigo pode ignorar
      expect(regra.statusCode, origem).toBe(301);
    }
  });

  it("nenhum redirect aponta para rota inexistente", () => {
    const validos = new Set([
      ...paginas.map((p) => p.rota),
      "/Curriculo-LucasCavalheri.pdf",
      "/usos",
    ]);
    for (const regra of config.redirects) {
      const base = regra.destination.split("#")[0] || "/";
      expect(validos.has(base), `${regra.source} -> ${regra.destination}`).toBe(true);
    }
  });

  it("o endereço .vercel.app não é indexável", () => {
    const regra = config.headers.find((h: any) => h.has?.[0]?.type === "host");
    expect(regra).toBeTruthy();
    // o valor é regex, então os pontos vêm escapados
    expect(regra.has[0].value.replace(/\\/g, "")).toContain("vercel.app");
    expect(regra.headers).toEqual(
      expect.arrayContaining([{ key: "X-Robots-Tag", value: "noindex, nofollow" }])
    );
  });

  it("a chave do IndexNow está publicada e o conteúdo bate com o nome", () => {
    expect(CHAVE_INDEXNOW).toMatch(/^[a-f0-9]{32}$/);
    const publicado = readFileSync(
      new URL(`../public/${CHAVE_INDEXNOW}.txt`, import.meta.url),
      "utf8"
    );
    expect(publicado.trim()).toBe(CHAVE_INDEXNOW);
  });

  it("/sitemap.xml responde no caminho convencional", () => {
    // ferramentas procuram este caminho antes do índice nomeado
    const xml = ler("sitemap.xml");
    expect(xml).toContain("<sitemapindex");
    expect(xml).toContain(`${site.url}/sitemap-0.xml`);
    expect(xml).toContain("<lastmod>");
  });

  it("o sitemap traz lastmod para o buscador revisitar", () => {
    const sitemap = ler("sitemap-0.xml");
    expect(sitemap).toContain("<lastmod>");
    expect(sitemap).toContain("<changefreq>weekly</changefreq>");
  });
});
