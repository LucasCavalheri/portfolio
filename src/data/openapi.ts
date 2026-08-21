// Especificação OpenAPI 3.1 da API pública.
//
// Três decisões que valem registro:
//   - todo schema mora em components.schemas e é referenciado por $ref, que é
//     o que gerador de cliente e function calling esperam encontrar
//   - erro segue a RFC 9457 (application/problem+json), com o mesmo objeto em
//     404, 405, 429 e 5xx
//   - a URL é versionada em /api/v1, e a política de descontinuação está
//     declarada aqui e na página de desenvolvedores
import { site } from "./site";
import { VERSAO_API, JANELA_SEGUNDOS, LIMITE_JANELA } from "./api";
import { TIPOS } from "./problema";

const referencia = (nome: string) => ({ $ref: `#/components/schemas/${nome}` });

const problema = (status: string, titulo: string, descricao: string) => ({
  [status]: {
    description: descricao,
    content: { "application/problem+json": { schema: referencia("Problema") } },
    headers:
      status === "429"
        ? {
            "Retry-After": {
              description: "Segundos a esperar antes de tentar de novo",
              schema: { type: "integer" },
            },
          }
        : undefined,
  },
});

/** Toda operação compartilha os mesmos erros e os mesmos cabeçalhos. */
const respostasComuns = {
  ...problema("404", "Não encontrado", "O recurso pedido não existe nesta API."),
  ...problema("405", "Método não permitido", "A API só aceita GET."),
  ...problema("429", "Limite excedido", "Limite de requisições excedido na janela atual."),
  ...problema("500", "Erro interno", "Falha inesperada ao montar a resposta."),
};

const cabecalhosLimite = {
  "RateLimit-Policy": {
    description: `Política declarada, no formato da RFC de rate limit: ${LIMITE_JANELA};w=${JANELA_SEGUNDOS}`,
    schema: { type: "string", example: `${LIMITE_JANELA};w=${JANELA_SEGUNDOS}` },
  },
  "RateLimit-Limit": {
    description: "Requisições permitidas na janela",
    schema: { type: "integer", example: LIMITE_JANELA },
  },
  "RateLimit-Remaining": {
    description: "Requisições restantes na janela atual",
    schema: { type: "integer", example: LIMITE_JANELA - 1 },
  },
  "RateLimit-Reset": {
    description: "Segundos até a janela reiniciar",
    schema: { type: "integer", example: JANELA_SEGUNDOS },
  },
};

const ok = (schema: string, descricao: string) => ({
  "200": {
    description: descricao,
    headers: cabecalhosLimite,
    content: { "application/json": { schema: referencia(schema) } },
  },
});

const operacao = (
  operationId: string,
  summary: string,
  description: string,
  tags: string[],
  schema: string,
  descricaoOk: string
) => ({
  get: {
    operationId,
    summary,
    description,
    tags,
    security: [],
    responses: { ...ok(schema, descricaoOk), ...respostasComuns },
  },
});

export const openapi = () => ({
  openapi: "3.1.0",
  info: {
    title: `API pública de ${site.nome}`,
    version: VERSAO_API,
    summary: "Dados do portfólio em JSON, somente leitura.",
    description: [
      `Expõe em JSON o mesmo conteúdo publicado em ${site.url}: perfil, projetos,`,
      "experiência, stack e canais de contato. Não exige autenticação, não recebe",
      "dado nenhum e não tem efeito colateral: toda operação é GET e idempotente.",
      "",
      "## Versionamento",
      "",
      "A versão está no caminho: `/api/v1/`. Dentro de uma versão, só entram",
      "mudanças compatíveis — campo novo, valor novo, recurso novo. Nada de",
      "remover campo, renomear campo ou trocar tipo: isso exigiria `/api/v2/`.",
      "",
      "## Descontinuação",
      "",
      "Uma versão a ser retirada passa a responder com os cabeçalhos `Deprecation`",
      "e `Sunset` (RFC 8594) e um `Link` com `rel=\"successor-version\"` apontando a",
      "substituta. O prazo mínimo entre o primeiro `Deprecation` e a retirada é de",
      "**180 dias**. O caminho sem versão, `/api/`, redireciona para a versão",
      "corrente e por isso pode mudar de destino: prefira a URL versionada.",
      "",
      "## Limites",
      "",
      `Cada resposta traz \`RateLimit-Policy\`, \`RateLimit-Limit\`, \`RateLimit-Remaining\``,
      `e \`RateLimit-Reset\`. A política é de ${LIMITE_JANELA} requisições por janela de`,
      `${JANELA_SEGUNDOS} segundos, por endereço de origem, aplicada na borda. Ao exceder,`,
      "a resposta é 429 com `Retry-After`.",
      "",
      "## Erros",
      "",
      "Todo erro segue a RFC 9457, em `application/problem+json`, com `type`,",
      "`title`, `status`, `detail`, `instance` e as extensões `codigo` (estável,",
      "para comparar em código) e `dica` (o que fazer em seguida).",
    ].join("\n"),
    contact: { name: site.nome, email: site.email, url: `${site.url}/contato` },
    license: { name: "CC BY 4.0", identifier: "CC-BY-4.0" },
  },
  servers: [
    { url: `${site.url}/api/v1`, description: "Versão 1, estável" },
    { url: `${site.url}/api`, description: "Sem versão: redireciona para a versão corrente" },
  ],
  externalDocs: {
    description: "Documentação para desenvolvedores",
    url: `${site.url}/desenvolvedores`,
  },
  tags: [
    { name: "descoberta", description: "Índice da API e metadados" },
    { name: "perfil", description: "Quem é, onde está e para que serve" },
    { name: "trabalho", description: "Projetos e experiência profissional" },
    { name: "contato", description: "Como falar comigo" },
  ],
  paths: {
    "/index.json": operacao(
      "obterIndiceApi",
      "Índice da API",
      "Lista os recursos disponíveis, a versão corrente, onde está o OpenAPI e a política de uso. Comece por aqui quando não souber qual endpoint chamar.",
      ["descoberta"],
      "IndiceApi",
      "Índice com recursos, versão e ponteiros de documentação"
    ),
    "/perfil.json": operacao(
      "obterPerfil",
      "Perfil profissional",
      "Nome, cargo, descrição, localização, empresa atual e as listas de quando faz sentido me chamar e quando não faz.",
      ["perfil"],
      "Perfil",
      "Perfil com disponibilidade declarada"
    ),
    "/projetos.json": operacao(
      "listarProjetos",
      "Projetos em destaque",
      "Projetos com tipo, ano, descrição, stack e link do repositório quando o código é público.",
      ["trabalho"],
      "ListaProjetos",
      "Lista de projetos, do mais recente ao mais antigo"
    ),
    "/experiencia.json": operacao(
      "listarExperiencia",
      "Experiência profissional",
      "Cargos, empresas, períodos, um resumo do que foi feito e a stack de cada um.",
      ["trabalho"],
      "ListaExperiencia",
      "Cargos em ordem cronológica inversa"
    ),
    "/stack.json": operacao(
      "listarStack",
      "Stack por categoria",
      "Tecnologias agrupadas por categoria, com o site oficial de cada uma. A lista completa está em /usos.",
      ["perfil"],
      "ListaStack",
      "Categorias com suas tecnologias"
    ),
    "/contato.json": operacao(
      "obterContato",
      "Canais de contato",
      "E-mail, telefone, link de WhatsApp com mensagem pronta, redes e o tempo de resposta esperado.",
      ["contato"],
      "Contato",
      "Canais e tempo de resposta"
    ),
  },
  components: {
    securitySchemes: {},
    schemas: {
      Problema: {
        type: "object",
        description: "Erro no formato RFC 9457, com duas extensões próprias.",
        required: ["type", "title", "status", "detail", "codigo", "dica"],
        properties: {
          type: {
            type: "string",
            format: "uri",
            description: "URI que identifica e documenta o tipo do erro",
            example: TIPOS.recursoNaoEncontrado,
          },
          title: { type: "string", description: "Resumo legível do tipo do erro" },
          status: { type: "integer", description: "Código HTTP repetido no corpo", example: 404 },
          detail: { type: "string", description: "Explicação desta ocorrência" },
          instance: { type: "string", description: "Caminho que produziu o erro" },
          codigo: {
            type: "string",
            description: "Extensão: identificador estável, seguro para comparar em código",
            example: "recurso_nao_encontrado",
          },
          dica: { type: "string", description: "Extensão: o que fazer em seguida" },
          documentacao: { type: "string", format: "uri" },
        },
      },
      Tecnologia: {
        type: "object",
        required: ["id", "nome", "site"],
        properties: {
          id: { type: "string", description: "Identificador curto", example: "typescript" },
          nome: { type: "string", example: "TypeScript" },
          site: { type: "string", format: "uri", description: "Site oficial da tecnologia" },
        },
      },
      Localizacao: {
        type: "object",
        required: ["cidade", "estado", "pais"],
        properties: {
          cidade: { type: "string", example: site.cidade },
          estado: { type: "string", example: site.estado },
          pais: { type: "string", example: site.pais },
          atendimento: { type: "string" },
        },
      },
      Empresa: {
        type: "object",
        required: ["nome"],
        properties: {
          nome: { type: "string" },
          url: { type: "string", format: "uri" },
          site: { type: "string" },
        },
      },
      Perfil: {
        type: "object",
        required: ["nome", "cargo", "descricao", "localizacao"],
        properties: {
          nome: { type: "string", example: site.nome },
          nomeCompleto: { type: "string" },
          cargo: { type: "string", example: site.cargo },
          descricao: { type: "string" },
          localizacao: referencia("Localizacao"),
          empresaAtual: referencia("Empresa"),
          disponivelPara: { type: "array", items: { type: "string" } },
          naoAtende: { type: "array", items: { type: "string" } },
          curriculo: { type: "string", format: "uri" },
          site: { type: "string", format: "uri" },
        },
      },
      Projeto: {
        type: "object",
        required: ["nome", "tipo", "ano", "descricao", "tecnologias"],
        properties: {
          nome: { type: "string", example: "EduConnect" },
          tipo: { type: "string", example: "Produto próprio" },
          ano: { type: "string", example: "2026" },
          descricao: { type: "string" },
          repositorio: { type: ["string", "null"], format: "uri" },
          site: { type: ["string", "null"], format: "uri" },
          codigoPrivado: { type: "boolean" },
          tecnologias: { type: "array", items: referencia("Tecnologia") },
        },
      },
      ListaProjetos: { type: "array", items: referencia("Projeto") },
      Experiencia: {
        type: "object",
        required: ["cargo", "empresa", "periodo", "tecnologias"],
        properties: {
          cargo: { type: "string" },
          empresa: referencia("Empresa"),
          periodo: { type: "string", example: "2024 — hoje" },
          resumo: { type: "string" },
          tecnologias: { type: "array", items: referencia("Tecnologia") },
        },
      },
      ListaExperiencia: { type: "array", items: referencia("Experiencia") },
      GrupoStack: {
        type: "object",
        required: ["categoria", "itens"],
        properties: {
          categoria: { type: "string", example: "Back-end" },
          itens: { type: "array", items: referencia("Tecnologia") },
        },
      },
      ListaStack: { type: "array", items: referencia("GrupoStack") },
      CanalContato: {
        type: "object",
        required: ["tipo", "rotulo", "valor"],
        properties: {
          tipo: { type: "string", example: "whatsapp" },
          rotulo: { type: "string", example: "WhatsApp" },
          valor: { type: "string" },
          url: { type: "string", format: "uri" },
        },
      },
      Contato: {
        type: "object",
        required: ["email", "canais"],
        properties: {
          email: { type: "string", format: "email" },
          telefone: { type: "string", example: site.telefone },
          whatsapp: { type: "string", format: "uri" },
          tempoDeResposta: { type: "string", example: "Até um dia útil" },
          canais: { type: "array", items: referencia("CanalContato") },
        },
      },
      Recurso: {
        type: "object",
        required: ["rota", "descricao"],
        properties: {
          rota: { type: "string", example: "/api/v1/perfil.json" },
          descricao: { type: "string" },
        },
      },
      PaginaSite: {
        type: "object",
        required: ["rota", "titulo"],
        properties: {
          rota: { type: "string" },
          titulo: { type: "string" },
          resumo: { type: "string" },
        },
      },
      IndiceApi: {
        type: "object",
        required: ["nome", "versao", "recursos"],
        properties: {
          nome: { type: "string" },
          versao: { type: "string", example: VERSAO_API },
          descricao: { type: "string" },
          openapi: { type: "string", format: "uri" },
          documentacao: { type: "string", format: "uri" },
          autenticacao: { type: "string", example: "nenhuma" },
          versionamento: {
            type: "object",
            properties: {
              atual: { type: "string", example: "v1" },
              caminho: { type: "string", example: `${site.url}/api/v1` },
              politica: { type: "string", format: "uri" },
              descontinuacao: { type: "string" },
            },
          },
          limiteDeUso: {
            type: "object",
            properties: {
              requisicoes: { type: "integer", example: LIMITE_JANELA },
              janelaSegundos: { type: "integer", example: JANELA_SEGUNDOS },
              cabecalhos: { type: "array", items: { type: "string" } },
            },
          },
          recursos: { type: "array", items: referencia("Recurso") },
          paginas: { type: "array", items: referencia("PaginaSite") },
        },
      },
    },
  },
  security: [],
});
