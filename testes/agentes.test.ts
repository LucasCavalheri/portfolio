// Verifica o que os agentes consomem: status, tipos, markdown, JSON-LD e
// eficiência de conteúdo. Roda sobre o dist, ou seja, sobre o que é publicado.
import { readFileSync, existsSync } from "node:fs";
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

  it("a negociação e os apelidos em inglês estão declarados na hospedagem", () => {
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

    for (const [rota] of rotasHtml) {
      const regra = config.rewrites.find(
        (r: any) => r.source === rota && r.has?.[0]?.key === "accept"
      );
      expect(regra, `negociação de ${rota}`).toBeTruthy();
      expect(regra.has[0].value).toContain("text/markdown");
    }

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
    const tipos = dados["@graph"].map((n: any) => n["@type"]);
    expect(tipos).toEqual(expect.arrayContaining(["Person", "ProfessionalService", "WebSite"]));
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
    const servico = grafo()["@graph"].find((n: any) => n["@type"] === "ProfessionalService");
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
