const botao = document.querySelector<HTMLButtonElement>("#scroll-top");

if (botao) {
  const LIMITE = 200;
  let ultimoY = window.scrollY;
  let parada: number | undefined;

  const atualizar = () => {
    const y = window.scrollY;
    const documento = document.documentElement;
    const noFim = y + window.innerHeight >= documento.scrollHeight - 48;

    botao.dataset.visible = String(y > LIMITE);

    // Desceu: sai da frente. No fim da página fica nítido — é ali que
    // alguém mais quer voltar ao topo.
    if (Math.abs(y - ultimoY) > 4) {
      botao.dataset.dim = String(y > ultimoY && !noFim);
      ultimoY = y;
    }
    if (noFim) botao.dataset.dim = "false";

    window.clearTimeout(parada);
    parada = window.setTimeout(() => {
      botao.dataset.dim = "false";
    }, 600);
  };

  atualizar();
  window.addEventListener("scroll", atualizar, { passive: true });
  botao.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}
