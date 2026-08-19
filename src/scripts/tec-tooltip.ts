// Tooltip das tecnologias: um só elemento para a página inteira, posicionado
// no ponteiro. Aparece com um respiro para não piscar quando o mouse passa reto.
const dica = document.querySelector<HTMLElement>("#tec-tip");
const titulo = dica?.querySelector<HTMLElement>("[data-titulo]");
const texto = dica?.querySelector<HTMLElement>("[data-texto]");

if (dica && titulo && texto) {
  const ESPERA = 140;
  const MARGEM = 8;
  let agendado: number | undefined;

  const esconder = () => {
    window.clearTimeout(agendado);
    dica.dataset.visible = "false";
  };

  const mostrar = (alvo: HTMLElement) => {
    titulo.textContent = alvo.dataset.tec ?? "";
    texto.textContent = alvo.dataset.sobre ?? "";
    dica.dataset.visible = "true";

    // offsetWidth força o reflow: sem isso a medida é a do conteúdo anterior
    const largura = dica.offsetWidth;
    const altura = dica.offsetHeight;

    const caixa = alvo.getBoundingClientRect();
    const meio = caixa.left + caixa.width / 2;
    const maximo = Math.max(MARGEM, window.innerWidth - largura - MARGEM);
    // Posiciona pelo canto: com translate horizontal a conta dependeria da
    // largura duas vezes e vazava a tela nos ícones das pontas
    dica.style.left = `${Math.min(Math.max(meio - largura / 2, MARGEM), maximo)}px`;

    const acima = caixa.top - altura - MARGEM > 0;
    dica.dataset.lado = acima ? "acima" : "abaixo";
    dica.style.top = `${acima ? caixa.top - MARGEM : caixa.bottom + MARGEM}px`;
  };

  const agendar = (alvo: HTMLElement) => {
    window.clearTimeout(agendado);
    agendado = window.setTimeout(() => mostrar(alvo), ESPERA);
  };

  document.addEventListener("pointerover", (event) => {
    const alvo = (event.target as Element)?.closest<HTMLElement>("[data-tec]");
    if (alvo) agendar(alvo);
  });

  document.addEventListener("pointerout", (event) => {
    if ((event.target as Element)?.closest("[data-tec]")) esconder();
  });

  document.addEventListener("focusin", (event) => {
    const alvo = (event.target as Element)?.closest<HTMLElement>("[data-tec]");
    if (alvo) mostrar(alvo);
  });

  document.addEventListener("focusout", esconder);
  window.addEventListener("scroll", esconder, { passive: true });
}
