#!/usr/bin/env node
// CLI da API pública de https://lucascavalheri.com.br
// Zero dependência: usa fetch nativo do Node 18+.

const BASE = process.env.LUCASCAVALHERI_API ?? "https://lucascavalheri.com.br";

// versão no caminho: integração não deve seguir o alias sem versão
const VERSAO = "v1";

const COMANDOS = {
  perfil: `/api/${VERSAO}/perfil.json`,
  projetos: `/api/${VERSAO}/projetos.json`,
  experiencia: `/api/${VERSAO}/experiencia.json`,
  stack: `/api/${VERSAO}/stack.json`,
  contato: `/api/${VERSAO}/contato.json`,
  api: `/api/${VERSAO}/index.json`,
};

const AJUDA = `lucascavalheri — perfil, projetos e contato pela linha de comando

Uso
  npx lucascavalheri [comando] [--json]

Comandos
  perfil        Cargo, descrição, localização e disponibilidade (padrão)
  projetos      Projetos com tipo, ano e stack
  experiencia   Cargos, empresas e períodos
  stack         Tecnologias por categoria
  contato       E-mail, WhatsApp e redes
  api           Índice da API, com todos os recursos

Opções
  --json        Imprime a resposta crua, para usar em pipe
  -h, --help    Esta ajuda
  -v, --version Versão do CLI

Ambiente
  LUCASCAVALHERI_API   Troca a origem da API (útil para testar local)

A API é versionada em /api/v1 e responde no máximo 120 requisições por minuto
por origem. Erros seguem a RFC 9457.

Documentação: https://lucascavalheri.com.br/desenvolvedores`;

const argumentos = process.argv.slice(2);
const comoJson = argumentos.includes("--json");
const positional = argumentos.filter((a) => !a.startsWith("-"));
const comando = positional[0] ?? "perfil";

if (argumentos.includes("-h") || argumentos.includes("--help")) {
  console.log(AJUDA);
  process.exit(0);
}

if (argumentos.includes("-v") || argumentos.includes("--version")) {
  console.log("1.0.0");
  process.exit(0);
}

const rota = COMANDOS[comando];
if (!rota) {
  console.error(`Comando desconhecido: ${comando}`);
  console.error(`Disponíveis: ${Object.keys(COMANDOS).join(", ")}`);
  console.error("Rode com --help para ver a ajuda.");
  process.exit(2);
}

const buscar = async () => {
  const resposta = await fetch(`${BASE}${rota}`, {
    headers: { Accept: "application/json", "User-Agent": "lucascavalheri-cli/1.0.0" },
  });
  const corpo = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    // erro segue a RFC 9457: title, detail e as extensões codigo e dica
    if (resposta.status === 429) {
      const espera = resposta.headers.get("retry-after") ?? "alguns";
      console.error(`Limite de uso excedido. Tente de novo em ${espera} segundos.`);
      process.exit(1);
    }
    console.error(
      corpo?.title
        ? `${corpo.codigo ?? corpo.title}: ${corpo.detail ?? ""}\n${corpo.dica ?? ""}`.trim()
        : `HTTP ${resposta.status}`
    );
    process.exit(1);
  }
  return corpo;
};

const linha = (rotulo, valor) => `${String(rotulo).padEnd(24)}${valor}`;

const imprimir = (dados) => {
  if (comoJson) {
    console.log(JSON.stringify(dados, null, 2));
    return;
  }

  const nomes = (itens) => itens.map((t) => t.nome).join(", ");

  if (comando === "perfil") {
    console.log(`${dados.nome} — ${dados.cargo}`);
    console.log(`${dados.localizacao.cidade}, ${dados.localizacao.estado} · ${dados.localizacao.atendimento}\n`);
    console.log(dados.descricao);
    console.log(`\nDisponível para:`);
    for (const item of dados.disponivelPara) console.log(`  · ${item}`);
    console.log(`\n${linha("Currículo", dados.curriculo)}`);
    console.log(linha("Site", dados.site));
    return;
  }

  if (comando === "projetos") {
    for (const p of dados) {
      console.log(`${p.nome} — ${p.tipo} · ${p.ano}`);
      console.log(`  ${p.descricao}`);
      console.log(`  stack: ${nomes(p.tecnologias)}`);
      console.log(`  ${p.repositorio ?? "código privado"}\n`);
    }
    return;
  }

  if (comando === "experiencia") {
    for (const e of dados) {
      console.log(`${e.cargo}`);
      console.log(`  ${e.empresa.nome} · ${e.periodo}`);
      console.log(`  ${e.resumo}`);
      console.log(`  stack: ${nomes(e.tecnologias)}\n`);
    }
    return;
  }

  if (comando === "stack") {
    for (const g of dados) console.log(linha(g.categoria, nomes(g.itens)));
    return;
  }

  if (comando === "contato") {
    console.log(linha("E-mail", dados.email));
    console.log(linha("Telefone", dados.telefone));
    console.log(linha("Resposta", dados.tempoDeResposta));
    console.log("");
    for (const c of dados.canais) console.log(linha(c.rotulo, `${c.valor} — ${c.url}`));
    return;
  }

  console.log(`${dados.nome} v${dados.versao}`);
  console.log(`${dados.descricao}\n`);
  for (const r of dados.recursos) console.log(linha(r.rota, r.descricao));
  console.log(`\n${linha("OpenAPI", dados.openapi)}`);
  console.log(linha("Documentação", dados.documentacao));
};

buscar()
  .then(imprimir)
  .catch((erro) => {
    console.error(`Falha ao consultar ${BASE}${rota}: ${erro.message}`);
    process.exit(1);
  });
