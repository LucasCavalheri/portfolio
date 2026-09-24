// Gráfico de contribuições do GitHub: os dados chegam no HTML, do build. Aqui
// ficam o desenho, a dica, a ligação com a seção open source e a atualização
// quando o build envelhece.
import {
  API_CONTRIBUICOES,
  dataDaPosicao,
  expandir,
  formatarData,
  htmlGrade,
  lerDias,
  type Dia,
  type DiasCompactos,
  type Marco,
} from "../data/atividade";

// A API é de terceiros: a última resposta fica guardada para a próxima visita
// não pedir de novo, e nada disso está no caminho da primeira pintura.
const CACHE = "lucas-contribuicoes";
const VALIDADE = 12 * 60 * 60 * 1000;

type Guardado = { em: number; dias: Dia[] };

const lerCache = (): Guardado | null => {
  try {
    const dados = JSON.parse(localStorage.getItem(CACHE) ?? "null") as Guardado | null;
    return dados && Array.isArray(dados.dias) && dados.dias.length ? dados : null;
  } catch {
    return null;
  }
};

const gravarCache = (dias: Dia[]) => {
  try {
    localStorage.setItem(CACHE, JSON.stringify({ em: Date.now(), dias }));
  } catch {}
};

const grid = document.querySelector<HTMLDivElement>("#contrib-grid");
const faixa = document.querySelector<HTMLDivElement>("#contrib-marcos");
const meses = document.querySelector<HTMLElement>("#contrib-months");
const total = document.querySelector<HTMLElement>("#contrib-total");
const situacao = document.querySelector<HTMLElement>("#contrib-status");
const dica = document.querySelector<HTMLDivElement>("#contrib-tip");
const linhasOpenSource = [...document.querySelectorAll<HTMLElement>(".os-linha[data-repo]")];

type DadosBuild = DiasCompactos & { marcos: [string, string, string][]; geradoEm: number };

const doBuild: DadosBuild | null = (() => {
  try {
    return JSON.parse(document.querySelector("#contrib-dados")?.textContent ?? "null");
  } catch {
    return null;
  }
})();

const marcos: Marco[] = (doBuild?.marcos ?? []).map(([data, repo, texto]) => ({ data, repo, texto }));

const desenhar = (dias: Dia[]) => {
  if (!grid) return;
  const novo = htmlGrade(dias, marcos);
  grid.innerHTML = novo.celulas;
  grid.dataset.inicio = novo.inicio;
  grid.dataset.deslocamento = String(novo.deslocamento);
  if (meses) meses.innerHTML = novo.meses;
  if (faixa) faixa.innerHTML = novo.faixa;
  if (total) total.textContent = novo.total.toLocaleString("pt-BR");
  grid.parentElement?.parentElement?.scrollTo({ left: grid.scrollWidth });
  atrasarOnda(grid);
};

/** Data de uma célula: sai da posição na grade, descontando o preenchimento. */
const dataDe = (celula: HTMLElement) => {
  const inicio = grid?.dataset.inicio;
  if (!grid || !inicio) return "";
  const indice = Array.prototype.indexOf.call(grid.children, celula);
  return dataDaPosicao(inicio, indice - (Number(grid.dataset.deslocamento) || 0));
};

// Onda diagonal: cada célula atrasa pela coluna e pela linha. O atraso não vai
// no HTML para não repetir um style em cada uma das 371.
const atrasarOnda = (alvo: HTMLElement) => {
  [...alvo.children].forEach((celula, i) => {
    (celula as HTMLElement).style.setProperty("--d", `${Math.floor(i / 7) * 9 + (i % 7) * 22}ms`);
  });
};

// A onda diagonal só dispara quando o gráfico entra na tela
const dispararOnda = (alvo: HTMLElement) => {
  const onda = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      alvo.dataset.in = "true";
      onda.disconnect();
    },
    { threshold: 0.2 }
  );
  onda.observe(alvo);
  setTimeout(() => {
    alvo.dataset.in = "true";
    onda.disconnect();
  }, 1600);
};

/** Acende os dias (e as linhas da seção open source) que casam com o filtro. */
const destacar = (filtro: ((celula: HTMLElement) => boolean) | null, repos: string[] = []) => {
  if (!grid) return;
  grid.dataset.focando = String(Boolean(filtro));
  grid.querySelectorAll<HTMLElement>(".cell[data-marcos]").forEach((celula) => {
    celula.dataset.destaque = String(Boolean(filtro?.(celula)));
  });
  faixa?.querySelectorAll<HTMLElement>(".marco").forEach((marco) => {
    const dele = (marco.dataset.repos ?? "").split(" ");
    marco.dataset.destaque = String(repos.some((r) => dele.includes(r)));
  });
  linhasOpenSource.forEach((linha) => {
    linha.dataset.destaque = String(repos.includes(linha.dataset.repo ?? ""));
  });
};

const mostrarDica = (alvo: HTMLElement, texto: string) => {
  if (!dica) return;
  const caixa = alvo.getBoundingClientRect();
  dica.textContent = texto;
  // centrada no alvo, mas sem sair da tela perto das bordas
  const metade = dica.offsetWidth / 2;
  const centro = caixa.left + caixa.width / 2;
  dica.style.left = `${Math.min(Math.max(centro, metade + 8), innerWidth - metade - 8)}px`;
  dica.style.top = `${caixa.top}px`;
  dica.dataset.visible = "true";
};

const esconderDica = () => {
  if (dica) dica.dataset.visible = "false";
};

if (grid) {
  const geradoEm = doBuild?.geradoEm ?? 0;
  const guardado = lerCache();

  // O que for mais novo entre o build e o cache do navegador vai para a tela
  const doBuildDias = doBuild ? expandir(doBuild) : [];
  if (guardado && guardado.em > geradoEm) desenhar(guardado.dias);
  else if (doBuildDias.length) desenhar(doBuildDias);
  dispararOnda(grid);

  grid.addEventListener("pointerover", (event) => {
    const celula = (event.target as Element)?.closest<HTMLElement>(".cell");
    if (!celula?.dataset.count) return;
    const quantas = Number(celula.dataset.count) || 0;
    const linhas = [
      `${formatarData(dataDe(celula))} · ${quantas} ${quantas === 1 ? "contribuição" : "contribuições"}`,
      ...(celula.dataset.marcos ? celula.dataset.marcos.split("\n") : []),
    ];
    mostrarDica(celula, linhas.join("\n"));
    const repos = (celula.dataset.repos ?? "").split(" ").filter(Boolean);
    destacar(celula.dataset.marcos ? (c) => c === celula : null, repos);
  });

  grid.addEventListener("pointerleave", () => {
    esconderDica();
    destacar(null);
  });

  // Traço da faixa: mostra tudo que saiu naquela semana
  faixa?.addEventListener("pointerover", (event) => {
    const marco = (event.target as Element)?.closest<HTMLElement>(".marco");
    if (!marco) return;
    const semana = marco.dataset.semana;
    const dias = [...grid.querySelectorAll<HTMLElement>(`.cell[data-semana="${semana}"]`)];
    const texto = dias
      .map((d) => `${formatarData(dataDe(d))}\n${d.dataset.marcos}`)
      .join("\n");
    mostrarDica(marco, texto);
    destacar((c) => c.dataset.semana === semana, (marco.dataset.repos ?? "").split(" "));
  });

  faixa?.addEventListener("pointerleave", () => {
    esconderDica();
    destacar(null);
  });

  // Na seção open source, passar por um repositório acende os dias dele
  linhasOpenSource.forEach((linha) => {
    const repo = linha.dataset.repo!;
    const ligar = () => destacar((c) => (c.dataset.repos ?? "").split(" ").includes(repo), [repo]);
    linha.addEventListener("pointerenter", ligar);
    linha.addEventListener("focus", ligar);
    linha.addEventListener("pointerleave", () => destacar(null));
    linha.addEventListener("blur", () => destacar(null));
  });

  const semDados = !grid.querySelector(".cell[data-count]");

  // Build e cache velhos: pede de novo, fora do caminho crítico
  const referencia = Math.max(geradoEm, guardado?.em ?? 0);

  if (semDados || Date.now() - referencia > VALIDADE) {
    const atualizar = () =>
      fetch(API_CONTRIBUICOES)
        .then((resposta) => {
          if (!resposta.ok) throw new Error("contribuições indisponíveis");
          return resposta.json();
        })
        .then((dados) => {
          const dias = lerDias(dados);
          if (!dias.length) throw new Error("sem dados");
          gravarCache(dias);
          desenhar(dias);
        })
        .catch(() => {
          // Com algum desenho na tela, ele fica; sem nada, avisa discretamente
          if (grid.querySelector(".cell[data-count]")) return;
          if (situacao) situacao.textContent = "ver no GitHub";
        });

    if ("requestIdleCallback" in window) requestIdleCallback(() => atualizar(), { timeout: 3000 });
    else setTimeout(atualizar, 1500);
  }
}
