// Gráfico de contribuições do GitHub
const USUARIO = "LucasCavalheri";
const API = `https://github-contributions-api.jogruber.de/v4/${USUARIO}?y=last`;
const DIAS_VISIVEIS = 371;

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

// A API é de terceiros: guardar a última resposta evita um gráfico vazio
// quando ela cai, e desenha na hora em visitas seguintes.
const CACHE = "lucas-contribuicoes";
const VALIDADE = 12 * 60 * 60 * 1000;

type Dia = { date: string; count: number; level: number };
type Guardado = { em: number; dias: Dia[] };

const lerCache = (): Guardado | null => {
  try {
    const bruto = localStorage.getItem(CACHE);
    if (!bruto) return null;
    const dados = JSON.parse(bruto) as Guardado;
    return Array.isArray(dados.dias) && dados.dias.length ? dados : null;
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
const total = document.querySelector<HTMLElement>("#contrib-total");
const situacao = document.querySelector<HTMLElement>("#contrib-status");
const dica = document.querySelector<HTMLDivElement>("#contrib-tip");
const faixa = document.querySelector<HTMLElement>("#contrib-months");

const formatarData = (iso: string) => {
  const [ano, mes, dia] = iso.split("-");
  return `${dia} ${MESES[Number(mes) - 1]} ${ano}`;
};

const desenharMeses = (dias: Dia[], deslocamento: number, colunas: number) => {
  if (!faixa) return;
  const marcos: { coluna: number; mes: number }[] = [];
  dias.forEach((dia, indice) => {
    const mes = Number(dia.date.split("-")[1]);
    if (marcos[marcos.length - 1]?.mes === mes) return;
    marcos.push({ coluna: Math.floor((indice + deslocamento) / 7), mes });
  });

  faixa.replaceChildren(
    ...marcos.map((marco, i) => {
      const largura = (marcos[i + 1]?.coluna ?? colunas) - marco.coluna;
      const rotulo = document.createElement("span");
      rotulo.style.gridColumn = `${marco.coluna + 1} / span ${Math.max(1, largura)}`;
      rotulo.textContent = largura >= 2 ? MESES[marco.mes - 1] : "";
      return rotulo;
    })
  );
};

// A onda diagonal só dispara quando o gráfico entra na tela
const dispararOnda = (alvo: HTMLElement) => {
  const onda = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        alvo.dataset.in = "true";
        onda.disconnect();
      });
    },
    { threshold: 0.2 }
  );
  onda.observe(alvo);
  setTimeout(() => {
    alvo.dataset.in = "true";
    onda.disconnect();
  }, 1600);
};

const desenhar = (dias: Dia[]) => {
  if (!grid) return;
  const fragmento = document.createDocumentFragment();
  // Preenche o começo para a primeira coluna alinhar com o dia da semana correto
  const deslocamento = new Date(`${dias[0].date}T12:00:00`).getDay();

  for (let i = 0; i < deslocamento; i += 1) {
    const vazio = document.createElement("span");
    vazio.className = "cell";
    vazio.dataset.level = "0";
    vazio.style.visibility = "hidden";
    fragmento.appendChild(vazio);
  }

  dias.forEach((dia, indice) => {
    const celula = document.createElement("span");
    const coluna = Math.floor((indice + deslocamento) / 7);
    const linha = (indice + deslocamento) % 7;
    celula.className = "cell";
    celula.dataset.level = String(Math.min(4, Math.max(0, Number(dia.level) || 0)));
    celula.dataset.date = dia.date;
    celula.dataset.count = String(dia.count);
    celula.style.setProperty("--d", `${coluna * 9 + linha * 22}ms`);
    fragmento.appendChild(celula);
  });

  grid.replaceChildren(fragmento);
  grid.parentElement?.scrollTo({ left: grid.scrollWidth });
  desenharMeses(dias, deslocamento, Math.ceil((dias.length + deslocamento) / 7));
  dispararOnda(grid);
};

if (grid) {
  const posicionarDica = (celula: HTMLElement) => {
    if (!dica) return;
    const box = celula.getBoundingClientRect();
    dica.style.left = `${box.left + box.width / 2}px`;
    dica.style.top = `${box.top}px`;
  };

  grid.addEventListener("pointerover", (event) => {
    const celula = (event.target as Element)?.closest<HTMLElement>(".cell");
    if (!celula?.dataset.date || !dica) return;
    const quantas = Number(celula.dataset.count) || 0;
    dica.textContent = `${formatarData(celula.dataset.date)} · ${quantas} ${quantas === 1 ? "contribuição" : "contribuições"}`;
    posicionarDica(celula);
    dica.dataset.visible = "true";
  });

  grid.addEventListener("pointerleave", () => {
    if (dica) dica.dataset.visible = "false";
  });

  const mostrar = (dias: Dia[]) => {
    const soma = dias.reduce((acc, dia) => acc + (Number(dia.count) || 0), 0);
    if (total) total.textContent = soma.toLocaleString("pt-BR");
    desenhar(dias);
  };

  const guardado = lerCache();
  if (guardado) mostrar(guardado.dias);

  // Cache fresco: nem chega a pedir de novo
  if (!guardado || Date.now() - guardado.em > VALIDADE) {
    fetch(API)
      .then((resposta) => {
        if (!resposta.ok) throw new Error("contribuições indisponíveis");
        return resposta.json();
      })
      .then((dados) => {
        const dias: Dia[] = Array.isArray(dados.contributions)
          ? dados.contributions.slice(-DIAS_VISIVEIS)
          : [];
        if (!dias.length) throw new Error("sem dados");
        gravarCache(dias);
        mostrar(dias);
      })
      .catch(() => {
        // Com cache velho na mão, ele fica; sem nada, avisa discretamente
        if (guardado) return;
        if (total) total.textContent = "—";
        if (situacao) situacao.textContent = "ver no GitHub";
      });
  }
}
