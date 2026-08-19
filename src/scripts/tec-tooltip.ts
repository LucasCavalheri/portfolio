// Tooltip das tecnologias: um só elemento para a página inteira, posicionado
// no ponteiro. Aparece com um respiro para não piscar quando o mouse passa reto,
// e demora a fechar para dar tempo de alcançar o link dentro dele.
const dica = document.querySelector<HTMLElement>("#tec-tip");
const titulo = dica?.querySelector<HTMLElement>("[data-titulo]");
const texto = dica?.querySelector<HTMLElement>("[data-texto]");
const acao = dica?.querySelector<HTMLAnchorElement>("[data-acao]");

if (dica && titulo && texto && acao) {
  const ESPERA = 140;
  const FECHAR = 220;
  const MARGEM = 8;
  let paraAbrir: number | undefined;
  let paraFechar: number | undefined;

  const cancelar = () => {
    window.clearTimeout(paraAbrir);
    window.clearTimeout(paraFechar);
  };

  const esconder = () => {
    cancelar();
    paraFechar = window.setTimeout(() => {
      dica.dataset.visible = "false";
    }, FECHAR);
  };

  const mostrar = (alvo: HTMLElement) => {
    cancelar();
    titulo.textContent = alvo.dataset.tec ?? "";
    texto.textContent = alvo.dataset.sobre ?? "";
    acao.href = alvo.getAttribute("href") ?? "#";
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

  document.addEventListener("pointerover", (event) => {
    const alvo = (event.target as Element)?.closest<HTMLElement>("[data-tec]");
    if (!alvo) return;
    cancelar();
    paraAbrir = window.setTimeout(() => mostrar(alvo), ESPERA);
  });

  document.addEventListener("pointerout", (event) => {
    const saiuDeIcone = (event.target as Element)?.closest("[data-tec]");
    const entrouNaDica = (event.relatedTarget as Element)?.closest?.("#tec-tip");
    if (saiuDeIcone && !entrouNaDica) esconder();
  });

  // Enquanto o ponteiro está sobre o tooltip, ele fica
  dica.addEventListener("pointerenter", cancelar);
  dica.addEventListener("pointerleave", esconder);

  document.addEventListener("focusin", (event) => {
    const alvo = (event.target as Element)?.closest<HTMLElement>("[data-tec]");
    if (alvo) mostrar(alvo);
  });

  document.addEventListener("focusout", esconder);
  window.addEventListener("scroll", esconder, { passive: true });
}
