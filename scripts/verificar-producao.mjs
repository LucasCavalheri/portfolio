#!/usr/bin/env node
// Confere, contra o site publicado, tudo que só funciona em produção:
// o middleware da borda, os cabeçalhos e os arquivos de máquina.
//
//   npm run verificar:producao
//   npm run verificar:producao -- https://outro-dominio

const BASE = (process.argv[2] ?? "https://lucascavalheri.com.br").replace(/\/$/, "");

const VERDE = "\x1b[32m";
const VERMELHO = "\x1b[31m";
const CINZA = "\x1b[90m";
const FIM = "\x1b[0m";

const checagens = [
  {
    nome: "home responde markdown quando pedem markdown",
    rota: "/",
    accept: "text/markdown",
    esperado: { status: 200, tipo: "text/markdown", vary: "accept" },
  },
  {
    nome: "home segue em HTML para navegador",
    rota: "/",
    accept: "text/html",
    esperado: { status: 200, tipo: "text/html" },
  },
  {
    nome: "markdown com q menor que html devolve html",
    rota: "/",
    accept: "text/markdown;q=0.4, text/html;q=0.9",
    esperado: { status: 200, tipo: "text/html" },
  },
  {
    nome: "página inexistente devolve 404",
    rota: "/rota-que-nao-existe-" + Date.now(),
    accept: "text/html",
    esperado: { status: 404, tipo: "text/html" },
  },
  {
    nome: "404 pedido em markdown devolve 404 em markdown",
    rota: "/rota-que-nao-existe-" + Date.now(),
    accept: "text/markdown",
    esperado: { status: 404, tipo: "text/markdown", contem: "# 404" },
  },
  { nome: "índice da API", rota: "/api/v1/index.json", esperado: { status: 200, tipo: "application/json", json: (c) => Array.isArray(c.recursos) && c.versionamento?.atual === "v1" } },
  { nome: "perfil", rota: "/api/v1/perfil.json", esperado: { status: 200, tipo: "application/json", json: (c) => !!c.cargo, cabecalhos: ["ratelimit-policy", "ratelimit-remaining"] } },
  { nome: "projetos", rota: "/api/v1/projetos.json", esperado: { status: 200, tipo: "application/json", json: (c) => Array.isArray(c) && c.length > 0 } },
  { nome: "experiência", rota: "/api/v1/experiencia.json", esperado: { status: 200, tipo: "application/json" } },
  { nome: "stack", rota: "/api/v1/stack.json", esperado: { status: 200, tipo: "application/json" } },
  { nome: "contato", rota: "/api/v1/contato.json", esperado: { status: 200, tipo: "application/json" } },
  {
    nome: "caminho sem versão redireciona para v1",
    rota: "/api/perfil.json",
    semSeguir: true,
    esperado: { status: 301, localizacao: "/api/v1/perfil.json" },
  },
  {
    nome: "erro segue a RFC 9457",
    rota: "/api/v1/nao-existe.json",
    esperado: {
      status: 404,
      tipo: "application/problem+json",
      json: (c) => !!c.type && !!c.title && c.status === 404 && !!c.instance && c.codigo === "recurso_nao_encontrado",
    },
  },
  {
    nome: "método diferente de GET recebe 405",
    rota: "/api/v1/perfil.json",
    metodo: "POST",
    esperado: { status: 405, tipo: "application/problem+json", json: (c) => c.codigo === "metodo_nao_permitido" },
  },
  {
    nome: "OpenAPI 3.1 com operationId em toda operação",
    rota: "/openapi.json",
    esperado: {
      status: 200,
      tipo: "application/json",
      json: (c) =>
        c.openapi === "3.1.0" &&
        Object.values(c.paths).every((ops) => Object.values(ops).every((o) => o.operationId && o.description)),
    },
  },
  { nome: "OpenAPI no caminho versionado", rota: "/api/v1/openapi.json", esperado: { status: 200, tipo: "application/json" } },
  {
    nome: "spec com schemas nomeados e erros problem+json",
    rota: "/openapi.json",
    esperado: {
      status: 200,
      json: (c) =>
        Object.values(c.paths).every((ops) =>
          Object.values(ops).every(
            (o) =>
              o.responses["200"].content["application/json"].schema.$ref?.startsWith("#/components/schemas/") &&
              ["404", "405", "429", "500"].every((s) => o.responses[s]?.content["application/problem+json"])
          )
        ),
    },
  },
  { nome: "llms.txt com quando usar", rota: "/llms.txt", esperado: { status: 200, contem: "## When to use this" } },
  { nome: "documentação para desenvolvedores", rota: "/desenvolvedores", esperado: { status: 200, tipo: "text/html" } },
  { nome: "alias /developers", rota: "/developers", esperado: { status: 200, tipo: "text/html" } },
  { nome: "alias /docs", rota: "/docs", esperado: { status: 200, tipo: "text/html" } },
  { nome: "alias /about", rota: "/about", esperado: { status: 200, tipo: "text/html" } },
  { nome: "markdown por sufixo", rota: "/sobre.md", esperado: { status: 200, tipo: "text/markdown" } },
  { nome: "sitemap", rota: "/sitemap-index.xml", esperado: { status: 200 } },
  { nome: "robots", rota: "/robots.txt", esperado: { status: 200 } },
];

// o apex é o endereço oficial; se o www ainda for o primário na Vercel, o
// redirecionamento aparece aqui como aviso em vez de passar batido
const conferirCanonico = async () => {
  const resposta = await fetch(`${BASE}/`, { redirect: "manual" }).catch(() => null);
  const destino = resposta?.headers.get("location");
  if (resposta && [301, 307, 308].includes(resposta.status) && destino) {
    console.log(
      `${VERMELHO}!${FIM} ${BASE} redireciona para ${destino} — o endereço oficial deveria responder direto
`
    );
  }
};

const executar = async ({ nome, rota, accept, esperado, metodo, semSeguir }) => {
  const falhas = [];
  try {
    const resposta = await fetch(`${BASE}${rota}`, {
      method: metodo ?? "GET",
      headers: accept ? { Accept: accept } : {},
      redirect: semSeguir ? "manual" : "follow",
    });
    const tipo = resposta.headers.get("content-type") ?? "";
    const texto = await resposta.text();

    if (esperado.status && resposta.status !== esperado.status) {
      falhas.push(`status ${resposta.status}, esperava ${esperado.status}`);
    }
    if (esperado.tipo && !tipo.includes(esperado.tipo)) {
      falhas.push(`tipo "${tipo}", esperava "${esperado.tipo}"`);
    }
    if (esperado.vary && !(resposta.headers.get("vary") ?? "").toLowerCase().includes(esperado.vary)) {
      falhas.push(`vary "${resposta.headers.get("vary")}", esperava conter "${esperado.vary}"`);
    }
    if (esperado.contem && !texto.includes(esperado.contem)) {
      falhas.push(`corpo sem "${esperado.contem}"`);
    }
    if (esperado.localizacao && !(resposta.headers.get("location") ?? "").includes(esperado.localizacao)) {
      falhas.push(`location "${resposta.headers.get("location")}", esperava "${esperado.localizacao}"`);
    }
    for (const cabecalho of esperado.cabecalhos ?? []) {
      if (!resposta.headers.get(cabecalho)) falhas.push(`sem cabeçalho ${cabecalho}`);
    }
    if (esperado.json) {
      try {
        if (!esperado.json(JSON.parse(texto))) falhas.push("corpo JSON não passou na checagem");
      } catch {
        falhas.push("corpo não é JSON válido");
      }
    }
  } catch (erro) {
    falhas.push(`falha de rede: ${erro.message}`);
  }
  return { nome, rota, accept, falhas };
};

const conferirNpm = async () => {
  try {
    const resposta = await fetch("https://registry.npmjs.org/lucascavalheri");
    if (!resposta.ok) {
      console.log(`${VERMELHO}✗${FIM} CLI no npm ${CINZA}lucascavalheri${FIM}`);
      console.log(`    ${VERMELHO}não encontrado no registro (HTTP ${resposta.status})${FIM}`);
      return false;
    }
    const dados = await resposta.json();
    const versao = dados["dist-tags"]?.latest;
    console.log(`${VERDE}✓${FIM} CLI no npm ${CINZA}lucascavalheri@${versao}${FIM}`);
    return true;
  } catch (erro) {
    console.log(`${VERMELHO}✗${FIM} CLI no npm — ${erro.message}`);
    return false;
  }
};

console.log(`\nVerificando ${BASE}\n`);
await conferirCanonico();
const resultados = [];
for (const checagem of checagens) resultados.push(await executar(checagem));

for (const { nome, rota, accept, falhas } of resultados) {
  const marca = falhas.length ? `${VERMELHO}✗${FIM}` : `${VERDE}✓${FIM}`;
  const detalhe = accept ? `${CINZA}(Accept: ${accept})${FIM}` : "";
  console.log(`${marca} ${nome} ${CINZA}${rota}${FIM} ${detalhe}`);
  for (const falha of falhas) console.log(`    ${VERMELHO}${falha}${FIM}`);
}

const npmOk = await conferirNpm();

const quebradas = resultados.filter((r) => r.falhas.length);
if (!npmOk) quebradas.push({ nome: "CLI no npm", falhas: ["pacote ausente"] });
console.log(
  `\n${resultados.length + 1 - quebradas.length}/${resultados.length + 1} passaram` +
    (quebradas.length ? ` — ${VERMELHO}${quebradas.length} falharam${FIM}\n` : "\n")
);
process.exit(quebradas.length ? 1 : 0);
