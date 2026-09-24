// Projetos, experiências e a stack em destaque: a home e as versões em
// markdown leem daqui, para não existir o mesmo texto em dois lugares.
import { tec } from "./tec";

export const projetos = [
  {
    nome: "HuskMap",
    tipo: "Open source",
    ano: "2026",
    descricao:
      "Mapa do que agentes de código como Claude Code, Codex e Cursor deixam no disco: worktrees, node_modules, sessões e caches. Protege o trabalho não salvo e manda o resto para a lixeira. App desktop, TUI e CLI para Linux, em Rust.",
    tec: [tec.rust, tec.astro, tec.githubActions],
    site: "https://huskmap.lucascavalheri.com.br",
    repo: "https://github.com/LucasCavalheri/huskmap",
    codigoPrivado: false,
  },
  {
    nome: "TunnelYard",
    tipo: "Open source",
    ano: "2026",
    descricao:
      "App desktop nativo para gerenciar várias conexões FortiGate SSL VPN no Linux, sem terminal como root: openfortivpn com PolicyKit por baixo. Reescrito de Electron para Rust.",
    tec: [tec.rust, tec.astro, tec.githubActions],
    site: "https://tunnelyard.lucascavalheri.com.br",
    repo: "https://github.com/LucasCavalheri/tunnel-yard",
    codigoPrivado: false,
  },
  {
    nome: "Meigana",
    tipo: "Cliente",
    ano: "2024",
    descricao: "Loja online completa, do catálogo ao checkout.",
    tec: [tec.ruby, tec.rails, tec.postgres],
    site: "",
    repo: "",
    codigoPrivado: true,
  },
];

// PRs meus que foram mergeados em projetos de terceiros, agrupados por
// repositório. `versao` vem do prefixo [13.x] que o Laravel usa no título.
export const openSource = [
  {
    repo: "laravel/framework",
    nota: "O core do Laravel.",
    tec: tec.laravel,
    prs: [
      { numero: 60268, versao: "13.x", titulo: "Add attachFromStorage helpers to notification MailMessage", data: "2026-05-27" },
      { numero: 60239, versao: "13.x", titulo: "Allow JsonSchema fluent boolean flags to be unset", data: "2026-05-23" },
      { numero: 60214, versao: "13.x", titulo: "Fix async HTTP retries when using array backoff values", data: "2026-05-22" },
    ],
  },
  {
    repo: "laravel/laravel",
    nota: "A estrutura inicial de todo projeto Laravel.",
    tec: tec.laravel,
    prs: [
      { numero: 6824, versao: "13.x", titulo: "Render JSON exceptions for API routes by default", data: "2026-05-25" },
    ],
  },
  {
    repo: "laravel/docs",
    nota: "A documentação oficial.",
    tec: tec.laravel,
    prs: [
      { numero: 11211, versao: "13.x", titulo: "Document remember me support in Sanctum SPA authentication", data: "2026-05-21" },
    ],
  },
  {
    repo: "no-js-dev/nojs",
    nota: "Framework reativo que roda só com atributos HTML.",
    tec: tec.javascript,
    prs: [
      { numero: 87, titulo: "Fix error=\"#template\" renders: animate, bind, and multi-field re-render", data: "2026-06-01" },
      { numero: 86, titulo: "Fix $form.submitting for native POST forms and reactive show/hide bindings", data: "2026-06-01" },
    ],
  },
  {
    repo: "vscode-icons/vscode-icons",
    nota: "Ícones de arquivo do VS Code.",
    tec: tec.vscode,
    prs: [{ numero: 4200, titulo: "Add Grok icon", data: "2026-08-14" }],
  },
  {
    repo: "Ileriayo/markdown-badges",
    nota: "Badges para READMEs.",
    tec: tec.github,
    prs: [{ numero: 989, titulo: "Add Claude Code badge", data: "2026-07-21" }],
  },
  {
    repo: "chakra-ui/chakra-ui",
    nota: "Biblioteca de componentes React.",
    tec: tec.react,
    prs: [{ numero: 9416, titulo: "Add proper typing for InputGroup children prop", data: "2025-01-03" }],
  },
  {
    repo: "adonisjs/v5-docs",
    nota: "Documentação do AdonisJS 5.",
    tec: tec.node,
    prs: [{ numero: 238, titulo: "Fix @adonisjs/auth version for v5 users", data: "2024-01-20" }],
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
  { nome: "Back-end", itens: [tec.node, tec.rails, tec.laravel] },
  { nome: "IA", itens: [tec.claude, tec.claudeCode, tec.chatgpt, tec.codex] },
];
