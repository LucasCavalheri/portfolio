// Cores de marca não servem em qualquer fundo: o preto do Next.js desaparece
// no tema escuro e o amarelo do JavaScript quase não aparece no claro.
//
// O ajuste é feito em HSL, mexendo na luminosidade e subindo a saturação: se
// misturássemos com preto, o amarelo viraria oliva e perderia a identidade.
// O piso de contraste é menor no tema claro de propósito — o ícone acompanha o
// nome escrito, então vale mais manter a cor reconhecível do que forçar 3:1.

const canais = (hex: string) => {
  const limpo = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(limpo.slice(i, i + 2), 16) / 255);
};

const paraHex = (rgb: number[]) =>
  "#" + rgb.map((c) => Math.round(c * 255).toString(16).padStart(2, "0")).join("");

const luminancia = (hex: string) => {
  const [r, g, b] = canais(hex).map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contraste = (a: string, b: string) => {
  const la = luminancia(a);
  const lb = luminancia(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

const paraHsl = ([r, g, b]: number[]) => {
  const maior = Math.max(r, g, b);
  const menor = Math.min(r, g, b);
  const luz = (maior + menor) / 2;
  if (maior === menor) return { matiz: 0, sat: 0, luz };

  const d = maior - menor;
  const sat = luz > 0.5 ? d / (2 - maior - menor) : d / (maior + menor);
  const matiz =
    maior === r
      ? ((g - b) / d + (g < b ? 6 : 0)) / 6
      : maior === g
        ? ((b - r) / d + 2) / 6
        : ((r - g) / d + 4) / 6;
  return { matiz, sat, luz };
};

const paraRgb = (matiz: number, sat: number, luz: number) => {
  if (sat === 0) return [luz, luz, luz];
  const q = luz < 0.5 ? luz * (1 + sat) : luz + sat - luz * sat;
  const p = 2 * luz - q;
  const canal = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [canal(matiz + 1 / 3), canal(matiz), canal(matiz - 1 / 3)];
};

export const FUNDO_ESCURO = "#050505";
export const FUNDO_CLARO = "#ffffff";

/** Aproxima a cor de marca do contraste mínimo sem perder o matiz. */
export const legivel = (hex: string, fundo: string) => {
  const escuro = luminancia(fundo) < 0.5;
  const minimo = escuro ? 3 : 1.6;
  if (contraste(hex, fundo) >= minimo) return hex.toLowerCase();

  const { matiz, sat, luz } = paraHsl(canais(hex));
  let cor = hex;
  for (let passo = 1; passo <= 25; passo += 1) {
    const novaLuz = escuro
      ? Math.min(1, luz + passo * 0.03)
      : Math.max(0, luz - passo * 0.03);
    // saturação sobe junto para a cor não esmaecer ao escurecer
    const novaSat = Math.min(1, sat * (1 + passo * 0.05));
    cor = paraHex(paraRgb(matiz, novaSat, novaLuz));
    if (contraste(cor, fundo) >= minimo) break;
  }
  return cor;
};
