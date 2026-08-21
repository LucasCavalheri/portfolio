// Cobre a superfície de máquina: API JSON, OpenAPI, erros e o middleware que
// negocia conteúdo na borda.
import { readFileSync, existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { site, paginas } from "../src/data/site";
import { CHAVE_INDEXNOW } from "../src/data/indexnow";
import { VERSAO_API } from "../src/data/api";
import { openapi } from "../src/data/openapi";
import middleware, { corpo404Markdown, decidir, preferecMarkdown, corpoErroJson } from "../middleware";

const DIST = new URL("../dist/", import.meta.url);
const lerJson = (caminho: string) => JSON.parse(readFileSync(new URL(caminho, DIST), "utf8"));
const ler = (caminho: string) => readFileSync(new URL(caminho, DIST), "utf8");

const RECURSOS = [
  "api/index.json",
  "api/perfil.json",
  "api/projetos.json",
  "api/experiencia.json",
  "api/stack.json",
  "api/contato.json",
  "api/openapi.json",
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
    const indice = lerJson("api/index.json");
    expect(indice.versao).toBe(VERSAO_API);
    expect(indice.openapi).toBe(`${site.url}/openapi.json`);
    expect(indice.documentacao).toBe(`${site.url}/desenvolvedores`);
    expect(indice.autenticacao).toBe("nenhuma");
    expect(indice.recursos.length).toBeGreaterThanOrEqual(5);
    for (const recurso of indice.recursos) {
      expect(existsSync(new URL(recurso.rota.slice(1), DIST)), recurso.rota).toBe(true);
      expect(recurso.descricao.length).toBeGreaterThan(10);
    }
  });

  it("o perfil traz identidade, localização e disponibilidade", () => {
    const perfil = lerJson("api/perfil.json");
    expect(perfil.nome).toBe(site.nome);
    expect(perfil.cargo).toBe(site.cargo);
    expect(perfil.localizacao.cidade).toBe(site.cidade);
    expect(perfil.disponivelPara.length).toBeGreaterThan(3);
    expect(perfil.naoAtende.length).toBeGreaterThan(0);
  });

  it("projetos e experiência trazem stack tipada", () => {
    for (const arquivo of ["api/projetos.json", "api/experiencia.json"]) {
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
    const contato = lerJson("api/contato.json");
    expect(contato.email).toBe(site.email);
    expect(contato.whatsapp).toContain("api.whatsapp.com");
    for (const canal of contato.canais) expect(canal.url).toBeTruthy();
  });
});

describe("OpenAPI", () => {
  const spec = openapi();

  it("declara a versão 3.1 e o servidor de produção", () => {
    expect(spec.openapi).toBe("3.1.0");
    expect(spec.servers[0].url).toBe(site.url);
    expect(spec.info.description.length).toBeGreaterThan(100);
  });

  it("publicado em /openapi.json e /api/openapi.json, iguais", () => {
    expect(lerJson("openapi.json")).toEqual(lerJson("api/openapi.json"));
  });

  it("toda operação tem operationId único, descrição e schema de resposta", () => {
    const ids: string[] = [];
    for (const [rota, operacoes] of Object.entries(spec.paths)) {
      for (const [metodo, operacao] of Object.entries(operacoes as Record<string, any>)) {
        const onde = `${metodo.toUpperCase()} ${rota}`;
        expect(operacao.operationId, onde).toBeTruthy();
        expect(operacao.summary, onde).toBeTruthy();
        expect(operacao.description.length, onde).toBeGreaterThan(30);
        expect(operacao.tags.length, onde).toBeGreaterThan(0);
        const ok = operacao.responses["200"].content["application/json"].schema;
        expect(["object", "array"], onde).toContain(ok.type);
        expect(operacao.responses["404"], onde).toBeTruthy();
        ids.push(operacao.operationId);
      }
    }
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("cada caminho do spec existe no build", () => {
    for (const rota of Object.keys(spec.paths)) {
      expect(existsSync(new URL(rota.slice(1), DIST)), rota).toBe(true);
    }
  });

  it("descreve o formato de erro em components", () => {
    const erro = spec.components.schemas.Erro.properties.erro;
    expect(erro.required).toEqual(["status", "codigo", "mensagem", "dica"]);
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
        para: "/api/index.json",
      });
    }
  });

  it("recurso de API inexistente responde erro JSON, não HTML", () => {
    const decisao = decidir(new URL(`${site.url}/api/nao-existe.json`), null) as any;
    expect(decisao.tipo).toBe("erroJson");
    expect(decisao.status).toBe(404);
    expect(decisao.corpo.erro).toMatchObject({
      status: 404,
      codigo: "recurso_nao_encontrado",
      caminho: "/api/nao-existe.json",
    });
    expect(decisao.corpo.erro.dica).toContain("/api/index.json");
  });

  it("recurso de API existente passa direto", () => {
    expect(decidir(new URL(`${site.url}/api/perfil.json`), null)).toMatchObject({ tipo: "seguir" });
  });

  it("a resposta de erro sai como JSON com Vary e CORS", async () => {
    const resposta = middleware(new Request(`${site.url}/api/nada.json`))!;
    expect(resposta.status).toBe(404);
    expect(resposta.headers.get("content-type")).toContain("application/json");
    expect(resposta.headers.get("vary")).toContain("Accept");
    expect(resposta.headers.get("access-control-allow-origin")).toBe("*");
    const corpo = await resposta.json();
    expect(corpo.erro.documentacao).toBe(`${site.url}/desenvolvedores`);
  });

  it("a reescrita para markdown sai com Vary e o destino certo", () => {
    const resposta = middleware(
      new Request(`${site.url}/sobre`, { headers: { Accept: "text/markdown" } })
    )!;
    expect(resposta.headers.get("x-middleware-rewrite")).toBe(`${site.url}/sobre.md`);
    expect(resposta.headers.get("vary")).toContain("Accept");
  });

  it("o corpo de erro tem sempre código, mensagem, dica e ponteiros", () => {
    const { erro } = corpoErroJson(404, "teste", "mensagem", "dica", "/x");
    expect(erro).toMatchObject({ status: 404, codigo: "teste", caminho: "/x" });
    expect(erro.indice).toBe(`${site.url}/api/index.json`);
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
});

describe("descoberta para desenvolvedores", () => {
  it("a home aponta a página de desenvolvedores", () => {
    expect(ler("index.html")).toContain('href="/desenvolvedores"');
  });

  it("a página documenta autenticação, erros, exemplos e CLI", () => {
    const html = ler("desenvolvedores/index.html");
    for (const termo of ["openapi.json", "curl", "Accept: text/markdown", "npx lucascavalheri", "CC BY 4.0"]) {
      expect(html, termo).toContain(termo);
    }
    expect(html).toMatch(/<h1[\s>]/);
  });

  it("o nome do site está no título da página", () => {
    expect(ler("desenvolvedores/index.html")).toContain("<title>Desenvolvedores — API de Lucas Cavalheri</title>");
  });

  it("llms.txt lista API, OpenAPI, documentação e CLI", () => {
    const llms = ler("llms.txt");
    expect(llms).toContain("## API and developer resources");
    expect(llms).toContain(`${site.url}/openapi.json`);
    expect(llms).toContain(`${site.url}/api/index.json`);
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
      expect(regra.permanent, origem).toBe(true);
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

  it("o sitemap traz lastmod para o buscador revisitar", () => {
    const sitemap = ler("sitemap-0.xml");
    expect(sitemap).toContain("<lastmod>");
    expect(sitemap).toContain("<changefreq>weekly</changefreq>");
  });
});
