#!/usr/bin/env node
// Empurra as URLs do site para os buscadores que suportam IndexNow.
// O Google não participa: para ele, use o Search Console (veja o README).
//
//   npm run indexnow            # envia as URLs do sitemap
//   npm run indexnow -- --antigas   # inclui as rotas do portfolio anterior,
//                                   # para o índice trocá-las pelas novas

import { readFileSync } from "node:fs";

const CHAVE = readFileSync(new URL("../src/data/indexnow.ts", import.meta.url), "utf8").match(
  /CHAVE_INDEXNOW = "([a-f0-9]+)"/
)[1];

const HOST = "lucascavalheri.com.br";
const SITE = `https://${HOST}`;

const ROTAS_ATUAIS = [
  "/",
  "/sobre",
  "/contato",
  "/usos",
  "/desenvolvedores",
  "/privacidade",
  "/llms.txt",
  "/openapi.json",
  "/api/index.json",
  "/index.md",
  "/sobre.md",
  "/contato.md",
  "/usos.md",
  "/desenvolvedores.md",
];

// rotas que não existem mais: submetê-las faz o buscador revisitar, ver o 301
// e substituir a entrada antiga pela nova
const ROTAS_ANTIGAS = [
  "/projects",
  "/projetos",
  "/services",
  "/blog",
  "/en",
  "/pt",
  "/stack",
  "/experience",
  "/resume",
];

const incluirAntigas = process.argv.includes("--antigas");
const urls = [...ROTAS_ATUAIS, ...(incluirAntigas ? ROTAS_ANTIGAS : [])].map((r) => `${SITE}${r}`);

const ENDPOINTS = [
  "https://api.indexnow.org/indexnow",
  "https://www.bing.com/indexnow",
  "https://yandex.com/indexnow",
];

console.log(`\nIndexNow — ${urls.length} URLs${incluirAntigas ? " (com as rotas antigas)" : ""}`);
console.log(`chave: ${CHAVE}\n`);

// a chave precisa estar acessível, senão o envio é recusado
const confirmacao = await fetch(`${SITE}/${CHAVE}.txt`).catch(() => null);
if (!confirmacao?.ok) {
  console.error(`A chave não responde em ${SITE}/${CHAVE}.txt — publique o site antes de enviar.`);
  process.exit(1);
}
console.log(`chave confirmada em ${SITE}/${CHAVE}.txt`);

let falhas = 0;
for (const endpoint of ENDPOINTS) {
  try {
    const resposta = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host: HOST, key: CHAVE, keyLocation: `${SITE}/${CHAVE}.txt`, urlList: urls }),
    });
    // 200 e 202 são aceite; 422 costuma ser URL fora do host declarado
    const ok = resposta.status === 200 || resposta.status === 202;
    console.log(`${ok ? "enviado " : "recusado"} ${endpoint} — HTTP ${resposta.status}`);
    if (!ok) {
      falhas += 1;
      console.log(`  ${(await resposta.text()).slice(0, 200)}`);
    }
  } catch (erro) {
    falhas += 1;
    console.log(`falhou   ${endpoint} — ${erro.message}`);
  }
}

console.log(
  falhas === 0
    ? "\nTodos os endpoints aceitaram. O reprocessamento leva de horas a poucos dias.\n"
    : `\n${falhas} endpoint(s) recusaram. Os demais seguem valendo.\n`
);
process.exit(falhas === ENDPOINTS.length ? 1 : 0);
