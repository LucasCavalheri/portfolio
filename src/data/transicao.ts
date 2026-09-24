// Nome de view transition por repositório: a linha da home e o card de
// /open-source usam o mesmo, e o navegador anima um no outro.
export const nomeTransicao = (repo: string) =>
  `os-${repo.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
