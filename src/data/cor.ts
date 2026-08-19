// Cores de marca não servem em qualquer fundo: o preto do Next.js
// desaparece no tema escuro, o amarelo do Hotwire no tema claro. Aqui a cor
// é clareada ou escurecida só o necessário para ficar legível.

const canais = (hex: string) => {
  const limpo = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(limpo.slice(i, i + 2), 16));
};

const paraHex = (rgb: number[]) =>
  "#" + rgb.map((c) => Math.round(c).toString(16).padStart(2, "0")).join("");

const luminancia = (hex: string) => {
  const [r, g, b] = canais(hex).map((c) => {
    const n = c / 255;
    return n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contraste = (a: string, b: string) => {
  const la = luminancia(a);
  const lb = luminancia(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

const misturar = (a: string, b: string, parte: number) => {
  const ca = canais(a);
  const cb = canais(b);
  return paraHex(ca.map((c, i) => c + (cb[i] - c) * parte));
};

/** Aproxima a cor de marca do fundo até alcançar o contraste mínimo. */
export const legivel = (hex: string, fundo: string, minimo = 3.2) => {
  const alvo = luminancia(fundo) < 0.5 ? "#ffffff" : "#000000";
  for (let parte = 0; parte <= 1.001; parte += 0.05) {
    const candidata = misturar(hex, alvo, parte);
    if (contraste(candidata, fundo) >= minimo) return candidata;
  }
  return alvo;
};

export const FUNDO_ESCURO = "#050505";
export const FUNDO_CLARO = "#ffffff";
