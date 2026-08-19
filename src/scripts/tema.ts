const root = document.documentElement;
const botao = document.querySelector<HTMLButtonElement>("#theme-toggle");
const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');

const aplicar = (tema: "dark" | "light") => {
  root.dataset.theme = tema;
  if (meta) meta.content = tema === "dark" ? "#050505" : "#ffffff";
  botao?.setAttribute("aria-pressed", String(tema === "dark"));
  try {
    localStorage.setItem("lucas-theme", tema);
  } catch {}
};

aplicar(root.dataset.theme === "light" ? "light" : "dark");

botao?.addEventListener("click", (event) => {
  const proximo = root.dataset.theme === "dark" ? "light" : "dark";
  root.style.setProperty("--theme-x", `${event.clientX}px`);
  root.style.setProperty("--theme-y", `${event.clientY}px`);

  const iniciarTransicao = (document as any).startViewTransition?.bind(document);
  if (!iniciarTransicao || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    aplicar(proximo);
    return;
  }

  // A transição só executa o callback se a aba estiver compondo frames;
  // o timeout garante a troca de tema mesmo quando ela fica pendente.
  let aplicado = false;
  const trocar = () => {
    if (aplicado) return;
    aplicado = true;
    aplicar(proximo);
  };

  const transicao = iniciarTransicao(trocar);
  // Quando a aba não está compondo frames a transição aborta e rejeita:
  // engolir a rejeição evita erro no console.
  transicao?.ready?.catch(() => {});
  transicao?.finished?.catch(() => {});
  setTimeout(trocar, 300);
});
