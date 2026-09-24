// Busca, no build, os dias de contribuição e os marcos que o gráfico da home
// mostra. Só roda no servidor: o navegador usa apenas atividade.ts.
import { contribuicoes, projetosAbertos } from "./conteudo.js";
import { API_CONTRIBUICOES, lerDias, type Dia, type Marco } from "./atividade.js";

const nomeCurto = (url: string) => new URL(url).pathname.slice(1);

// Releases saem da API do GitHub; o token, se existir no build, evita o limite
// de 60 pedidos por hora que um IP compartilhado da Vercel pode estourar.
const buscarReleases = async (repo: string, nome: string): Promise<Marco[]> => {
  const token = process.env.GITHUB_TOKEN;
  const resposta = await fetch(`https://api.github.com/repos/${repo}/releases?per_page=100`, {
    headers: { Accept: "application/vnd.github+json", ...(token && { Authorization: `Bearer ${token}` }) },
  });
  if (!resposta.ok) return [];
  const releases = (await resposta.json()) as { tag_name: string; published_at: string | null; draft: boolean }[];
  return releases
    .filter((r) => !r.draft && r.published_at)
    .reduce<Marco[]>((lista, r) => {
      // várias releases no mesmo dia viram uma linha só: "TunnelYard v3.0.4, v3.0.3"
      const data = r.published_at!.slice(0, 10);
      const doDia = lista.find((m) => m.data === data);
      if (doDia) doDia.texto += `, ${r.tag_name}`;
      else lista.push({ data, repo, texto: `${nome} ${r.tag_name}` });
      return lista;
    }, []);
};

/** Dados do gráfico no build. Qualquer falha devolve vazio e o navegador tenta depois. */
export const buscarAtividade = async () => {
  const prs: Marco[] = contribuicoes.flatMap((grupo) =>
    grupo.prs.map((pr) => ({ data: pr.data, repo: grupo.repo, texto: `PR #${pr.numero} em ${grupo.repo}` }))
  );

  const [dias, releases] = await Promise.all([
    fetch(API_CONTRIBUICOES)
      .then((r) => (r.ok ? r.json() : null))
      .then(lerDias)
      .catch(() => [] as Dia[]),
    Promise.all(
      projetosAbertos.map((p) => buscarReleases(nomeCurto(p.repo), p.nome).catch(() => [] as Marco[]))
    ).then((listas) => listas.flat()),
  ]);

  const inicio = dias[0]?.date ?? "";
  const marcos = [...prs, ...releases]
    .filter((m) => m.data >= inicio)
    .sort((a, b) => a.data.localeCompare(b.data));

  return { dias, marcos, geradoEm: Date.now() };
};
