// Superfície pública de dados do portfólio: os mesmos dados que a página
// mostra, em JSON, para agentes e scripts. Sem chave e somente leitura.
import { site, paginas } from "./site";
import { experiencias, projetos, stack } from "./conteudo";
import { contatos } from "./contato";

export const VERSAO_API = "1.0.0";

const TIPO_JSON = "application/json; charset=utf-8";

/** Resposta JSON com cache curto e CORS liberado (é dado público). */
export const respostaJson = (dados: unknown, status = 200) =>
  new Response(JSON.stringify(dados, null, 2), {
    status,
    headers: {
      "Content-Type": TIPO_JSON,
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      Vary: "Accept, Accept-Encoding",
    },
  });

const tecnologia = (t: { id: string; nome: string; url: string }) => ({
  id: t.id,
  nome: t.nome,
  site: t.url,
});

export const perfil = () => ({
  nome: site.nome,
  nomeCompleto: site.nomeCompleto,
  cargo: site.cargo,
  descricao: site.descricao,
  localizacao: {
    cidade: site.cidade,
    estado: site.estado,
    pais: site.pais,
    atendimento: site.atendimento,
  },
  empresaAtual: site.empresaAtual,
  disponivelPara: site.bomPara,
  naoAtende: site.naoAtende,
  curriculo: `${site.url}${site.curriculo}`,
  site: site.url,
});

export const listaProjetos = () =>
  projetos.map((p) => ({
    nome: p.nome,
    tipo: p.tipo,
    ano: p.ano,
    descricao: p.descricao,
    repositorio: p.repo || null,
    site: p.site || null,
    codigoPrivado: p.codigoPrivado,
    tecnologias: p.tec.map(tecnologia),
  }));

export const listaExperiencia = () =>
  experiencias.map((e) => ({
    cargo: e.cargo,
    empresa: { nome: e.site, site: e.url },
    periodo: e.periodo,
    resumo: e.evidencia,
    tecnologias: e.tec.map(tecnologia),
  }));

export const listaStack = () =>
  stack.map((g) => ({ categoria: g.nome, itens: g.itens.map(tecnologia) }));

export const listaContato = () => ({
  email: site.email,
  telefone: site.telefone,
  whatsapp: site.whatsapp,
  tempoDeResposta: "Até um dia útil",
  canais: contatos
    .filter((c) => c.url)
    .map((c) => ({ tipo: c.id, rotulo: c.rotulo, valor: c.valor, url: c.url })),
});

export const indiceApi = () => ({
  nome: `API pública de ${site.nome}`,
  versao: VERSAO_API,
  descricao:
    "Dados do portfólio em JSON: perfil, projetos, experiência, stack e contato. Leitura pública, sem autenticação.",
  openapi: `${site.url}/openapi.json`,
  documentacao: `${site.url}/desenvolvedores`,
  llms: `${site.url}/llms.txt`,
  autenticacao: "nenhuma",
  limiteDeUso: "Sem limite declarado. Respostas são cacheadas por 1 hora na borda.",
  recursos: [
    { rota: "/api/perfil.json", descricao: "Identidade, localização e disponibilidade" },
    { rota: "/api/projetos.json", descricao: "Projetos com stack e links" },
    { rota: "/api/experiencia.json", descricao: "Cargos, períodos e stack de cada um" },
    { rota: "/api/stack.json", descricao: "Tecnologias por categoria" },
    { rota: "/api/contato.json", descricao: "Canais de contato e tempo de resposta" },
  ],
  paginas: paginas.map((p) => ({ rota: p.rota, titulo: p.titulo, resumo: p.resumo })),
});

/** Corpo de erro usado pela API e pelo middleware. */
export const erroJson = (
  status: number,
  codigo: string,
  mensagem: string,
  dica: string,
  caminho?: string
) => ({
  erro: {
    status,
    codigo,
    mensagem,
    dica,
    ...(caminho ? { caminho } : {}),
    documentacao: `${site.url}/desenvolvedores`,
    indice: `${site.url}/api/index.json`,
  },
});
