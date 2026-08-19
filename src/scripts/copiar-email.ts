// Copiar e-mail: webmail no desktop costuma ignorar mailto:
const botao = document.querySelector<HTMLButtonElement>("#copiar-email");
const rotulo = botao?.querySelector<HTMLElement>("[data-rotulo]");

if (botao && rotulo) {
  const textoOriginal = rotulo.textContent ?? "";
  let voltar: number | undefined;

  botao.addEventListener("click", async () => {
    const email = botao.dataset.email;
    if (!email) return;
    let espera = 1500;
    try {
      await navigator.clipboard.writeText(email);
      rotulo.textContent = "copiado";
    } catch {
      // Sem permissão de área de transferência: mostra o e-mail para
      // copiar à mão, e por mais tempo.
      rotulo.textContent = email;
      espera = 4000;
    }
    window.clearTimeout(voltar);
    voltar = window.setTimeout(() => {
      rotulo.textContent = textoOriginal;
    }, espera);
  });
}
