// Verifica o que os agentes consomem: status, tipos, markdown, JSON-LD e
// eficiência de conteúdo. Roda sobre o dist, ou seja, sobre o que é publicado.
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { paginas, site } from "../src/data/site";

const DIST = new URL("../dist/", import.meta.url);

const ler = (caminho: string) => readFileSync(new URL(caminho, DIST), "utf8");
const existe = (caminho: string) => existsSync(new URL(caminho, DIST));

/** Só o texto que um leitor vê: sem script, style, svg nem tags. */
const textoVisivel = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<svg[\s\S]*?<\/svg>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const rotasHtml = [
  ["/", "index.html"],
  ["/sobre", "sobre/index.html"],
  ["/contato", "contato/index.html"],
  ["/usos", "usos/index.html"],
  ["/privacidade", "privacidade/index.html"],
] as const;

describe("404 para agentes", () => {
  it("gera a página que a hospedagem serve com status 404", () => {
    expect(existe("404.html")).toBe(true);
  });

  it("aponta o caminho de volta: páginas do site e arquivos de máquina", () => {
    const html = ler("404.html");
    for (const pagina of paginas) {
      if (pagina.rota !== "/") expect(html).toContain(`href="${pagina.rota}"`);
    }
    expect(html).toContain('href="/llms.txt"');
    expect(html).toContain('href="/sitemap-index.xml"');
  });

  it("tem versão em markdown com os mesmos ponteiros", () => {
    const md = ler("404.md");
    expect(md.startsWith("# 404")).toBe(true);
    expect(md).toContain("/llms.txt");
    expect(md).toContain("/sitemap-index.xml");
    expect(md.length).toBeGreaterThan(300);
  });
});

describe("conteúdo sem JavaScript", () => {
  for (const [rota, arquivo] of rotasHtml) {
    it(`${rota} traz H1 e texto suficiente no HTML bruto`, () => {
      const html = ler(arquivo);
      const h1 = html.match(/<h1[\s>]/g) ?? [];
      expect(h1).toHaveLength(1);
      expect(html).toMatch(/<h2[\s>]/);
      expect(textoVisivel(html).length).toBeGreaterThan(500);
    });
  }

  it("a home mantém hierarquia h1 > h2 > h3", () => {
    const html = ler("index.html");
    const ordem = [...html.matchAll(/<h([1-3])[\s>]/g)].map((m) => Number(m[1]));
    expect(ordem[0]).toBe(1);
    // nenhum salto: um h3 nunca aparece antes do primeiro h2
    expect(ordem.indexOf(2)).toBeLessThan(ordem.indexOf(3));
  });
});

describe("markdown por Accept e por sufixo .md", () => {
  const md = [
    ["index.md", "# Lucas Cavalheri"],
    ["sobre.md", "# Sobre"],
    ["contato.md", "# Contato"],
    ["usos.md", "# Usos"],
    ["privacidade.md", "# Privacidade"],
  ] as const;

  for (const [arquivo, titulo] of md) {
    it(`${arquivo} começa pelo título e tem corpo`, () => {
      const corpo = ler(arquivo);
      expect(corpo.startsWith(titulo)).toBe(true);
      expect(corpo.length).toBeGreaterThan(400);
      expect(corpo).toContain(site.url);
    });
  }

  it("cada rota HTML tem um .md correspondente", () => {
    for (const [rota] of rotasHtml) {
      const arquivo = rota === "/" ? "index.md" : `${rota.slice(1)}.md`;
      expect(existe(arquivo), arquivo).toBe(true);
    }
  });

  it("os cabeçalhos e os apelidos em inglês estão declarados na hospedagem", () => {
    const config = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));

    // Vary: Accept em toda resposta, para o CDN não misturar as variantes
    const varyGeral = config.headers.find((h: any) => h.source === "/(.*)");
    expect(varyGeral.headers).toEqual(
      expect.arrayContaining([{ key: "Vary", value: "Accept, Accept-Encoding" }])
    );

    const md = config.headers.find((h: any) => h.source.includes(".md"));
    expect(md.headers).toEqual(
      expect.arrayContaining([{ key: "Content-Type", value: "text/markdown; charset=utf-8" }])
    );

    // a negociação por Accept é feita pelo middleware, coberta em api.test.ts:
    // regra condicional no vercel.json não dispara, o cache responde antes
    expect(config.rewrites.every((r: any) => !r.has)).toBe(true);

    for (const [ingles, portugues] of [
      ["/about", "/sobre"],
      ["/contact", "/contato"],
      ["/privacy", "/privacidade"],
    ]) {
      expect(config.rewrites).toEqual(
        expect.arrayContaining([{ source: ingles, destination: portugues }])
      );
    }
  });
});

describe("llms.txt", () => {
  const conteudo = () => ler("llms.txt");

  it("existe e nomeia o site", () => {
    expect(conteudo()).toContain(`# ${site.nome}`);
  });

  it("diz quando usar, quando não usar e como chamar", () => {
    const texto = conteudo();
    expect(texto).toContain("## When to use this");
    expect(texto).toContain("## When not to use this");
    expect(texto).toContain("## How to reach out");
    expect(texto).toContain(site.email);
    for (const caso of site.bomPara) expect(texto).toContain(caso);
  });

  it("lista as páginas e os arquivos de máquina", () => {
    const texto = conteudo();
    for (const pagina of paginas) expect(texto).toContain(`${site.url}${pagina.rota}`);
    expect(texto).toContain("/sitemap-index.xml");
    expect(texto).toContain("Accept: text/markdown");
  });
});

describe("páginas de confiança", () => {
  for (const rota of ["sobre", "contato", "privacidade"] as const) {
    it(`/${rota} tem mais de 500 caracteres de texto`, () => {
      expect(textoVisivel(ler(`${rota}/index.html`)).length).toBeGreaterThan(500);
    });
  }

  it("estão no sitemap", () => {
    const sitemap = ler("sitemap-0.xml");
    for (const rota of ["sobre", "contato", "privacidade", "usos"]) {
      expect(sitemap).toContain(`${site.url}/${rota}`);
    }
  });

  it("são alcançáveis pelo rodapé", () => {
    const html = ler("index.html");
    for (const rota of ["/sobre", "/contato", "/privacidade", "/usos", "/llms.txt"]) {
      expect(html).toContain(`href="${rota}"`);
    }
  });
});

describe("JSON-LD", () => {
  const grafo = () => {
    const html = ler("index.html");
    const bruto = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    return JSON.parse(bruto![1]);
  };

  it("é um @graph válido com Person, ProfessionalService e WebSite", () => {
    const dados = grafo();
    expect(dados["@context"]).toBe("https://schema.org");
    const tipos = dados["@graph"].flatMap((n: any) => n["@type"]);
    expect(tipos).toEqual(
      expect.arrayContaining(["Person", "Organization", "ProfessionalService", "WebSite"])
    );
  });

  it("a Person tem nome, descrição, url e redes", () => {
    const pessoa = grafo()["@graph"].find((n: any) => n["@type"] === "Person");
    expect(pessoa.name).toBe(site.nome);
    expect(pessoa.description.length).toBeGreaterThan(50);
    expect(pessoa.url).toBe(site.url);
    expect(pessoa.sameAs.length).toBeGreaterThanOrEqual(4);
    expect(pessoa.address["@type"]).toBe("PostalAddress");
  });

  it("o serviço tem contactPoint com e-mail e telefone, e endereço", () => {
    const servico = grafo()["@graph"].find((n: any) =>
      Array.isArray(n["@type"]) ? n["@type"].includes("ProfessionalService") : n["@type"] === "ProfessionalService"
    );
    expect(servico.description.length).toBeGreaterThan(50);
    expect(servico.address.addressLocality).toBe(site.cidade);
    expect(servico.address.addressCountry).toBe(site.pais);
    const contatoVendas = servico.contactPoint.find((c: any) => c.contactType === "sales");
    expect(contatoVendas.email).toBe(site.email);
    expect(contatoVendas.telephone).toBe(site.telefone);
  });
});

describe("estilo não vaza entre páginas", () => {
  // os <style> passaram a is:global para tirar 12 KB de atributos de escopo do
  // HTML; em troca, seletor de elemento puro passaria a valer em todo o site
  const comEstiloGlobal = [
    "src/pages/index.astro",
    "src/pages/usos.astro",
    "src/components/PaginaTexto.astro",
    "src/components/Header.astro",
    "src/components/Footer.astro",
    "src/components/ScrollTop.astro",
    "src/components/Tec.astro",
  ];

  for (const arquivo of comEstiloGlobal) {
    it(`${arquivo} não declara seletor de elemento solto`, () => {
      const fonte = readFileSync(new URL(`../${arquivo}`, import.meta.url), "utf8");
      const inicio = fonte.indexOf("<style is:global>");
      if (inicio < 0) return;
      const css = fonte.slice(inicio);
      const soltos = [...css.matchAll(/^ {2}([a-z][a-z0-9]*(?:\s*,\s*[a-z][a-z0-9]*)*)\s*\{/gm)];
      expect(soltos.map((m) => m[1])).toEqual([]);
    });
  }

  it("as páginas preservam as classes que carregam o visual", () => {
    const home = ler("index.html");
    for (const classe of [
      "activity-grid",
      "tec-row",
      "avatar-glow",
      "botao-copiar",
      "empresa-logo",
      "nav-line",
      "contato-icone",
      "row-meta",
      "pagina-home",
    ]) {
      expect(home, classe).toContain(classe);
    }
    expect(ler("usos/index.html")).toContain("pagina-usos");
    expect(ler("sobre/index.html")).toContain("pagina-texto");
  });
});

describe("robots.txt", () => {
  it("libera o rastreamento e aponta o sitemap", () => {
    const robots = ler("robots.txt");
    expect(robots).toContain("Allow: /");
    expect(robots).toContain(`${site.url}/sitemap-index.xml`);
  });

  it("declara Content Signals e o manifesto ARD", () => {
    const robots = ler("robots.txt");
    expect(robots).toContain("Content-Signal: ai-train=yes, search=yes, ai-input=yes");
    expect(robots).toContain(`Agentmap: ${site.url}/.well-known/ai-catalog.json`);
  });
});

describe("descoberta para agentes", () => {
  it("a home anuncia catálogo, OpenAPI, docs e ARD no HTML", () => {
    const html = ler("index.html");
    expect(html).toContain('rel="api-catalog"');
    expect(html).toContain('href="/.well-known/api-catalog"');
    expect(html).toContain('rel="service-desc"');
    expect(html).toContain('href="/openapi.json"');
    expect(html).toContain('rel="ai-catalog"');
    expect(html).toContain('href="/.well-known/ai-catalog.json"');
  });

  it("o Link da hospedagem casa com o do middleware", async () => {
    const { LINK_DESCOBERTA: doSite } = await import("../src/data/agentes");
    const { LINK_DESCOBERTA: daBorda } = await import("../middleware");
    expect(daBorda).toBe(doSite);

    const config = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
    const home = config.headers.find((h: { source: string }) => h.source === "/");
    expect(home.headers).toEqual(expect.arrayContaining([{ key: "Link", value: doSite }]));
  });

  it("o catálogo RFC 9727 lista a API e o MCP", () => {
    const catalogo = JSON.parse(ler(".well-known/api-catalog"));
    expect(Array.isArray(catalogo.linkset)).toBe(true);
    const ancoras = catalogo.linkset.map((item: { anchor: string }) => item.anchor);
    expect(ancoras).toEqual(expect.arrayContaining([`${site.url}/api/v1`, `${site.url}/mcp`]));
    const api = catalogo.linkset.find((item: { anchor: string }) => item.anchor.endsWith("/api/v1"));
    expect(api["service-desc"][0].href).toBe(`${site.url}/openapi.json`);
    expect(api["service-doc"][0].href).toBe(`${site.url}/desenvolvedores`);
    expect(api.status[0].href).toBe(`${site.url}/api/v1/index.json`);
  });

  it("OAuth PRM e AS descrevem o issuer e o método anônimo", () => {
    const prm = JSON.parse(ler(".well-known/oauth-protected-resource"));
    expect(prm.resource).toBe(`${site.url}/api/v1`);
    expect(prm.authorization_servers).toEqual([site.url]);
    expect(prm.scopes_supported).toContain("portfolio:read");
    expect(prm.bearer_methods_supported).toContain("header");

    const as = JSON.parse(ler(".well-known/oauth-authorization-server"));
    expect(as.issuer).toBe(site.url);
    expect(as.authorization_endpoint).toContain("/oauth/authorize");
    expect(as.token_endpoint).toContain("/oauth/token");
    expect(as.jwks_uri).toContain("/.well-known/jwks.json");
    expect(as.grant_types_supported).toContain("client_credentials");
    expect(as.response_types_supported).toContain("token");
    expect(as.agent_auth.skill).toBe(`${site.url}/auth.md`);
    expect(as.agent_auth.register_uri).toContain("/agent/identity");
    expect(as.agent_auth.identity_types_supported).toContain("anonymous");
    expect(as.agent_auth.anonymous.claim_uri).toContain("/agent/identity/claim");

    expect(JSON.parse(ler(".well-known/openid-configuration"))).toEqual(as);
    expect(JSON.parse(ler(".well-known/jwks.json")).keys).toEqual([]);
  });

  it("auth.md começa pelo título exigido e diz que a API é pública", () => {
    const md = ler("auth.md");
    expect(md.startsWith("# auth.md")).toBe(true);
    expect(md).toContain("pública");
    expect(md).toContain("/.well-known/oauth-protected-resource");
    expect(md).toContain("/agent/identity");
  });

  it("o cartão MCP declara servidor, transporte e ferramentas", () => {
    const cartao = JSON.parse(ler(".well-known/mcp/server-card.json"));
    expect(cartao.serverInfo.name).toBe("lucascavalheri-portfolio");
    expect(cartao.serverInfo.version).toBeTruthy();
    expect(cartao.endpoint).toBe(`${site.url}/mcp`);
    expect(cartao.transport.type).toBe("streamable-http");
    expect(cartao.transport.endpoint).toBe(`${site.url}/mcp`);
    expect(cartao.capabilities.tools).toBeTruthy();
  });

  it("o índice de skills segue o schema 0.2.0 e o digest bate com o arquivo", async () => {
    const { createHash } = await import("node:crypto");
    const indice = JSON.parse(ler(".well-known/agent-skills/index.json"));
    expect(indice.$schema).toBe("https://schemas.agentskills.io/discovery/0.2.0/schema.json");
    expect(indice.skills.length).toBeGreaterThanOrEqual(3);
    for (const skill of indice.skills) {
      expect(skill.name).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      expect(skill.type).toBe("skill-md");
      expect(skill.description.length).toBeGreaterThan(20);
      expect(skill.url).toBe(`/.well-known/agent-skills/${skill.name}/SKILL.md`);
      expect(skill.digest).toMatch(/^sha256:[a-f0-9]{64}$/);
      const corpo = ler(`.well-known/agent-skills/${skill.name}/SKILL.md`);
      expect(corpo.startsWith(`---\nname: ${skill.name}`)).toBe(true);
      const digest = `sha256:${createHash("sha256").update(corpo).digest("hex")}`;
      expect(skill.digest).toBe(digest);
    }
  });

  it("o manifesto ARD tem host, entradas urn:air e queries", () => {
    const catalogo = JSON.parse(ler(".well-known/ai-catalog.json"));
    expect(catalogo.specVersion).toBeTruthy();
    expect(catalogo.host.displayName).toBe(site.nome);
    expect(catalogo.host.identifier).toBe("did:web:lucascavalheri.com.br");
    expect(catalogo.entries.length).toBeGreaterThanOrEqual(2);
    for (const entrada of catalogo.entries) {
      expect(entrada.identifier).toMatch(/^urn:air:lucascavalheri\.com\.br:/);
      expect(entrada.displayName).toBeTruthy();
      expect(entrada.type).toMatch(/\//);
      expect(Boolean(entrada.url) !== Boolean(entrada.data)).toBe(true);
      expect(entrada.representativeQueries.length).toBeGreaterThanOrEqual(2);
      expect(entrada.representativeQueries.length).toBeLessThanOrEqual(5);
    }
  });

  it("WebMCP registra ferramentas no carregamento da página", () => {
    const fonte = readFileSync(new URL("../src/scripts/webmcp.ts", import.meta.url), "utf8");
    expect(fonte).toContain("registerTool");
    expect(fonte).toContain("provideContext");
    expect(fonte).toContain("inputSchema");
    expect(fonte).toContain("get_perfil");

    const pasta = new URL("../dist/_astro/", import.meta.url);
    const js = readdirSync(pasta)
      .filter((arquivo: string) => arquivo.endsWith(".js"))
      .map((arquivo: string) => readFileSync(new URL(arquivo, pasta), "utf8"))
      .join("\n");
    expect(js).toContain("get_perfil");
    expect(js).toContain("registerTool");
  });
});

describe("eficiência de conteúdo", () => {
  it("a home tem pelo menos 5% de texto legível", () => {
    const html = ler("index.html");
    const proporcao = (100 * textoVisivel(html).length) / html.length;
    expect(proporcao).toBeGreaterThan(5);
  });

  it("o sprite leva só os ícones que a página usa", () => {
    for (const [, arquivo] of rotasHtml) {
      const html = ler(arquivo);
      const declarados = new Set([...html.matchAll(/<symbol id="([^"]+)"/g)].map((m) => m[1]));
      const usados = new Set([...html.matchAll(/<use href="#([^"]+)"/g)].map((m) => m[1]));
      for (const id of usados) expect(declarados.has(id), `${arquivo} sem #${id}`).toBe(true);
      // nenhum símbolo sobrando
      for (const id of declarados) expect(usados.has(id), `${arquivo} declara #${id} sem uso`).toBe(true);
    }
  });
});
