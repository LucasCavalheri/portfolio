const botao = document.querySelector<HTMLButtonElement>("#scroll-top");

if (botao) {
  let ultimoY = window.scrollY;

  const atualizar = () => {
    const y = window.scrollY;
    botao.dataset.visible = String(y > 200);
    if (Math.abs(y - ultimoY) > 4) {
      botao.dataset.direction = y > ultimoY ? "down" : "up";
      ultimoY = y;
    }
  };

  atualizar();
  window.addEventListener("scroll", atualizar, { passive: true });
  botao.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}
