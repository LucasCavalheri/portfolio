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

/** Distância do clique até o canto mais distante: o círculo cresce só o necessário. */
const raioAte = (x: number, y: number) => {
  const l = window.innerWidth;
  const a = window.innerHeight;
  return Math.max(
    Math.hypot(x, y),
    Math.hypot(l - x, y),
    Math.hypot(x, a - y),
    Math.hypot(l - x, a - y)
  );
};

botao?.addEventListener("click", (event) => {
  const proximo = root.dataset.theme === "dark" ? "light" : "dark";
  const x = event.clientX || window.innerWidth / 2;
  const y = event.clientY || 0;
  root.style.setProperty("--theme-x", `${x}px`);
  root.style.setProperty("--theme-y", `${y}px`);
  root.style.setProperty("--theme-r", `${Math.ceil(raioAte(x, y))}px`);

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

  // enquanto o círculo cresce, efeitos caros de composição ficam suspensos
  root.dataset.trocando = "";
  const liberar = () => delete root.dataset.trocando;

  const transicao = iniciarTransicao(trocar);
  // Quando a aba não está compondo frames a transição aborta e rejeita:
  // engolir a rejeição evita erro no console.
  transicao?.ready?.catch(() => {});
  transicao?.finished?.then(liberar).catch(liberar);
  setTimeout(trocar, 300);
  setTimeout(liberar, 900);
});
