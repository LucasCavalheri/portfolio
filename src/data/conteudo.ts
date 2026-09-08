// Projetos, experiências e a stack em destaque: a home e as versões em
// markdown leem daqui, para não existir o mesmo texto em dois lugares.
import { tec } from "./tec";

export const projetos = [
  {
    nome: "EduConnect",
    tipo: "Produto próprio",
    ano: "2026",
    descricao:
      "Plataforma escolar completa: turmas, avaliações, presença e atividades com IA.",
    tec: [tec.typescript, tec.react, tec.next, tec.drizzle, tec.tailwind, tec.postgres],
    site: "",
    repo: "",
    codigoPrivado: true,
  },
  {
    nome: "Meigana",
    tipo: "Cliente",
    ano: "2024",
    descricao: "Loja online completa, do catálogo ao checkout.",
    tec: [tec.typescript, tec.react, tec.next, tec.drizzle, tec.tailwind, tec.postgres],
    site: "",
    repo: "",
    codigoPrivado: true,
  },
  {
    nome: "TunnelYard",
    tipo: "Open source",
    ano: "2026",
    descricao:
      "App desktop nativo para gerenciar várias conexões FortiGate SSL VPN no Linux, macOS e Windows, sem passar pelo terminal. Reescrito de Electron para Rust.",
    tec: [tec.rust, tec.astro, tec.githubActions],
    site: "https://tunnelyard.lucascavalheri.com.br",
    repo: "https://github.com/LucasCavalheri/tunnel-yard",
    codigoPrivado: false,
  },
];

export const experiencias = [
  {
    cargo: "Desenvolvedor Web Full Stack Pleno, Tropical Hub",
    logo: "/tropical-hub.png",
    site: "tropicalhub.co",
    url: "https://tropicalhub.co",
    periodo: "2024 — hoje",
    evidencia:
      "Integrações com HubSpot e ERP, APIs e painéis internos. Conduzo os code reviews e o fluxo de Git da squad.",
    tec: [tec.javascript, tec.typescript, tec.react, tec.next, tec.node, tec.postgres],
  },
  {
    cargo: "Desenvolvedor Web Full Stack Júnior, Grupo Polgo",
    logo: "/grupo-polgo.png",
    site: "polgo.com.br",
    url: "https://www.polgo.com.br",
    periodo: "2023 — 2024",
    evidencia: "Aplicações web e mobile, do levantamento de requisitos ao deploy em produção.",
    tec: [tec.javascript, tec.typescript, tec.react, tec.next, tec.vue, tec.node, tec.mongo],
  },
  {
    cargo: "Desenvolvedor Freelancer, projetos independentes",
    logo: "/favicon.svg",
    site: "github.com/LucasCavalheri",
    url: "https://github.com/LucasCavalheri",
    periodo: "2022 — hoje",
    evidencia: "Produtos sob medida para pessoas e negócios, do primeiro rascunho ao que fica no ar.",
    tec: [tec.javascript, tec.typescript, tec.react, tec.next, tec.vue, tec.node, tec.postgres],
  },
];

// Home fica com o essencial; /usos tem a lista completa.
export const stack = [
  { nome: "Linguagens", itens: [tec.javascript, tec.typescript] },
  { nome: "Front-end", itens: [tec.react, tec.next, tec.vue, tec.tailwind] },
  { nome: "Back-end", itens: [tec.node, tec.express, tec.fastify, tec.nest] },
  { nome: "IA", itens: [tec.grok, tec.codex, tec.claude, tec.cursor] },
];
