// Gráfico de contribuições do GitHub: o desenho da grade, usado no build e no
// navegador. Sem imports de conteúdo: isto entra no bundle do cliente.

export const USUARIO = "LucasCavalheri";
export const API_CONTRIBUICOES = `https://github-contributions-api.jogruber.de/v4/${USUARIO}?y=last`;
export const DIAS_VISIVEIS = 371;
export const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export type Dia = { date: string; count: number; level: number };

/** Algo que foi entregue num dia: PR mergeado ou release de projeto meu. */
export type Marco = { data: string; repo: string; texto: string };

export const formatarData = (iso: string) => {
  const [ano, mes, dia] = iso.split("-");
  return `${dia} ${MESES[Number(mes) - 1]} ${ano}`;
};

/** Converte a resposta da API nos últimos dias visíveis; vazio se vier torta. */
export const lerDias = (dados: unknown): Dia[] => {
  const lista = (dados as { contributions?: unknown })?.contributions;
  return Array.isArray(lista) ? (lista.slice(-DIAS_VISIVEIS) as Dia[]) : [];
};

/** Posição de cada dia na grade (coluna = semana, linha = dia da semana). */
export const montarGrade = (dias: Dia[]) => {
  const deslocamento = dias.length ? new Date(`${dias[0].date}T12:00:00`).getDay() : 0;
  const colunas = Math.ceil((dias.length + deslocamento) / 7);

  const celulas = dias.map((dia, indice) => {
    const coluna = Math.floor((indice + deslocamento) / 7);
    const linha = (indice + deslocamento) % 7;
    return { ...dia, coluna, linha, nivel: Math.min(4, Math.max(0, Number(dia.level) || 0)) };
  });

  const meses: { coluna: number; largura: number; rotulo: string }[] = [];
  celulas.forEach((celula) => {
    const mes = Number(celula.date.split("-")[1]);
    const anterior = meses[meses.length - 1];
    if (anterior && anterior.rotulo === MESES[mes - 1]) return;
    meses.push({ coluna: celula.coluna, largura: 0, rotulo: MESES[mes - 1] });
  });
  meses.forEach((mes, i) => {
    mes.largura = Math.max(1, (meses[i + 1]?.coluna ?? colunas) - mes.coluna);
  });

  return { deslocamento, colunas, celulas, meses };
};

/** Marcos agrupados por dia, para a célula e a faixa abaixo do gráfico. */
export const marcosPorDia = (marcos: Marco[]) => {
  const mapa = new Map<string, Marco[]>();
  for (const marco of marcos) mapa.set(marco.data, [...(mapa.get(marco.data) ?? []), marco]);
  return mapa;
};

const esc = (texto: string) =>
  texto.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

const reposDe = (marcos: Marco[]) => esc([...new Set(marcos.map((m) => m.repo))].join(" "));

/**
 * Dias compactados para ir no HTML: data inicial, níveis numa string ("0123")
 * e contagens separadas por vírgula. Uns 2 KB contra ~20 KB de células prontas.
 */
export type DiasCompactos = { inicio: string; niveis: string; contagens: string };

export const compactar = (dias: Dia[]): DiasCompactos => ({
  inicio: dias[0]?.date ?? "",
  niveis: dias.map((d) => Math.min(4, Math.max(0, Number(d.level) || 0))).join(""),
  contagens: dias.map((d) => Number(d.count) || 0).join(","),
});

export const expandir = ({ inicio, niveis, contagens }: DiasCompactos): Dia[] => {
  if (!inicio) return [];
  const numeros = contagens.split(",").map(Number);
  return [...niveis].map((nivel, i) => ({
    date: dataDaPosicao(inicio, i),
    level: Number(nivel),
    count: numeros[i] || 0,
  }));
};

/** Dia de uma célula a partir da posição: a data não vai no HTML de cada uma. */
export const dataDaPosicao = (inicio: string, indice: number) => {
  const dia = new Date(`${inicio}T12:00:00Z`);
  dia.setUTCDate(dia.getUTCDate() + indice);
  return dia.toISOString().slice(0, 10);
};

/**
 * HTML da grade, dos meses e da faixa de marcos. O Astro injeta no build e o
 * navegador reaproveita ao atualizar, então o desenho existe num lugar só.
 * Cada célula leva só nível e contagem: são 371 delas, e data e atraso da onda
 * saem da posição.
 */
export const htmlGrade = (dias: Dia[], marcos: Marco[]) => {
  const { deslocamento, celulas, meses } = montarGrade(dias);
  const porDia = marcosPorDia(marcos);

  const vazias = '<i class="cell vazia"></i>'.repeat(deslocamento);
  const dias_ = celulas
    .map((c) => {
      const doDia = porDia.get(c.date);
      const extra = doDia
        ? ` data-semana="${c.coluna}" data-repos="${reposDe(doDia)}" data-marcos="${esc(doDia.map((m) => m.texto).join("\n"))}"`
        : "";
      return `<i class="cell" data-level="${c.nivel}" data-count="${Number(c.count) || 0}"${extra}></i>`;
    })
    .join("");

  const rotulos = meses
    .map((m) => `<span style="grid-column:${m.coluna + 1} / span ${m.largura}">${m.largura >= 2 ? m.rotulo : ""}</span>`)
    .join("");

  // uma marca por semana com entrega, alinhada à coluna da grade
  const semanas = new Map<number, Marco[]>();
  for (const c of celulas) {
    const doDia = porDia.get(c.date);
    if (doDia) semanas.set(c.coluna, [...(semanas.get(c.coluna) ?? []), ...doDia]);
  }
  const faixa = [...semanas]
    .map(([coluna, lista]) => `<span class="marco" style="grid-column:${coluna + 1}" data-semana="${coluna}" data-repos="${reposDe(lista)}"></span>`)
    .join("");

  const total = celulas.reduce((soma, c) => soma + (Number(c.count) || 0), 0);
  return { celulas: vazias + dias_, meses: rotulos, faixa, total, inicio: dias[0]?.date ?? "", deslocamento };
};
