// Reveal por scroll: cada bloco entra quando chega na tela
const blocos = [...document.querySelectorAll<HTMLElement>("[data-anim]")];

if (blocos.length) {
  const revelador = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        (entry.target as HTMLElement).dataset.in = "true";
        revelador.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.15 }
  );

  blocos.forEach((el) => revelador.observe(el));

  // Rede de segurança: se o observer não rodar (aba em segundo plano, navegador
  // sem suporte), o conteúdo aparece de qualquer forma.
  setTimeout(() => {
    blocos.forEach((el) => {
      el.dataset.in = "true";
    });
    revelador.disconnect();
  }, 1600);
}
