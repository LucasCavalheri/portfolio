// Identidade visual: a fonte única das cores, fontes e medidas do site. O CSS
// dos temas sai daqui, e a página /identidade, o /identidade.md e o llms.txt
// também, para quem gera material com a minha cara (proposta, PDF, slide)
// pegar o valor que está no ar, não um copiado à mão que envelheceu.

export type Tema = "escuro" | "claro";

export type Cor = {
  /** Nome da variável CSS, sem o `--`. */
  token: string;
  nome: string;
  uso: string;
  escuro: string;
  claro: string;
};

export const cores: readonly Cor[] = [
  {
    token: "background",
    nome: "Fundo",
    uso: "Fundo da página e cor do texto em botão primário",
    escuro: "#050505",
    claro: "#ffffff",
  },
  {
    token: "foreground",
    nome: "Texto",
    uso: "Texto principal e nomes",
    escuro: "#fafafa",
    claro: "#0a0a0a",
  },
  {
    token: "primary",
    nome: "Primária",
    uso: "Títulos, destaques e fundo do botão primário",
    escuro: "#e6e6e6",
    claro: "#171717",
  },
  {
    token: "muted-foreground",
    nome: "Texto secundário",
    uso: "Parágrafos, legendas, datas e metadados",
    escuro: "#a1a1a1",
    claro: "#71717a",
  },
  {
    token: "muted",
    nome: "Superfície suave",
    uso: "Hover de botão e de link, botão de voltar ao topo",
    escuro: "#212121",
    claro: "#f4f4f5",
  },
  {
    token: "card",
    nome: "Cartão",
    uso: "Fundo de tooltip e de bloco de código",
    escuro: "#131313",
    claro: "#fafafa",
  },
  {
    token: "border",
    nome: "Borda",
    uso: "Divisórias e contorno de 1px",
    escuro: "rgba(255, 255, 255, 0.1)",
    claro: "rgba(0, 0, 0, 0.1)",
  },
  {
    token: "ring",
    nome: "Foco",
    uso: "Contorno de foco do teclado",
    escuro: "#6f6f6f",
    claro: "#a1a1aa",
  },
  {
    token: "brilho",
    nome: "Brilho",
    uso: "Reflexo que atravessa o gráfico de atividade",
    escuro: "rgba(255, 255, 255, 0.14)",
    claro: "rgba(0, 0, 0, 0.07)",
  },
];

/** Escala do gráfico de atividade, do dia vazio ao mais cheio. */
export const escala: readonly Cor[] = [
  { token: "cell-0", nome: "Nível 0", uso: "Dia sem contribuição", escuro: "#1c1c1c", claro: "#ebebee" },
  { token: "cell-1", nome: "Nível 1", uso: "Pouca contribuição", escuro: "#40403f", claro: "#c6c6cb" },
  { token: "cell-2", nome: "Nível 2", uso: "Contribuição média", escuro: "#6b6b6a", claro: "#96969d" },
  { token: "cell-3", nome: "Nível 3", uso: "Muita contribuição", escuro: "#9c9c9a", claro: "#5d5d65" },
  { token: "cell-4", nome: "Nível 4", uso: "Dia mais cheio", escuro: "#e6e6e6", claro: "#1f1f22" },
];

export const fundo = (tema: Tema) => cores[0][tema];

export type Fonte = {
  token: string;
  nome: string;
  papel: string;
  estilo: string;
  pilha: string;
  fonte: string;
};

export const fontes: readonly Fonte[] = [
  {
    token: "sans",
    nome: "Geist",
    papel: "Texto, nomes, botões e navegação",
    estilo: "Variável, 400 no texto, 500 em destaque, 600 no nome da home",
    pilha: '"Geist Variable", ui-sans-serif, system-ui, -apple-system, sans-serif',
    fonte: "https://fonts.google.com/specimen/Geist",
  },
  {
    token: "heading",
    nome: "Instrument Serif",
    papel: "Títulos de seção, sempre em itálico e em minúsculas",
    estilo: "400 itálico",
    pilha: '"Instrument Serif", Georgia, serif',
    fonte: "https://fonts.google.com/specimen/Instrument+Serif",
  },
  {
    token: "mono",
    nome: "Geist Mono",
    papel: "Código, comandos e rótulos técnicos",
    estilo: "400",
    pilha: '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
    fonte: "https://fonts.google.com/specimen/Geist+Mono",
  },
];

export const medidas = [
  { token: "radius", valor: "0.625rem", uso: "Canto de bloco de código; botão e tooltip usam 0.5rem" },
  { token: "container", valor: "40rem", uso: "Largura máxima do conteúdo, numa coluna só" },
] as const;

/** Tamanhos de texto em uso, do maior para o menor. */
export const tipos = [
  { nome: "Nome na home", valor: "Geist 600, 1.5rem, espaçamento -0.025em" },
  { nome: "Título de seção", valor: "Instrument Serif itálico, 1.25rem, altura de linha 1.75rem" },
  { nome: "Texto", valor: "Geist 400, 1rem, altura de linha 1.5" },
  { nome: "Parágrafo de página", valor: "Geist 400, 0.875rem, altura de linha 1.625rem" },
  { nome: "Legenda e metadado", valor: "Geist 400, 0.75rem" },
] as const;

/** Como a identidade se comporta, além dos valores. */
export const principios = [
  "Paleta monocromática: preto, branco e cinzas. A única cor vem dos ícones das tecnologias, na cor de cada marca.",
  "Tema escuro é o padrão. O claro inverte a escala, com os mesmos papéis.",
  "Título de seção em Instrument Serif itálica, em minúsculas e terminado por um ponto em cor secundária, como em “projetos.”.",
  "Uma coluna de no máximo 40rem, muito espaço em branco e divisórias de 1px na cor de borda, sem sombra.",
  "Texto corrido em cor secundária; o que é nome, título ou valor fica na cor de texto ou na primária.",
] as const;

const linhas = (tema: Tema) =>
  [...cores, ...escala].map((cor) => `--${cor.token}: ${cor[tema]};`);

/** As variáveis de um tema, uma por linha, para colar em CSS. */
export const variaveis = (tema: Tema) => linhas(tema).join("\n");

/** O CSS dos dois temas, como o site aplica em <html data-theme>. */
export const cssTemas = () =>
  `:root[data-theme="dark"]{${linhas("escuro").join("")}color-scheme:dark}` +
  `:root[data-theme="light"]{${linhas("claro").join("")}color-scheme:light}` +
  `:root{${fontes.map((f) => `--${f.token}: ${f.pilha};`).join("")}${medidas.map((m) => `--${m.token}: ${m.valor};`).join("")}}`;
