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
  {
    nome: "recurso de API inexistente devolve erro JSON",
    rota: "/api/nao-existe.json",
    esperado: { status: 404, tipo: "application/json", json: (c) => c.erro?.codigo === "recurso_nao_encontrado" && !!c.erro?.dica },
  },
  { nome: "índice da API", rota: "/api/index.json", esperado: { status: 200, tipo: "application/json", json: (c) => Array.isArray(c.recursos) } },
  { nome: "perfil", rota: "/api/perfil.json", esperado: { status: 200, tipo: "application/json", json: (c) => !!c.cargo } },
  { nome: "projetos", rota: "/api/projetos.json", esperado: { status: 200, tipo: "application/json", json: (c) => Array.isArray(c) && c.length > 0 } },
  { nome: "experiência", rota: "/api/experiencia.json", esperado: { status: 200, tipo: "application/json" } },
  { nome: "stack", rota: "/api/stack.json", esperado: { status: 200, tipo: "application/json" } },
  { nome: "contato", rota: "/api/contato.json", esperado: { status: 200, tipo: "application/json" } },
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
  { nome: "OpenAPI no caminho alternativo", rota: "/api/openapi.json", esperado: { status: 200, tipo: "application/json" } },
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

const executar = async ({ nome, rota, accept, esperado }) => {
  const falhas = [];
  try {
    const resposta = await fetch(`${BASE}${rota}`, {
      headers: accept ? { Accept: accept } : {},
      redirect: "follow",
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

const quebradas = resultados.filter((r) => r.falhas.length);
console.log(
  `\n${resultados.length - quebradas.length}/${resultados.length} passaram` +
    (quebradas.length ? ` — ${VERMELHO}${quebradas.length} falharam${FIM}\n` : "\n")
);
process.exit(quebradas.length ? 1 : 0);
