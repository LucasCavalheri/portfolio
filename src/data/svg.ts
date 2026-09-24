// Enxuga o atributo d de um path: duas casas decimais num viewBox de 24 são
// 1/1200 do ícone, invisível a 14px, e os paths do simple-icons chegam a três
// ou mais. Regex não basta: os números vêm colados ("-.329.997") e as flags do
// arco têm um caractere só ("0 01.5" são as flags 0 e 1 seguidas de .5), então
// o path é lido pela gramática do SVG e reescrito com separadores seguros.

const PARAMETROS: Record<string, number> = { m: 2, l: 2, h: 1, v: 1, c: 6, s: 4, q: 4, t: 2, a: 7, z: 0 };
const NUMERO = /[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/y;

export type Segmento = { comando: string; valores: number[] };

/** Lê o path em comandos e valores, respeitando as flags de um caractere do arco. */
export const lerPath = (d: string): Segmento[] => {
  const segmentos: Segmento[] = [];
  let i = 0;
  const pular = () => {
    while (i < d.length && /[\s,]/.test(d[i])) i += 1;
  };

  let comando = "";
  while (true) {
    pular();
    if (i >= d.length) break;
    if (/[a-zA-Z]/.test(d[i])) {
      comando = d[i];
      i += 1;
      if (comando.toLowerCase() === "z") segmentos.push({ comando, valores: [] });
      continue;
    }
    const tipo = comando.toLowerCase();
    const quantos = PARAMETROS[tipo];
    if (!quantos) throw new Error(`path inválido perto de ${i}: ${d.slice(i, i + 12)}`);
    const valores: number[] = [];
    for (let k = 0; k < quantos; k += 1) {
      pular();
      if (tipo === "a" && (k === 3 || k === 4)) {
        valores.push(Number(d[i]));
        i += 1;
        continue;
      }
      NUMERO.lastIndex = i;
      const achado = NUMERO.exec(d);
      if (!achado) throw new Error(`número esperado perto de ${i}: ${d.slice(i, i + 12)}`);
      valores.push(Number(achado[0]));
      i += achado[0].length;
    }
    segmentos.push({ comando, valores });
    // pares depois de um moveto são lineto implícitos
    if (comando === "M") comando = "L";
    if (comando === "m") comando = "l";
  }
  return segmentos;
};

const curto = (valor: number) => {
  let v = Math.round(valor * 100) / 100;
  if (Object.is(v, -0)) v = 0;
  return String(v).replace(/^(-?)0\./, "$1.");
};

/** Reescreve o path com duas casas decimais, sem separador onde ele é dispensável. */
export const enxugarPath = (d: string) => {
  let saida = "";
  let anterior = "";
  let ultimoComando = "";

  for (const { comando, valores } of lerPath(d)) {
    // comando repetido fica implícito, como no original
    const implicito = comando === ultimoComando && comando.toLowerCase() !== "m" && valores.length > 0;
    if (!implicito) {
      saida += comando;
      anterior = comando;
    }
    ultimoComando = comando;

    valores.forEach((valor) => {
      const texto = curto(valor);
      const colaSemEspaco =
        /[a-zA-Z]$/.test(anterior) ||
        texto.startsWith("-") ||
        (texto.startsWith(".") && anterior.includes(".") && !/[eE]/.test(anterior));
      saida += (colaSemEspaco ? "" : " ") + texto;
      anterior = texto;
    });
  }
  return saida;
};
