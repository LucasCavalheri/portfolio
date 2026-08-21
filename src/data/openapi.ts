// Especificação OpenAPI 3.1 da API pública. Cada operação tem operationId
// único, descrição e schema de resposta, que é o que as ferramentas de
// function calling precisam para chamar sozinhas.
import { site } from "./site";
import { VERSAO_API } from "./api";

const erro = {
  type: "object",
  required: ["erro"],
  properties: {
    erro: {
      type: "object",
      required: ["status", "codigo", "mensagem", "dica"],
      properties: {
        status: { type: "integer", description: "Código HTTP repetido no corpo", example: 404 },
        codigo: {
          type: "string",
          description: "Identificador estável do erro, seguro para comparar em código",
          example: "recurso_nao_encontrado",
        },
        mensagem: { type: "string", description: "Explicação legível do que houve" },
        dica: { type: "string", description: "O que fazer em seguida para resolver" },
        caminho: { type: "string", description: "Caminho pedido, quando aplicável" },
        documentacao: { type: "string", format: "uri" },
        indice: { type: "string", format: "uri" },
      },
    },
  },
} as const;

const tecnologia = {
  type: "object",
  required: ["id", "nome", "site"],
  properties: {
    id: { type: "string", description: "Identificador curto", example: "typescript" },
    nome: { type: "string", example: "TypeScript" },
    site: { type: "string", format: "uri", description: "Site oficial da tecnologia" },
  },
} as const;

const respostas = (schema: object, descricao: string) => ({
  "200": {
    description: descricao,
    content: { "application/json": { schema } },
  },
  "404": {
    description: "Recurso inexistente. O corpo traz código, mensagem e dica.",
    content: { "application/json": { schema: { $ref: "#/components/schemas/Erro" } } },
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
      "Use para responder perguntas sobre a experiência e a disponibilidade de",
      `${site.nome}, ou para montar um contato com o contexto certo.`,
    ].join("\n"),
    contact: { name: site.nome, email: site.email, url: `${site.url}/contato` },
    license: { name: "CC BY 4.0", identifier: "CC-BY-4.0" },
  },
  servers: [{ url: site.url, description: "Produção" }],
  externalDocs: { description: "Documentação para desenvolvedores", url: `${site.url}/desenvolvedores` },
  tags: [
    { name: "descoberta", description: "Índice da API e metadados" },
    { name: "perfil", description: "Quem é, onde está e para que serve" },
    { name: "trabalho", description: "Projetos e experiência profissional" },
    { name: "contato", description: "Como falar comigo" },
  ],
  paths: {
    "/api/index.json": {
      get: {
        operationId: "obterIndiceApi",
        summary: "Índice da API",
        description:
          "Lista os recursos disponíveis, a versão, onde está o OpenAPI e a política de uso. Comece por aqui quando não souber qual endpoint chamar.",
        tags: ["descoberta"],
        security: [],
        responses: respostas(
          {
            type: "object",
            required: ["nome", "versao", "recursos"],
            properties: {
              nome: { type: "string" },
              versao: { type: "string", example: VERSAO_API },
              descricao: { type: "string" },
              openapi: { type: "string", format: "uri" },
              documentacao: { type: "string", format: "uri" },
              autenticacao: { type: "string", example: "nenhuma" },
              limiteDeUso: { type: "string" },
              recursos: {
                type: "array",
                items: {
                  type: "object",
                  required: ["rota", "descricao"],
                  properties: { rota: { type: "string" }, descricao: { type: "string" } },
                },
              },
              paginas: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    rota: { type: "string" },
                    titulo: { type: "string" },
                    resumo: { type: "string" },
                  },
                },
              },
            },
          },
          "Índice com recursos, versão e ponteiros de documentação"
        ),
      },
    },
    "/api/perfil.json": {
      get: {
        operationId: "obterPerfil",
        summary: "Perfil profissional",
        description:
          "Nome, cargo, descrição, localização, empresa atual e as listas de quando faz sentido me chamar e quando não faz.",
        tags: ["perfil"],
        security: [],
        responses: respostas(
          {
            type: "object",
            required: ["nome", "cargo", "descricao", "localizacao"],
            properties: {
              nome: { type: "string", example: site.nome },
              nomeCompleto: { type: "string" },
              cargo: { type: "string", example: site.cargo },
              descricao: { type: "string" },
              localizacao: {
                type: "object",
                properties: {
                  cidade: { type: "string" },
                  estado: { type: "string" },
                  pais: { type: "string" },
                  atendimento: { type: "string" },
                },
              },
              empresaAtual: {
                type: "object",
                properties: { nome: { type: "string" }, url: { type: "string", format: "uri" } },
              },
              disponivelPara: { type: "array", items: { type: "string" } },
              naoAtende: { type: "array", items: { type: "string" } },
              curriculo: { type: "string", format: "uri" },
              site: { type: "string", format: "uri" },
            },
          },
          "Perfil com disponibilidade declarada"
        ),
      },
    },
    "/api/projetos.json": {
      get: {
        operationId: "listarProjetos",
        summary: "Projetos em destaque",
        description:
          "Projetos com tipo, ano, descrição, stack e link do repositório quando o código é público.",
        tags: ["trabalho"],
        security: [],
        responses: respostas(
          {
            type: "array",
            items: {
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
                tecnologias: { type: "array", items: tecnologia },
              },
            },
          },
          "Lista de projetos, do mais recente ao mais antigo"
        ),
      },
    },
    "/api/experiencia.json": {
      get: {
        operationId: "listarExperiencia",
        summary: "Experiência profissional",
        description: "Cargos, empresas, períodos, um resumo do que foi feito e a stack de cada um.",
        tags: ["trabalho"],
        security: [],
        responses: respostas(
          {
            type: "array",
            items: {
              type: "object",
              required: ["cargo", "empresa", "periodo", "tecnologias"],
              properties: {
                cargo: { type: "string" },
                empresa: {
                  type: "object",
                  properties: { nome: { type: "string" }, site: { type: "string", format: "uri" } },
                },
                periodo: { type: "string", example: "2024 — hoje" },
                resumo: { type: "string" },
                tecnologias: { type: "array", items: tecnologia },
              },
            },
          },
          "Cargos em ordem cronológica inversa"
        ),
      },
    },
    "/api/stack.json": {
      get: {
        operationId: "listarStack",
        summary: "Stack por categoria",
        description:
          "Tecnologias agrupadas por categoria, com o site oficial de cada uma. A lista completa está em /usos.",
        tags: ["perfil"],
        security: [],
        responses: respostas(
          {
            type: "array",
            items: {
              type: "object",
              required: ["categoria", "itens"],
              properties: {
                categoria: { type: "string", example: "Back-end" },
                itens: { type: "array", items: tecnologia },
              },
            },
          },
          "Categorias com suas tecnologias"
        ),
      },
    },
    "/api/contato.json": {
      get: {
        operationId: "obterContato",
        summary: "Canais de contato",
        description:
          "E-mail, telefone, link de WhatsApp com mensagem pronta, redes e o tempo de resposta esperado.",
        tags: ["contato"],
        security: [],
        responses: respostas(
          {
            type: "object",
            required: ["email", "canais"],
            properties: {
              email: { type: "string", format: "email" },
              telefone: { type: "string", example: site.telefone },
              whatsapp: { type: "string", format: "uri" },
              tempoDeResposta: { type: "string", example: "Até um dia útil" },
              canais: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    tipo: { type: "string" },
                    rotulo: { type: "string" },
                    valor: { type: "string" },
                    url: { type: "string", format: "uri" },
                  },
                },
              },
            },
          },
          "Canais e tempo de resposta"
        ),
      },
    },
  },
  components: {
    schemas: { Erro: erro, Tecnologia: tecnologia },
    securitySchemes: {},
  },
  security: [],
});
