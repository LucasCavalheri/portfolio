// Sublinhado do menu: segue a seção visível e acompanha o hover
const nav = document.querySelector<HTMLElement>("#nav");
const linha = nav?.querySelector<HTMLElement>(".nav-line");
const links = [...(nav?.querySelectorAll<HTMLAnchorElement>(".nav-link") ?? [])];
const secoes = [...document.querySelectorAll<HTMLElement>("main > section")];

if (nav && linha && links.length) {
  let ativo = links[0];

  const mover = (alvo?: HTMLElement) => {
    if (!alvo) return;
    linha.style.width = `${alvo.offsetWidth}px`;
    linha.style.transform = `translateX(${alvo.offsetLeft}px)`;
    linha.dataset.ready = "true";
  };

  links.forEach((link) => {
    link.addEventListener("pointerenter", () => mover(link));
    link.addEventListener("focus", () => mover(link));
  });

  nav.addEventListener("pointerleave", () => mover(ativo));

  // Qual seção está em foco: marca o link e faz o ponto do título pulsar
  if (secoes.length) {
    const espia = new IntersectionObserver(
      (entries) => {
        const visivel = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visivel) return;
        const id = visivel.target.id;
        secoes.forEach((secao) => {
          secao.dataset.active = String(secao.id === id);
        });
        const link = links.find((item) => item.hash === `#${id}`);
        links.forEach((item) => {
          item.dataset.active = String(item === link);
        });
        if (link) {
          ativo = link;
          mover(link);
        }
      },
      { rootMargin: "-25% 0px -55% 0px", threshold: [0.05, 0.3, 0.6] }
    );

    secoes.forEach((secao) => espia.observe(secao));
  }

  ativo.dataset.active = "true";
  mover(ativo);
  // A largura muda quando a fonte termina de carregar
  document.fonts?.ready.then(() => mover(ativo));
  window.addEventListener("resize", () => mover(ativo));
}
