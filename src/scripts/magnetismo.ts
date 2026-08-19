import { semMovimento } from "./movimento";

// Leve magnetismo nos ícones: quem está perto do ponteiro cresce e se aproxima
const ALCANCE = 90;

document.querySelectorAll<HTMLElement>(".tec-row").forEach((fila) => {
  const itens = [...fila.querySelectorAll<HTMLElement>(".tec")];
  if (!itens.length) return;
  let pendente = false;

  const soltar = () => {
    itens.forEach((item) => {
      item.style.transform = "";
    });
  };

  fila.addEventListener("pointermove", (event) => {
    if (semMovimento() || pendente) return;
    pendente = true;
    requestAnimationFrame(() => {
      pendente = false;
      itens.forEach((item) => {
        const box = item.getBoundingClientRect();
        const distancia = event.clientX - (box.left + box.width / 2);
        const forca = Math.max(0, 1 - Math.abs(distancia) / ALCANCE);
        if (forca === 0) {
          item.style.transform = "";
          return;
        }
        item.style.transform = `translateX(${distancia * 0.06 * forca}px) scale(${1 + 0.1 * forca})`;
      });
    });
  });

  fila.addEventListener("pointerleave", soltar);
  fila.addEventListener("pointercancel", soltar);
});
