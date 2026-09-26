const botao = document.querySelector<HTMLButtonElement>("#scroll-top");

if (botao) {
  const LIMITE = 200;
  let ultimoY = window.scrollY;
  let parada: number | undefined;
  let agendado = false;

  // Só escreve no DOM quando o valor muda: cada escrita invalida o estilo
  const marcar = (chave: "visible" | "dim", valor: boolean) => {
    const texto = String(valor);
    if (botao.dataset[chave] !== texto) botao.dataset[chave] = texto;
  };

  const atualizar = () => {
    agendado = false;
    const y = window.scrollY;
    const documento = document.documentElement;
    const noFim = y + window.innerHeight >= documento.scrollHeight - 48;

    marcar("visible", y > LIMITE);

    // Desceu: sai da frente. No fim da página fica nítido — é ali que
    // alguém mais quer voltar ao topo.
    if (Math.abs(y - ultimoY) > 4) {
      marcar("dim", y > ultimoY && !noFim);
      ultimoY = y;
    }
    if (noFim) marcar("dim", false);

    window.clearTimeout(parada);
    parada = window.setTimeout(() => marcar("dim", false), 600);
  };

  atualizar();
  // Um cálculo por quadro, não um por evento: rolando rápido chegam vários por quadro
  window.addEventListener(
    "scroll",
    () => {
      if (agendado) return;
      agendado = true;
      requestAnimationFrame(atualizar);
    },
    { passive: true }
  );
  botao.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}
